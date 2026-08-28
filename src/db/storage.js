// Persistent Online Storage & Backend API Sync Layer for ALISTON ERP

import {
  INITIAL_COMPANY_DETAILS,
  INITIAL_SETTINGS,
  INITIAL_USERS,
  INITIAL_CATEGORIES,
  INITIAL_SUPPLIERS,
  INITIAL_CUSTOMERS,
  INITIAL_MATERIALS,
  INITIAL_PRODUCTS,
  INITIAL_BOMS,
  INITIAL_STOCK,
  INITIAL_STOCK_TRANSACTIONS,
  INITIAL_PURCHASES,
  INITIAL_PRODUCTIONS,
  INITIAL_INVOICES,
  INITIAL_RETURNS,
  INITIAL_EXPENSES,
  INITIAL_ORDERS
} from './initialData.js';

const STORAGE_KEYS = {
  COMPANY: 'aliston_company',
  SETTINGS: 'aliston_settings',
  USERS: 'aliston_users',
  CATEGORIES: 'aliston_categories',
  SUPPLIERS: 'aliston_suppliers',
  CUSTOMERS: 'aliston_customers',
  MATERIALS: 'aliston_materials',
  PRODUCTS: 'aliston_products',
  BOMS: 'aliston_boms',
  STOCK: 'aliston_stock',
  STOCK_TRANSACTIONS: 'aliston_stock_tx',
  PURCHASES: 'aliston_purchases',
  PRODUCTIONS: 'aliston_productions',
  INVOICES: 'aliston_invoices',
  RETURNS: 'aliston_returns',
  EXPENSES: 'aliston_expenses',
  ORDERS: 'aliston_orders',
  AUTH: 'aliston_auth_session'
};

// Helper to manage deleted item IDs persistently per table
export const getDeletedIds = (key) => {
  try {
    const raw = localStorage.getItem(`aliston_deleted_${key.toUpperCase()}`);
    return raw ? JSON.parse(raw) : [];
  } catch (e) {
    return [];
  }
};

export const markIdDeleted = (key, id) => {
  if (!id) return;
  const deleted = getDeletedIds(key);
  if (!deleted.includes(id)) {
    deleted.push(id);
    localStorage.setItem(`aliston_deleted_${key.toUpperCase()}`, JSON.stringify(deleted));
  }
};

export const clearDeletedIds = (key) => {
  if (key) {
    localStorage.removeItem(`aliston_deleted_${key.toUpperCase()}`);
  } else {
    Object.keys(STORAGE_KEYS).forEach(k => localStorage.removeItem(`aliston_deleted_${k}`));
  }
};

// Sync whole DB from server and notify listeners if data changed
export const syncWithServerDB = async () => {
  try {
    const res = await fetch('/api/db');
    if (res.ok) {
      const { db } = await res.json();
      if (db) {
        let hasChanges = false;
        Object.keys(db).forEach(key => {
          if (STORAGE_KEYS[key]) {
            const tableKey = key.toUpperCase();
            const currentRaw = localStorage.getItem(STORAGE_KEYS[tableKey]);
            let serverData = db[key];

            // Filter out deleted IDs from server response so server polling never resurrects deleted items
            if (Array.isArray(serverData)) {
              const deletedIds = getDeletedIds(tableKey);
              if (deletedIds.length > 0) {
                serverData = serverData.filter(item => item && item.id && !deletedIds.includes(item.id));
              }
            }

            const newRaw = JSON.stringify(serverData);
            if (currentRaw !== newRaw) {
              localStorage.setItem(STORAGE_KEYS[tableKey], newRaw);
              hasChanges = true;
            }
          }
        });
        if (hasChanges) {
          window.dispatchEvent(new CustomEvent('aliston-db-updated', { detail: { key: 'ALL' } }));
        }
        return db;
      }
    }
  } catch (err) {
    console.warn('Could not sync with server DB:', err);
  }
  return null;
};

// Initialize DB and fetch server state
export const initDB = async () => {
  await syncWithServerDB();
};

// Generic getItem / setItem
export const getData = (key) => {
  try {
    const raw = localStorage.getItem(STORAGE_KEYS[key.toUpperCase()]);
    if (!raw) return null;
    let parsed = JSON.parse(raw);
    if (Array.isArray(parsed)) {
      const deletedIds = getDeletedIds(key);
      if (deletedIds.length > 0) {
        parsed = parsed.filter(item => item && item.id && !deletedIds.includes(item.id));
      }

      // Enforce zero minimum constraint on stock items
      if (key.toUpperCase() === 'STOCK') {
        let cleaned = false;
        parsed.forEach(stockItem => {
          if (stockItem && stockItem.sizes) {
            Object.keys(stockItem.sizes).forEach(sz => {
              const original = stockItem.sizes[sz];
              const safe = Math.max(0, parseInt(original) || 0);
              if (original !== safe) {
                stockItem.sizes[sz] = safe;
                cleaned = true;
              }
            });
            const newTotal = Object.values(stockItem.sizes).reduce((sum, v) => sum + v, 0);
            if (stockItem.total !== newTotal) {
              stockItem.total = newTotal;
              cleaned = true;
            }
          }
        });
        if (cleaned) {
          try {
            localStorage.setItem(STORAGE_KEYS.STOCK, JSON.stringify(parsed));
          } catch (e) {}
        }
      }
    }
    return parsed;
  } catch (e) {
    console.error(`Error reading ${key}`, e);
    return null;
  }
};

