import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const DB_FILE_PATH = path.join(__dirname, 'data', 'db.json');
const TMP_DB_PATH = path.join('/tmp', 'aliston_db.json');

// Memory DB cache for Vercel serverless functions
let memoryDb = null;

// Default initial database state
const INITIAL_DB = {
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
  SETTINGS: {
    allowNegativeStock: false,
    minStockThreshold: 10,
    tallyTheme: 'dark',
    invoiceSeq: 1001
  },
  USERS: [
    {
      id: 'user-1',
      email: 'studioaliston@gmail.com',
      password: 'pdmmay2026',
      name: 'Aliston Studio Admin',
      role: 'Administrator'
    },
    {
      id: 'user-2',
      email: 'studioaliston2@gmail.com',
      password: 'pdmmay2026',
      name: 'Aliston Studio Admin 2',
      role: 'Administrator'
    }
  ],
  CATEGORIES: [
    { id: 'cat-1', name: 'Formal Shirt', code: 'FSH' },
    { id: 'cat-2', name: 'Casual Shirt', code: 'CSH' },
    { id: 'cat-3', name: 'Linen Shirt', code: 'LSH' },
    { id: 'cat-4', name: 'Cotton Shirt', code: 'CTN' },
    { id: 'cat-5', name: 'Giza Cotton Shirt', code: 'GZA' },
    { id: 'cat-6', name: 'Trouser/Pant', code: 'TRS' },
    { id: 'cat-7', name: 'Other', code: 'OTH' }
  ],
  SUPPLIERS: [],
  CUSTOMERS: [],
  MATERIALS: [],
  PRODUCTS: [],
  BOMS: {},
  STOCK: [],
  STOCK_TRANSACTIONS: [],
  PURCHASES: [],
  PRODUCTIONS: [],
  INVOICES: [],
  RETURNS: [],
  EXPENSES: [],
  ORDERS: []
};

// Ensure data directory exists
const ensureDataDir = () => {
  try {
    const dir = path.join(__dirname, 'data');
    if (!fs.existsSync(dir)) {
      fs.mkdirSync(dir, { recursive: true });
    }
  } catch (e) {
    // Read-only on serverless
  }
};

// Read Database
export const readDB = () => {
  const sanitizeStock = (dbObj) => {
    if (dbObj && Array.isArray(dbObj.STOCK)) {
      dbObj.STOCK.forEach(stockItem => {
        if (stockItem && stockItem.sizes) {
          Object.keys(stockItem.sizes).forEach(sz => {
            stockItem.sizes[sz] = Math.max(0, parseInt(stockItem.sizes[sz]) || 0);
          });
          stockItem.total = Object.values(stockItem.sizes).reduce((sum, v) => sum + v, 0);
        }
      });
    }
    return dbObj;
  };

  if (memoryDb) {
    return sanitizeStock(memoryDb);
  }

  // 1. Try /tmp/aliston_db.json (Serverless writable cache)
  try {
    if (fs.existsSync(TMP_DB_PATH)) {
      const raw = fs.readFileSync(TMP_DB_PATH, 'utf-8');
      memoryDb = sanitizeStock(JSON.parse(raw));
      return memoryDb;
    }
  } catch (e) {
    // Ignore error
  }

  // 2. Try disk db.json
  try {
    ensureDataDir();
    if (fs.existsSync(DB_FILE_PATH)) {
      const raw = fs.readFileSync(DB_FILE_PATH, 'utf-8');
      memoryDb = sanitizeStock(JSON.parse(raw));
      return memoryDb;
    }
  } catch (err) {
    console.error('Error reading server DB:', err);
  }

  memoryDb = sanitizeStock(INITIAL_DB);
  return memoryDb;
};

// Write Database
export const writeDB = (data) => {
  memoryDb = data;
  
  // 1. Write to /tmp/aliston_db.json
  try {
    fs.writeFileSync(TMP_DB_PATH, JSON.stringify(data, null, 2), 'utf-8');
  } catch (e) {
    // Ignore error
  }

  // 2. Write to disk db.json if writable
  try {
    ensureDataDir();
    fs.writeFileSync(DB_FILE_PATH, JSON.stringify(data, null, 2), 'utf-8');
  } catch (err) {
    // Expected on Vercel read-only filesystem
  }
};

// Reset Database
export const resetDB = () => {
  memoryDb = INITIAL_DB;
  writeDB(INITIAL_DB);
  return INITIAL_DB;
};
