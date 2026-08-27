import React, { useState } from 'react';
import { Settings, Download, Upload, RefreshCw, Save, CheckCircle2, ShieldCheck, Building2 } from 'lucide-react';
import { getData, saveData, resetToInitialData } from '../db/storage';

export const BackupSettingsView = ({ onReloadData, allowNegativeStock, onToggleNegativeStock }) => {
  const [company, setCompany] = useState(() => getData('COMPANY') || {});
  const [settings, setSettings] = useState(() => getData('SETTINGS') || {});
  const [feedback, setFeedback] = useState({ type: '', text: '' });

  const handleSaveCompany = (e) => {
    e.preventDefault();
    saveData('COMPANY', company);
    saveData('SETTINGS', settings);
    setFeedback({ type: 'success', text: 'Company details and ERP settings saved successfully!' });
    setTimeout(() => setFeedback({ type: '', text: '' }), 3000);
  };

  // Download JSON Backup
  const handleExportBackupJSON = () => {
    const fullBackup = {
      backupDate: new Date().toISOString(),
      app: 'ALISTON ERP',
      version: '2.5',
      company: getData('COMPANY'),
      settings: getData('SETTINGS'),
      users: getData('USERS'),
      categories: getData('CATEGORIES'),
      suppliers: getData('SUPPLIERS'),
      customers: getData('CUSTOMERS'),
      materials: getData('MATERIALS'),
      products: getData('PRODUCTS'),
      boms: getData('BOMS'),
      stock: getData('STOCK'),
      stockTransactions: getData('STOCK_TRANSACTIONS'),
      purchases: getData('PURCHASES'),
      productions: getData('PRODUCTIONS'),
      invoices: getData('INVOICES'),
      returns: getData('RETURNS'),
      expenses: getData('EXPENSES')
    };

    const blob = new Blob([JSON.stringify(fullBackup, null, 2)], { type: 'application/json' });
    const link = document.createElement('a');
    link.href = URL.createObjectURL(blob);
    link.download = `ALISTON_ERP_Full_Backup_${new Date().toISOString().split('T')[0]}.json`;
    link.click();
  };

  // Restore JSON Backup
  const handleImportBackupJSON = (e) => {
    const file = e.target.files[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (evt) => {
      try {
        const parsed = JSON.parse(evt.target.result);
        if (parsed.company) saveData('COMPANY', parsed.company);
        if (parsed.settings) saveData('SETTINGS', parsed.settings);
        if (parsed.users) saveData('USERS', parsed.users);
        if (parsed.categories) saveData('CATEGORIES', parsed.categories);
        if (parsed.suppliers) saveData('SUPPLIERS', parsed.suppliers);
        if (parsed.customers) saveData('CUSTOMERS', parsed.customers);
        if (parsed.materials) saveData('MATERIALS', parsed.materials);
        if (parsed.products) saveData('PRODUCTS', parsed.products);
        if (parsed.boms) saveData('BOMS', parsed.boms);
        if (parsed.stock) saveData('STOCK', parsed.stock);
        if (parsed.stockTransactions) saveData('STOCK_TRANSACTIONS', parsed.stockTransactions);
        if (parsed.purchases) saveData('PURCHASES', parsed.purchases);
        if (parsed.productions) saveData('PRODUCTIONS', parsed.productions);
        if (parsed.invoices) saveData('INVOICES', parsed.invoices);
        if (parsed.returns) saveData('RETURNS', parsed.returns);
        if (parsed.expenses) saveData('EXPENSES', parsed.expenses);

        setFeedback({ type: 'success', text: 'Database backup restored successfully!' });
        onReloadData();
      } catch (err) {
        alert('Failed to parse backup JSON file: ' + err.message);
      }
    };
    reader.readAsText(file);
  };

  const handleResetData = () => {
    if (confirm('Are you sure you want to clear all database tables to start entering your business data manually from scratch?')) {
      resetToInitialData();
      onReloadData();
      alert('All sample ERP data cleared successfully. You can now add products, raw materials, stock, and invoices manually.');
    }
  };

  return (
    <div style={{ padding: '24px', display: 'flex', flexDirection: 'column', gap: '24px' }}>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <div>
          <h2 style={{ fontSize: '1.4rem', fontWeight: '800' }}>ALISTON System Settings & Database Backup</h2>
          <p style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>
            Configure business GST profile, invoice numbering prefix, negative stock rules & data backups
          </p>
        </div>
        {feedback.text && (
          <div style={{ padding: '8px 14px', borderRadius: '6px', backgroundColor: 'rgba(35, 134, 54, 0.2)', color: '#3fb950', fontSize: '0.8rem', display: 'flex', alignItems: 'center', gap: '6px' }}>
            <CheckCircle2 size={16} /> {feedback.text}
          </div>
        )}
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 340px', gap: '24px' }}>
        {/* Company Settings Form */}
        <div className="card">
          <h3 style={{ fontSize: '1.1rem', fontWeight: '800', color: 'var(--accent-gold)', marginBottom: '16px', display: 'flex', alignItems: 'center', gap: '8px' }}>
            <Building2 size={18} /> Company GST Profile & Invoice Settings
          </h3>
          <form onSubmit={handleSaveCompany} style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '14px' }}>
            <div>
              <label style={{ fontSize: '0.775rem', color: 'var(--text-secondary)' }}>Brand Name</label>
              <input type="text" style={{ width: '100%' }} value={company.name || ''} onChange={(e) => setCompany({ ...company, name: e.target.value })} />
            </div>

            <div>
              <label style={{ fontSize: '0.775rem', color: 'var(--text-secondary)' }}>Legal Entity Name</label>
              <input type="text" style={{ width: '100%' }} value={company.legalName || ''} onChange={(e) => setCompany({ ...company, legalName: e.target.value })} />
            </div>

            <div style={{ gridColumn: '1 / -1' }}>
              <label style={{ fontSize: '0.775rem', color: 'var(--text-secondary)' }}>Registered Address</label>
              <input type="text" style={{ width: '100%' }} value={company.address || ''} onChange={(e) => setCompany({ ...company, address: e.target.value })} />
            </div>

            <div>
              <label style={{ fontSize: '0.775rem', color: 'var(--text-secondary)' }}>GSTIN</label>
              <input type="text" style={{ width: '100%' }} value={company.gstin || ''} onChange={(e) => setCompany({ ...company, gstin: e.target.value })} />
            </div>

            <div>
              <label style={{ fontSize: '0.775rem', color: 'var(--text-secondary)' }}>Invoice Numbering Prefix</label>
              <input type="text" style={{ width: '100%' }} value={company.invoicePrefix || 'AL/2026-27/'} onChange={(e) => setCompany({ ...company, invoicePrefix: e.target.value })} />
            </div>

            <div>
              <label style={{ fontSize: '0.775rem', color: 'var(--text-secondary)' }}>Bank Name</label>
              <input type="text" style={{ width: '100%' }} value={company.bankName || ''} onChange={(e) => setCompany({ ...company, bankName: e.target.value })} />
            </div>

            <div>
              <label style={{ fontSize: '0.775rem', color: 'var(--text-secondary)' }}>Bank Account Number</label>
              <input type="text" style={{ width: '100%' }} value={company.accountNo || ''} onChange={(e) => setCompany({ ...company, accountNo: e.target.value })} />
            </div>

            <div>
              <label style={{ fontSize: '0.775rem', color: 'var(--text-secondary)' }}>Bank IFSC Code</label>
              <input type="text" style={{ width: '100%' }} value={company.ifsc || ''} onChange={(e) => setCompany({ ...company, ifsc: e.target.value })} />
            </div>

            <div>
              <label style={{ fontSize: '0.775rem', color: 'var(--text-secondary)' }}>Branch</label>
              <input type="text" style={{ width: '100%' }} value={company.branch || ''} onChange={(e) => setCompany({ ...company, branch: e.target.value })} />
            </div>

            <div style={{ gridColumn: '1 / -1' }}>
              <button type="submit" className="btn btn-primary">
                <Save size={16} /> Save Company Settings
              </button>
            </div>
          </form>
        </div>

        {/* Database Backup & Controls */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
          <div className="card">
            <h3 style={{ fontSize: '1rem', fontWeight: '700', color: 'var(--accent-gold)', marginBottom: '14px' }}>
              Database Backup & Restore
            </h3>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
              <button className="btn btn-secondary" style={{ width: '100%', justifyContent: 'flex-start' }} onClick={handleExportBackupJSON}>
                <Download size={16} /> Export JSON Database Backup
              </button>

              <label className="btn btn-secondary" style={{ width: '100%', justifyContent: 'flex-start', cursor: 'pointer' }}>
                <Upload size={16} /> Restore JSON Database File
                <input type="file" accept=".json" onChange={handleImportBackupJSON} style={{ display: 'none' }} />
              </label>

              <button className="btn btn-danger" style={{ width: '100%', justifyContent: 'flex-start', marginTop: '10px' }} onClick={handleResetData}>
                <RefreshCw size={16} /> Clear All Data (Start Fresh)
              </button>
            </div>
          </div>

          <div className="card">
            <h3 style={{ fontSize: '1rem', fontWeight: '700', color: 'var(--text-primary)', marginBottom: '10px' }}>
              Stock Audit Rules
            </h3>
            <label style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '0.825rem', cursor: 'pointer' }}>
              <input type="checkbox" checked={allowNegativeStock} onChange={onToggleNegativeStock} />
              <span>Allow Negative Stock on Sales Invoices</span>
            </label>
          </div>
        </div>
      </div>
    </div>
  );
};