export const saveData = async (key, data) => {
  const tableKey = key.toUpperCase();
  try {
    let cleanData = data;
    if (Array.isArray(data)) {
      const deletedIds = getDeletedIds(tableKey);
      if (deletedIds.length > 0) {
        cleanData = data.filter(item => item && item.id && !deletedIds.includes(item.id));
      }
    }

    // 1. Update local cache for instant UI response
    localStorage.setItem(STORAGE_KEYS[tableKey], JSON.stringify(cleanData));
    window.dispatchEvent(new CustomEvent('aliston-db-updated', { detail: { key } }));

    // 2. Sync to Server DB
    fetch(`/api/data/${tableKey}`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(cleanData)
    }).catch(err => console.warn(`Failed to sync ${key} to server:`, err));
  } catch (e) {
    console.error(`Error saving ${key}`, e);
  }
};

// Auth session management
export const getCurrentUser = () => {
  const session = localStorage.getItem(STORAGE_KEYS.AUTH);
  return session ? JSON.parse(session) : null;
};

export const loginUser = async (email, password, remember = false) => {
  const cleanEmail = (email || '').trim();
  const cleanPassword = (password || '').trim();
  try {
    const res = await fetch('/api/auth/login', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email: cleanEmail, password: cleanPassword, remember })
    });
    const result = await res.json();
    if (res.ok && result.success) {
      localStorage.setItem(STORAGE_KEYS.AUTH, JSON.stringify(result.user));
      return { success: true, user: result.user };
    }
    return { success: false, message: result.message || 'Invalid Login ID or Password.' };
  } catch (err) {
    // Fallback if network drops
    const users = getData('USERS') || INITIAL_USERS;
    const found = users.find(u => u.email.toLowerCase() === cleanEmail.toLowerCase() && u.password === cleanPassword);
    if (found || ((cleanEmail.toLowerCase() === 'studioaliston@gmail.com' || cleanEmail.toLowerCase() === 'studioaliston2@gmail.com') && cleanPassword === 'pdmmay2026')) {
      const sessionData = {
        id: found ? found.id : 'user-admin',
        email: cleanEmail,
        name: found ? found.name : 'Aliston Studio Admin',
        role: found ? found.role : 'Administrator',
        loginTime: new Date().toISOString(),
        remember
      };
      localStorage.setItem(STORAGE_KEYS.AUTH, JSON.stringify(sessionData));
      return { success: true, user: sessionData };
    }
    return { success: false, message: 'Invalid Login ID or Password.' };
  }
};

export const logoutUser = () => {
  localStorage.removeItem(STORAGE_KEYS.AUTH);
};

export const updatePassword = async (email, oldPassword, newPassword) => {
  try {
    const res = await fetch('/api/auth/change-password', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email, oldPassword, newPassword })
    });
    const data = await res.json();
    if (res.ok && data.success) {
      const users = getData('USERS') || INITIAL_USERS;
      const index = users.findIndex(u => u.email.toLowerCase() === email.toLowerCase());
      if (index !== -1) {
        users[index].password = newPassword;
        saveData('USERS', users);
      }
      return { success: true, message: data.message };
    }
    return { success: false, message: data.message || 'Failed to update password.' };
  } catch (err) {
    return { success: false, message: 'Server connection error. Cannot update password offline.' };
  }
};

// Reset database
export const resetToInitialData = async () => {
  try {
    const dataKeys = [
      'SUPPLIERS', 'CUSTOMERS', 'MATERIALS', 'PRODUCTS', 'BOMS', 
      'STOCK', 'STOCK_TRANSACTIONS', 'PURCHASES', 'PRODUCTIONS', 
      'INVOICES', 'RETURNS', 'EXPENSES', 'ORDERS'
    ];
    dataKeys.forEach(k => {
      if (STORAGE_KEYS[k]) {
        localStorage.setItem(STORAGE_KEYS[k], k === 'BOMS' ? JSON.stringify({}) : JSON.stringify([]));
      }
      localStorage.removeItem(`aliston_deleted_${k}`);
    });
    clearDeletedIds();

    const res = await fetch('/api/reset', { method: 'POST' });
    if (res.ok) {
      await syncWithServerDB();
    }
    window.dispatchEvent(new CustomEvent('aliston-db-updated', { detail: { key: 'ALL' } }));
    return { success: true };
  } catch (err) {
    console.warn('Reset failed:', err);
  }
  return { success: false };
};

