import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const DB_FILE_PATH = path.join(__dirname, "data", "db.json");

export const INITIAL_DB = {
  COMPANY: {
    name: "ALISTON MEN'S WEAR",
    legalName: "Shree Ram Enterprise (ALISTON)",
    address: "Plot 42, Garment Industrial Zone, Opp. Textile Market, Surat, Gujarat - 395002",
    gstin: "24AABCS9876E1Z5",
    phone: "+91 98765 43210",
    email: "studioaliston@gmail.com",
    website: "www.alistonmenswear.com",
    bankName: "HDFC Bank Ltd",
    accountNo: "50200049281726",
    ifsc: "HDFC0001234",
    branch: "Textile Market Branch, Surat",
    invoicePrefix: "AL/2026-27/",
    terms: [
      "1. Goods once sold will not be taken back without valid inspection.",
      "2. Interest @ 18% p.a. will be charged if payment is delayed beyond 15 days.",
      "3. Subject to Surat Jurisdiction only."
    ]
  },
  SETTINGS: { allowNegativeStock: false, minStockThreshold: 10, tallyTheme: "dark", invoiceSeq: 1001 },
  USERS: [
    { id: "user-1", email: "studioaliston@gmail.com", password: "pdmmay2026", name: "Aliston Studio Admin", role: "Administrator" },
    { id: "user-2", email: "studioaliston2@gmail.com", password: "pdmmay2026", name: "Aliston Studio Admin 2", role: "Administrator" }
  ],
  CATEGORIES: [
    { id: "cat-1", name: "Formal Shirt", code: "FSH" },
    { id: "cat-2", name: "Casual Shirt", code: "CSH" },
    { id: "cat-3", name: "Linen Shirt", code: "LSH" },
    { id: "cat-4", name: "Cotton Shirt", code: "CTN" },
    { id: "cat-5", name: "Giza Cotton Shirt", code: "GZA" },
    { id: "cat-6", name: "Trouser/Pant", code: "TRS" },
    { id: "cat-7", name: "Other", code: "OTH" }
  ],
  SUPPLIERS: [], CUSTOMERS: [], MATERIALS: [], PRODUCTS: [], BOMS: {},
  STOCK: [], STOCK_TRANSACTIONS: [], PURCHASES: [], PRODUCTIONS: [],
  INVOICES: [], RETURNS: [], EXPENSES: [], ORDERS: [], FABRIC_DISPATCHES: []
};

const sanitizeStock = (db) => {
  if (db && Array.isArray(db.STOCK)) {
    db.STOCK.forEach(s => {
      if (s && s.sizes) {
        Object.keys(s.sizes).forEach(sz => {
          s.sizes[sz] = Math.max(0, parseInt(s.sizes[sz]) || 0);
        });
        s.total = Object.values(s.sizes).reduce((sum, v) => sum + v, 0);
      }
    });
  }
  return db;
};

// ── LOCAL LAPTOP READ ─────────────────────────────────────────────────────────
export const readDB = async () => {
  try {
    if (fs.existsSync(DB_FILE_PATH)) {
      const raw = fs.readFileSync(DB_FILE_PATH, "utf-8");
      const db = JSON.parse(raw);
      return sanitizeStock({ ...INITIAL_DB, ...db });
    }
  } catch (e) {
    console.error("Local DB read error:", e);
  }
  return sanitizeStock(JSON.parse(JSON.stringify(INITIAL_DB)));
};

// ── LOCAL LAPTOP WRITE ────────────────────────────────────────────────────────
export const writeDB = async (data) => {
  try {
    const dir = path.join(__dirname, "data");
    if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
    fs.writeFileSync(DB_FILE_PATH, JSON.stringify(data, null, 2), "utf-8");
  } catch (e) {
    console.error("Local DB write error:", e);
  }
};

// ── LOCAL LAPTOP RESET ────────────────────────────────────────────────────────
export const resetDB = async () => {
  const fresh = JSON.parse(JSON.stringify(INITIAL_DB));
  await writeDB(fresh);
  return fresh;
};
