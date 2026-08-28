import React, { useState } from 'react';
import { BarChart3, Download, Filter, FileSpreadsheet, TrendingUp, DollarSign, Boxes, ShoppingBag, Shirt } from 'lucide-react';
import { getData } from '../db/storage';
import { exportToExcel, exportToCSV } from '../utils/excelExporter';

export const ReportsView = () => {
  const [activeReportTab, setActiveReportTab] = useState('stock'); // 'stock' | 'material' | 'sales' | 'purchase' | 'profit' | 'expense'

  const stockList = getData('STOCK') || [];
  const materials = getData('MATERIALS') || [];
  const invoices = getData('INVOICES') || [];
  const purchases = getData('PURCHASES') || [];
  const expenses = getData('EXPENSES') || [];
  const products = getData('PRODUCTS') || [];

  // Export handler for currently active report
  const handleExportCurrent = (format = 'excel') => {
    let filename = `ALISTON_${activeReportTab.toUpperCase()}_Report`;
    let data = [];

    if (activeReportTab === 'stock') {
      data = stockList.flatMap(s => 
        Object.entries(s.sizes || {}).map(([sz, qty]) => ({
          'Product Name': s.productName,
          'Fabric': s.fabric,
          'Colour': s.color,
          'Size': sz,
          'Closing Stock': qty
        }))
      );
    } else if (activeReportTab === 'material') {
      data = materials.map(m => ({
        'Material Name': m.name,
        'Category': m.category,
        'Remaining Stock': m.currentStock,
        'Unit': m.unit,
        'Avg Rate (₹)': m.rate,
        'Total Valuation (₹)': (m.currentStock * m.rate).toFixed(2)
      }));
    } else if (activeReportTab === 'sales') {
      data = invoices.flatMap(inv => 
        inv.items?.map(it => ({
          'Invoice No': inv.invoiceNo,
          'Date': inv.date,
          'Customer': inv.customerName,
          'Product': it.productName,
          'Colour': it.color,
          'Size': it.size,
          'Qty': it.qty,
          'Rate': it.rate,
          'Taxable Amt': it.taxableAmt,
          'GST Amt': it.gstAmt,
          'Total Amt': it.totalAmt
        })) || []
      );
    } else if (activeReportTab === 'purchase') {
      data = purchases.map(p => ({
        'Purchase No': p.purchaseNo,
        'Date': p.date,
        'Supplier': p.supplierName,
        'Material': p.material,
        'Qty': p.quantity,
        'Rate': p.rate,
        'Subtotal': p.subtotal,
        'GST': p.gstAmount,
        'Grand Total': p.grandTotal
      }));
    } else if (activeReportTab === 'profit') {
      const taxableSales = invoices.reduce((sum, i) => sum + (i.taxableTotal || 0), 0);
      const totalPurchases = purchases.reduce((sum, p) => sum + (p.grandTotal || 0), 0);
      const totalExp = expenses.reduce((sum, e) => sum + (e.amount || 0), 0);
      const grossProfit = taxableSales - (totalPurchases * 0.8);
      const netProfit = grossProfit - totalExp;

      data = [{
        'Total Taxable Sales': taxableSales,
        'Estimated COGS / Purchase Cost': totalPurchases * 0.8,
        'Gross Profit': grossProfit,
        'Total Operating Expenses': totalExp,
        'Net Profit': netProfit,
        'Profit Margin %': taxableSales > 0 ? ((netProfit / taxableSales) * 100).toFixed(2) + '%' : '0%'
      }];
    } else if (activeReportTab === 'expense') {
      data = expenses.map(e => ({
        'Date': e.date,
        'Category': e.category === 'Other' && e.customCategory ? e.customCategory : e.category,
        'Description': e.description,
        'Amount': e.amount,
        'Payment Mode': e.paymentMode
      }));
    }

    if (format === 'excel') {
      exportToExcel(data, `${filename}.xlsx`);
    } else {
      exportToCSV(data, `${filename}.csv`);
    }
  };

  return (
    <div style={{ padding: '24px' }}>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '20px' }}>
        <div>
          <h2 style={{ fontSize: '1.4rem', fontWeight: '800' }}>ALISTON ERP Executive Reports Hub</h2>
          <p style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>
            Real-time audit reports for finished stock, raw materials, sales, purchases, profit & loss
          </p>
        </div>
        <div style={{ display: 'flex', gap: '12px' }}>
          <button className="btn btn-secondary" onClick={() => handleExportCurrent('csv')}>
            <FileSpreadsheet size={16} /> Export CSV
          </button>
          <button className="btn btn-primary" onClick={() => handleExportCurrent('excel')}>
            <Download size={16} /> Export Excel
          </button>
        </div>
      </div>

      {/* Tabs */}
      <div style={{ display: 'flex', gap: '6px', borderBottom: '1px solid var(--border-color)', marginBottom: '20px' }}>
        {[
          { id: 'stock', label: 'Stock Report' },
          { id: 'material', label: 'Raw Material Report' },
          { id: 'sales', label: 'Sales Report' },
          { id: 'purchase', label: 'Purchase Report' },
          { id: 'profit', label: 'Profit & Loss Statement' },
          { id: 'expense', label: 'Expense Report' }
        ].map(t => (
          <button
            key={t.id}
            onClick={() => setActiveReportTab(t.id)}
            style={{
              padding: '10px 16px',
              fontWeight: '700',
              fontSize: '0.85rem',
              borderBottom: activeReportTab === t.id ? '2px solid var(--accent-gold)' : 'none',
              color: activeReportTab === t.id ? 'var(--accent-gold)' : 'var(--text-secondary)',
              background: 'none'
            }}
          >
            {t.label}
          </button>
        ))}
      </div>

      {/* REPORT CONTENT VIEW */}
      {activeReportTab === 'stock' && (
        <div className="erp-table-container">
          <table className="erp-table">
            <thead>
              <tr>
                <th>Product Name</th>
                <th>Fabric</th>
                <th>Colour</th>
                <th>Size</th>
                <th>Closing Stock Qty</th>
              </tr>
            </thead>
            <tbody>
              {stockList.flatMap(s => 
                Object.entries(s.sizes || {}).map(([sz, qty], idx) => (
                  <tr key={`${s.productId}-${sz}-${idx}`}>
                    <td style={{ fontWeight: '700' }}>{s.productName}</td>
                    <td style={{ fontSize: '0.8rem', color: 'var(--text-secondary)' }}>{s.fabric}</td>
                    <td><span className="badge badge-gold">{s.color}</span></td>
                    <td><span className="badge badge-blue">{sz}</span></td>
                    <td className="mono" style={{ fontWeight: '800', color: qty < 10 ? '#f85149' : 'var(--text-primary)' }}>
                      {qty} pcs
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      )}

      {activeReportTab === 'material' && (
        <div className="erp-table-container">
          <table className="erp-table">
            <thead>
              <tr>
                <th>Material Name</th>
                <th>Category</th>
                <th>Unit Rate</th>
                <th>Remaining Stock</th>
                <th>Total Valuation (₹)</th>
              </tr>
            </thead>
            <tbody>
              {materials.map(m => (
                <tr key={m.id}>
                  <td style={{ fontWeight: '700' }}>{m.name}</td>
                  <td><span className="badge badge-gold">{m.category}</span></td>
                  <td className="mono">₹{m.rate}/{m.unit}</td>
                  <td className="mono" style={{ fontWeight: '800' }}>{m.currentStock} {m.unit}</td>
                  <td className="mono" style={{ fontWeight: '800', color: '#3fb950' }}>₹{(m.currentStock * m.rate).toFixed(2)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {activeReportTab === 'sales' && (
        <div className="erp-table-container">
          <table className="erp-table">
            <thead>
              <tr>
                <th>Invoice #</th>
                <th>Date</th>
                <th>Customer</th>
                <th>Product</th>
                <th>Colour / Size</th>
                <th>Qty</th>
                <th>Rate</th>
                <th>GST Amt</th>
                <th>Total Amt</th>
              </tr>
            </thead>
            <tbody>
              {invoices.flatMap(inv => 
                inv.items?.map((it, idx) => (
                  <tr key={`${inv.id}-${idx}`}>
                    <td className="mono" style={{ fontWeight: '700', color: 'var(--accent-gold)' }}>{inv.invoiceNo}</td>
                    <td>{inv.date}</td>
                    <td style={{ fontWeight: '600' }}>{inv.customerName}</td>
                    <td>{it.productName}</td>
                    <td>{it.color} / <strong>{it.size}</strong></td>
                    <td className="mono" style={{ fontWeight: '700' }}>{it.qty} pcs</td>
                    <td className="mono">₹{it.rate}</td>
                    <td className="mono">₹{it.gstAmt?.toFixed(2)}</td>
                    <td className="mono" style={{ fontWeight: '800', color: '#3fb950' }}>₹{it.totalAmt?.toFixed(2)}</td>
                  </tr>
                )) || []
              )}
            </tbody>
          </table>
        </div>
      )}

      {activeReportTab === 'purchase' && (
        <div className="erp-table-container">
          <table className="erp-table">
            <thead>
              <tr>
                <th>Purchase #</th>
                <th>Date</th>
                <th>Supplier</th>
                <th>Material</th>
                <th>Quantity</th>
                <th>Rate</th>
                <th>Grand Total (₹)</th>
              </tr>
            </thead>
            <tbody>
              {purchases.map(p => (
                <tr key={p.id}>
                  <td className="mono" style={{ fontWeight: '700', color: 'var(--accent-gold)' }}>{p.purchaseNo}</td>
                  <td>{p.date}</td>
                  <td style={{ fontWeight: '600' }}>{p.supplierName}</td>
                  <td>{p.material}</td>
                  <td className="mono">{p.quantity} {p.unit}</td>
                  <td className="mono">₹{p.rate}</td>
                  <td className="mono" style={{ fontWeight: '800', color: '#3fb950' }}>₹{p.grandTotal?.toFixed(2)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {activeReportTab === 'profit' && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
          <div className="card" style={{ background: 'linear-gradient(135deg, #002b36 0%, #0d1117 100%)', border: '1px solid #006680' }}>
            <h3 style={{ fontSize: '1.2rem', fontWeight: '800', color: '#ffffff', marginBottom: '16px' }}>
              Profit & Loss Statement (P&L)
            </h3>
            
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '16px' }}>
              <div style={{ backgroundColor: 'rgba(255,255,255,0.03)', padding: '14px', borderRadius: '8px', border: '1px solid var(--border-color)' }}>
                <div style={{ fontSize: '0.775rem', color: 'var(--text-secondary)' }}>Total Sales Revenue (Excl GST)</div>
                <div className="mono" style={{ fontSize: '1.4rem', fontWeight: '800', color: '#3fb950', marginTop: '4px' }}>
                  ₹{invoices.reduce((sum, i) => sum + (i.taxableTotal || 0), 0).toLocaleString('en-IN')}
                </div>
              </div>

              <div style={{ backgroundColor: 'rgba(255,255,255,0.03)', padding: '14px', borderRadius: '8px', border: '1px solid var(--border-color)' }}>
                <div style={{ fontSize: '0.775rem', color: 'var(--text-secondary)' }}>Total Raw Material Purchases</div>
                <div className="mono" style={{ fontSize: '1.4rem', fontWeight: '800', color: '#f59e0b', marginTop: '4px' }}>
                  ₹{purchases.reduce((sum, p) => sum + (p.grandTotal || 0), 0).toLocaleString('en-IN')}
                </div>
              </div>

              <div style={{ backgroundColor: 'rgba(255,255,255,0.03)', padding: '14px', borderRadius: '8px', border: '1px solid var(--border-color)' }}>
                <div style={{ fontSize: '0.775rem', color: 'var(--text-secondary)' }}>Total Operating Expenses</div>
                <div className="mono" style={{ fontSize: '1.4rem', fontWeight: '800', color: '#ef4444', marginTop: '4px' }}>
                  ₹{expenses.reduce((sum, e) => sum + (e.amount || 0), 0).toLocaleString('en-IN')}
                </div>
              </div>

              <div style={{ backgroundColor: 'rgba(229, 185, 92, 0.05)', padding: '14px', borderRadius: '8px', border: '1px solid var(--accent-gold)' }}>
                <div style={{ fontSize: '0.775rem', color: 'var(--accent-gold)', fontWeight: '700' }}>Estimated Net Profit</div>
                <div className="mono" style={{ fontSize: '1.5rem', fontWeight: '900', color: 'var(--accent-gold)', marginTop: '4px' }}>
                  ₹{(invoices.reduce((sum, i) => sum + (i.taxableTotal || 0), 0) - (purchases.reduce((sum, p) => sum + (p.grandTotal || 0), 0) * 0.8) - expenses.reduce((sum, e) => sum + (e.amount || 0), 0)).toLocaleString('en-IN')}
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {activeReportTab === 'expense' && (
        <div className="erp-table-container">
          <table className="erp-table">
            <thead>
              <tr>
                <th>Date</th>
                <th>Expense Type</th>
                <th>Description</th>
                <th>Payment Mode</th>
                <th>Amount (₹)</th>
              </tr>
            </thead>
            <tbody>
              {expenses.map(e => (
                <tr key={e.id || Math.random()}>
                  <td>{e.date}</td>
                  <td><span className="badge badge-gold">{e.category}</span></td>
                  <td>{e.description}</td>
                  <td>{e.paymentMode}</td>
                  <td className="mono" style={{ fontWeight: '800', color: '#ef4444' }}>
                    ₹{(parseFloat(e.amount) || 0).toFixed(2)}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
};
