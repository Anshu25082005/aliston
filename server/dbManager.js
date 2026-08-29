import { Redis } from "@upstash/redis";
import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const DB_FILE_PATH = path.join(__dirname, "data", "db.json");

// Memory cache for within-request reuse
let memoryDb = null;
let memoryDbTimestamp = 0;
const CACHE_TTL_MS = 5000; // 5 second cache

// Default initial database state
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

// ── Redis client (lazy init) ──────────────────────────────────────────────────
let redis = null;
const getRedis = () => {
  if (!redis && process.env.UPSTASH_REDIS_REST_URL && process.env.UPSTASH_REDIS_REST_TOKEN) {
    redis = new Redis({
      url: process.env.UPSTASH_REDIS_REST_URL,
      token: process.env.UPSTASH_REDIS_REST_TOKEN
    });
  }
  return redis;
};

const REDIS_KEY = "aliston_erp_db_v2";

// ── sanitize stock (no negatives) ─────────────────────────────────────────────
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

// ── READ ──────────────────────────────────────────────────────────────────────
export const readDB = async () => {
  // 1. Return memory cache if fresh
  if (memoryDb && Date.now() - memoryDbTimestamp < CACHE_TTL_MS) {
    return sanitizeStock(memoryDb);
  }

  // 2. Try Upstash Redis (persistent cloud storage)
  const r = getRedis();
  if (r) {
    try {
      const data = await r.get(REDIS_KEY);
      if (data) {
        const db = typeof data === "string" ? JSON.parse(data) : data;
        memoryDb = { ...INITIAL_DB, ...db };
        memoryDbTimestamp = Date.now();
        return sanitizeStock(memoryDb);
      }
    } catch (e) {
      console.error("Redis read error:", e.message);
    }
  }

  // 3. Fallback: try local disk db.json
  try {
    if (fs.existsSync(DB_FILE_PATH)) {
      const raw = fs.readFileSync(DB_FILE_PATH, "utf-8");
      memoryDb = { ...INITIAL_DB, ...JSON.parse(raw) };
      memoryDbTimestamp = Date.now();
      return sanitizeStock(memoryDb);
    }
  } catch (e) {}

  // 4. Return initial DB
  memoryDb = JSON.parse(JSON.stringify(INITIAL_DB));
  memoryDbTimestamp = Date.now();
  return sanitizeStock(memoryDb);
};

// ── WRITE ─────────────────────────────────────────────────────────────────────
export const writeDB = async (data) => {
  memoryDb = data;
  memoryDbTimestamp = Date.now();

  // 1. Write to Upstash Redis (persistent)
  const r = getRedis();
  if (r) {
    try {
      await r.set(REDIS_KEY, JSON.stringify(data));
      return;
    } catch (e) {
      console.error("Redis write error:", e.message);
    }
  }

  // 2. Fallback: write to disk
  try {
    const dir = path.join(__dirname, "data");
    if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
    fs.writeFileSync(DB_FILE_PATH, JSON.stringify(data, null, 2), "utf-8");
  } catch (e) {}
};

// ── RESET ─────────────────────────────────────────────────────────────────────
export const resetDB = async () => {
  const fresh = JSON.parse(JSON.stringify(INITIAL_DB));
  memoryDb = fresh;
  memoryDbTimestamp = Date.now();

  const r = getRedis();
  if (r) {
    try {
      await r.set(REDIS_KEY, JSON.stringify(fresh));
    } catch (e) {}
  }
  return fresh;
};
