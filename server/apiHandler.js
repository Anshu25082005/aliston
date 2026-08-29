import { readDB, writeDB, resetDB } from "./dbManager.js";

export const handleApiRequest = async (req, res) => {
  const url = req.url || "";
  const method = req.method || "GET";

  res.setHeader("Content-Type", "application/json");
  res.setHeader("Access-Control-Allow-Origin", "*");
  res.setHeader("Access-Control-Allow-Methods", "GET, POST, PUT, DELETE, OPTIONS");
  res.setHeader("Access-Control-Allow-Headers", "Content-Type, Authorization");

  if (method === "OPTIONS") { res.statusCode = 204; res.end(); return; }

  // Parse body
  let body = {};
  if (method === "POST" || method === "PUT" || method === "DELETE") {
    if (req.body !== undefined && req.body !== null) {
      body = typeof req.body === "string" ? JSON.parse(req.body) : req.body;
    } else {
      try {
        const buffers = [];
        for await (const chunk of req) buffers.push(chunk);
        const str = Buffer.concat(buffers).toString("utf-8");
        if (str) body = JSON.parse(str);
      } catch (e) {}
    }
  }

  // 1. Health
  if (url === "/api/health" || url.startsWith("/api/health?")) {
    res.statusCode = 200;
    res.end(JSON.stringify({ status: "ok", timestamp: Date.now(), storage: process.env.UPSTASH_REDIS_REST_URL ? "redis" : "local" }));
    return;
  }

  // 2. Auth: Login
  if (url === "/api/auth/login" && method === "POST") {
    const db = await readDB();
    const cleanEmail = (body.email || "").trim().toLowerCase();
    const cleanPassword = (body.password || "").trim();
    const users = db.USERS || [];
    let found = users.find(u => u.email.toLowerCase() === cleanEmail && u.password === cleanPassword);
    if (!found && (cleanEmail === "studioaliston@gmail.com" || cleanEmail === "studioaliston2@gmail.com") && cleanPassword === "pdmmay2026") {
      found = { id: "user-admin", email: cleanEmail, name: "Aliston Studio Admin", role: "Administrator" };
    }
    if (found) {
      const session = { id: found.id, email: found.email, name: found.name, role: found.role, loginTime: new Date().toISOString(), remember: !!body.remember };
      res.statusCode = 200;
      res.end(JSON.stringify({ success: true, user: session }));
    } else {
      res.statusCode = 401;
      res.end(JSON.stringify({ success: false, message: "Invalid Login ID or Password." }));
    }
    return;
  }

  // 3. Auth: Change Password
  if (url === "/api/auth/change-password" && method === "POST") {
    const db = await readDB();
    const { email, oldPassword, newPassword } = body;
    const users = db.USERS || [];
    const idx = users.findIndex(u => u.email.toLowerCase() === (email || "").toLowerCase() && u.password === oldPassword);
    if (idx !== -1) {
      users[idx].password = newPassword;
      db.USERS = users;
      await writeDB(db);
      res.statusCode = 200;
      res.end(JSON.stringify({ success: true, message: "Password updated successfully." }));
    } else {
      res.statusCode = 400;
      res.end(JSON.stringify({ success: false, message: "Current password is incorrect." }));
    }
    return;
  }

  // 4. Reset
  if (url === "/api/reset" && method === "POST") {
    const db = await resetDB();
    res.statusCode = 200;
    res.end(JSON.stringify({ success: true, message: "Server database reset.", db }));
    return;
  }

  // 5. Invoices + Stock Deduction
  if (url === "/api/invoices" && method === "POST") {
    const db = await readDB();
    const invoiceData = body;
    const settings = db.SETTINGS || {};
    const stockList = db.STOCK || [];
    const products = db.PRODUCTS || [];

    for (const item of (invoiceData.items || [])) {
      const product = products.find(p => p.id === item.productId);
      const productName = product ? product.name : "Shirt Item";
      let stockEntry = stockList.find(s => s.productId === item.productId && s.color.toLowerCase() === (item.color || "").toLowerCase());
      if (!stockEntry) {
        stockEntry = { productId: item.productId, productName, color: item.color || "Default", fabric: product ? product.fabric : "", sizes: { S: 0, M: 0, L: 0, XL: 0, XXL: 0, XXXL: 0 }, total: 0 };
        stockList.push(stockEntry);
      }
      const currentQty = stockEntry.sizes[item.size] || 0;
      const newQty = currentQty - item.qty;
      if (!settings.allowNegativeStock && newQty < 0) {
        res.statusCode = 400;
        res.end(JSON.stringify({ success: false, message: `Insufficient stock for ${productName} (${item.color} - Size ${item.size}). Available: ${currentQty}, Requested: ${item.qty}.` }));
        return;
      }
      stockEntry.sizes[item.size] = newQty;
      stockEntry.total = Object.values(stockEntry.sizes).reduce((sum, v) => sum + v, 0);
      if (!db.STOCK_TRANSACTIONS) db.STOCK_TRANSACTIONS = [];
      db.STOCK_TRANSACTIONS.unshift({ id: "stx-" + Date.now() + "-" + Math.floor(Math.random() * 1000), timestamp: new Date().toISOString(), productId: item.productId, productName, color: item.color, size: item.size, transactionType: "SALES_INVOICE", refNo: invoiceData.invoiceNo, changeQty: -item.qty, previousQty: currentQty, newQty, createdBy: "studioaliston@gmail.com", remarks: `Sales Invoice to ${invoiceData.customerName}` });
    }

    // Save customer
    if (invoiceData.customerName && invoiceData.customerName.trim()) {
      const customers = db.CUSTOMERS || [];
      const exists = customers.find(c => c.name.toLowerCase() === invoiceData.customerName.trim().toLowerCase());
      if (!exists) {
        customers.push({ id: "cust-" + Date.now(), name: invoiceData.customerName.trim(), company: invoiceData.companyName || "", phone: invoiceData.mobile || "", gstin: invoiceData.customerGST || "UNREGISTERED", address: invoiceData.customerAddress || "" });
        db.CUSTOMERS = customers;
      }
    }

    const invoices = db.INVOICES || [];
    const newInvoice = { id: "inv-" + Date.now(), ...invoiceData, status: "SAVED", createdAt: new Date().toISOString() };
    settings.invoiceSeq = (settings.invoiceSeq || 1001) + 1;
    db.SETTINGS = settings;
    db.STOCK = stockList;
    invoices.unshift(newInvoice);
    db.INVOICES = invoices;
    await writeDB(db);
    res.statusCode = 200;
    res.end(JSON.stringify({ success: true, invoice: newInvoice, db }));
    return;
  }

  // 6. Production Entry
  if (url === "/api/production" && method === "POST") {
    const db = await readDB();
    const { productId, color, sizeQuantities, batchNo, workerTailor, remarks, userEmail } = body;
    const totalQty = Object.values(sizeQuantities || {}).reduce((acc, v) => acc + (parseInt(v) || 0), 0);
    if (totalQty <= 0) { res.statusCode = 400; res.end(JSON.stringify({ success: false, message: "Production quantity must be > 0." })); return; }

    const boms = db.BOMS || {};
    const bom = boms[productId];
    if (bom) {
      const materials = db.MATERIALS || [];
      if (bom.fabric && bom.fabric.materialId) {
        const mat = materials.find(m => m.id === bom.fabric.materialId);
        if (mat) mat.currentStock = Math.max(0, (mat.currentStock || 0) - ((parseFloat(bom.fabric.consumption) || 0) * totalQty));
      }
      if (bom.button && bom.button.materialId) {
        const mat = materials.find(m => m.id === bom.button.materialId);
        if (mat) mat.currentStock = Math.max(0, (mat.currentStock || 0) - ((parseFloat(bom.button.quantity) || 0) * totalQty));
      }
      db.MATERIALS = materials;
    }

    const stockList = db.STOCK || [];
    const products = db.PRODUCTS || [];
    const product = products.find(p => p.id === productId);
    let stockEntry = stockList.find(s => s.productId === productId && s.color.toLowerCase() === (color || "").toLowerCase());
    if (!stockEntry) {
      stockEntry = { productId, productName: product ? product.name : "Shirt Item", color, fabric: product ? product.fabric : "", sizes: { S: 0, M: 0, L: 0, XL: 0, XXL: 0, XXXL: 0 }, total: 0 };
      stockList.push(stockEntry);
    }
    if (!db.STOCK_TRANSACTIONS) db.STOCK_TRANSACTIONS = [];
    for (const [sz, qty] of Object.entries(sizeQuantities)) {
      const num = parseInt(qty) || 0;
      if (num > 0) {
        const currentQty = stockEntry.sizes[sz] || 0;
        const newQty = currentQty + num;
        stockEntry.sizes[sz] = newQty;
        db.STOCK_TRANSACTIONS.unshift({ id: "stx-" + Date.now() + "-" + Math.floor(Math.random() * 1000), timestamp: new Date().toISOString(), productId, productName: product ? product.name : "Shirt Item", color, size: sz, transactionType: "PRODUCTION", refNo: batchNo || "PRD-" + Date.now(), changeQty: num, previousQty: currentQty, newQty, createdBy: userEmail || "studioaliston@gmail.com", remarks: `Batch ${batchNo} by ${workerTailor || "Tailors"}` });
      }
    }
    stockEntry.total = Object.values(stockEntry.sizes).reduce((sum, v) => sum + v, 0);
    const newProduction = { id: "prd-" + Date.now(), productionNo: "PRD-" + new Date().getFullYear() + "-" + String((db.PRODUCTIONS || []).length + 1).padStart(3, "0"), date: new Date().toISOString().split("T")[0], productId, productName: product ? product.name : "Shirt", color, sizeQuantities, totalQty, batchNo: batchNo || "BATCH-" + Date.now(), unitProductionCost: product ? product.costPrice : 0, totalProductionCost: (product ? product.costPrice : 0) * totalQty, workerTailor: workerTailor || "In-House", remarks };
    if (!db.PRODUCTIONS) db.PRODUCTIONS = [];
    db.PRODUCTIONS.unshift(newProduction);
    db.STOCK = stockList;
    await writeDB(db);
    res.statusCode = 200;
    res.end(JSON.stringify({ success: true, production: newProduction, db }));
    return;
  }

  // 7. Generic GET /api/data/:table
  if (url.startsWith("/api/data/") && method === "GET") {
    const tableName = url.replace("/api/data/", "").split("?")[0].toUpperCase();
    const db = await readDB();
    if (tableName in db) {
      res.statusCode = 200;
      res.end(JSON.stringify({ success: true, data: db[tableName] }));
    } else {
      res.statusCode = 404;
      res.end(JSON.stringify({ success: false, message: `Table ${tableName} not found.` }));
    }
    return;
  }

  // 8. Generic POST /api/data/:table
  if (url.startsWith("/api/data/") && (method === "POST" || method === "DELETE")) {
    const tableName = url.replace("/api/data/", "").split("?")[0].toUpperCase();
    const db = await readDB();
    db[tableName] = body;
    await writeDB(db);
    res.statusCode = 200;
    res.end(JSON.stringify({ success: true, message: `${tableName} saved to persistent storage.`, data: db[tableName] }));
    return;
  }

  // 9. Full DB GET
  if (url === "/api/db" && method === "GET") {
    const db = await readDB();
    res.statusCode = 200;
    res.end(JSON.stringify({ success: true, db }));
    return;
  }

  res.statusCode = 404;
  res.end(JSON.stringify({ error: "Endpoint not found" }));
};