// Finished Goods Stock Management
export const updateFinishedStock = ({
  productId,
  color,
  size,
  changeQty,
  transactionType,
  refNo,
  remarks,
  userEmail = 'studioaliston@gmail.com'
}) => {
  const settings = getData('SETTINGS') || INITIAL_SETTINGS;
  const stockList = getData('STOCK') || [];
  const products = getData('PRODUCTS') || [];
  const product = products.find(p => p.id === productId);
  const productName = product ? product.name : 'Garment Item';
  const fabric = product ? product.fabric : 'Fabric';

  let stockEntry = stockList.find(s => s.productId === productId && s.color.toLowerCase() === color.toLowerCase());

  if (!stockEntry) {
    stockEntry = {
      productId,
      productName,
      color,
      fabric,
      sizes: { S: 0, M: 0, L: 0, XL: 0, XXL: 0, XXXL: 0 },
      total: 0
    };
    stockList.push(stockEntry);
  }

  const currentSizeQty = Math.max(0, stockEntry.sizes[size] || 0);
  const rawNewQty = currentSizeQty + changeQty;
  const newSizeQty = Math.max(0, rawNewQty);

  if (changeQty < 0 && Math.abs(changeQty) > currentSizeQty) {
    return {
      success: false,
      message: `Insufficient stock for ${productName} (${color} - Size ${size}). Available stock: ${currentSizeQty} pcs. Cannot reduce stock below 0.`
    };
  }

  stockEntry.sizes[size] = newSizeQty;
  // Ensure all sizes in entry are non-negative
  Object.keys(stockEntry.sizes).forEach(sz => {
    stockEntry.sizes[sz] = Math.max(0, stockEntry.sizes[sz] || 0);
  });
  stockEntry.total = Object.values(stockEntry.sizes).reduce((sum, val) => sum + val, 0);

  saveData('STOCK', stockList);

  const transactions = getData('STOCK_TRANSACTIONS') || [];
  const auditEntry = {
    id: 'stx-' + Date.now() + '-' + Math.floor(Math.random() * 1000),
    timestamp: new Date().toISOString(),
    productId,
    productName,
    color,
    size,
    transactionType,
    refNo: refNo || 'TX-' + Date.now(),
    changeQty,
    previousQty: currentSizeQty,
    newQty: newSizeQty,
    createdBy: userEmail,
    remarks: remarks || ''
  };
  transactions.unshift(auditEntry);
  saveData('STOCK_TRANSACTIONS', transactions);

  return { success: true, newQty: newSizeQty, stockEntry };
};

// Raw Material Stock Management
export const updateRawMaterialStock = ({ materialId, changeQty, remarks = '' }) => {
  const materials = getData('MATERIALS') || [];
  const matIndex = materials.findIndex(m => m.id === materialId);
  if (matIndex !== -1) {
    const current = materials[matIndex].currentStock || 0;
    materials[matIndex].currentStock = Math.max(0, current + changeQty);
    saveData('MATERIALS', materials);
    return { success: true, newStock: materials[matIndex].currentStock };
  }
  return { success: false, message: 'Material not found.' };
};

// Process Production Entry via Server API
export const processProductionEntry = async (productionData) => {
  try {
    const res = await fetch('/api/production', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(productionData)
    });
    const data = await res.json();
    if (res.ok && data.success) {
      await syncWithServerDB();
      return { success: true, message: 'Production entry recorded on server!', production: data.production };
    }
    return { success: false, message: data.message || 'Production entry failed on server.' };
  } catch (err) {
    return { success: false, message: 'Cannot create production entry while offline. Server unreachable.' };
  }
};

// Process Sales Invoice via Server API
export const saveSalesInvoice = async (invoiceData) => {
  try {
    const res = await fetch('/api/invoices', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(invoiceData)
    });
    const data = await res.json();
    if (res.ok && data.success) {
      await syncWithServerDB();
      return { success: true, invoice: data.invoice };
    }
    return { success: false, message: data.message || 'Invoice creation failed on server.' };
  } catch (err) {
    return { success: false, message: 'Cannot create invoice while offline. Server unreachable.' };
  }
};

// Process Sales Return
export const saveSalesReturn = (returnData) => {
  for (const item of returnData.items) {
    updateFinishedStock({
      productId: item.productId,
      color: item.color,
      size: item.size,
      changeQty: item.qty,
      transactionType: 'SALES_RETURN',
      refNo: returnData.returnNo,
      remarks: `Sales Return from Invoice ${returnData.invoiceNo}: ${item.reason || ''}`
    });
  }

  const returns = getData('RETURNS') || [];
  const newReturn = {
    id: 'ret-' + Date.now(),
    ...returnData,
    createdAt: new Date().toISOString()
  };

  returns.unshift(newReturn);
  saveData('RETURNS', returns);

  return { success: true, salesReturn: newReturn };
};
