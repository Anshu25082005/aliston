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
  INITIAL_EXPENSES
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
  AUTH: 'aliston_auth_session'
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
            const currentRaw = localStorage.getItem(STORAGE_KEYS[key]);
            const newRaw = JSON.stringify(db[key]);
            if (currentRaw !== newRaw) {
              localStorage.setItem(STORAGE_KEYS[key], newRaw);
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
    return raw ? JSON.parse(raw) : null;
  } catch (e) {
    console.error(`Error reading ${key}`, e);
    return null;
  }
};

export const saveData = async (key, data) => {
  const tableKey = key.toUpperCase();
  try {
    // 1. Update local cache for instant UI response
    localStorage.setItem(STORAGE_KEYS[tableKey], JSON.stringify(data));
    window.dispatchEvent(new CustomEvent('aliston-db-updated', { detail: { key } }));

    // 2. Sync to Server DB
    fetch(`/api/data/${tableKey}`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data)
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
  try {
    const res = await fetch('/api/auth/login', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email, password, remember })
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
    const found = users.find(u => u.email.toLowerCase() === email.toLowerCase() && u.password === password);
    if (found) {
      const sessionData = {
        id: found.id,
        email: found.email,
        name: found.name,
        role: found.role,
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
    const res = await fetch('/api/reset', { method: 'POST' });
    if (res.ok) {
      await syncWithServerDB();
      return { success: true };
    }
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

  const currentSizeQty = stockEntry.sizes[size] || 0;
  const newSizeQty = currentSizeQty + changeQty;

  if (!settings.allowNegativeStock && newSizeQty < 0) {
    return {
      success: false,
      message: `Insufficient stock for ${productName} (${color} - Size ${size}). Available: ${currentSizeQty}, Requested reduction: ${Math.abs(changeQty)}.`
    };
  }

  stockEntry.sizes[size] = newSizeQty;
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
