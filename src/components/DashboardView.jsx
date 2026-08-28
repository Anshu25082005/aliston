import React, { useState, useEffect } from 'react';
import { 
  Boxes, 
  Shirt, 
  TrendingUp, 
  TrendingDown, 
  DollarSign, 
  AlertTriangle, 
  PlusCircle, 
  ShoppingBag, 
  FileText, 
  Calculator, 
  BarChart3,
  Layers,
  ArrowUpRight,
  ArrowDownRight,
  ShieldCheck
} from 'lucide-react';
import { getData } from '../db/storage';

export const DashboardView = ({ onNavigate, onOpenAddProduct, onOpenAddStock, onOpenInvoice }) => {
  const [stockList, setStockList] = useState(() => getData('STOCK') || []);
  const [products, setProducts] = useState(() => getData('PRODUCTS') || []);
  const [purchases, setPurchases] = useState(() => getData('PURCHASES') || []);
  const [invoices, setInvoices] = useState(() => getData('INVOICES') || []);
  const [expenses, setExpenses] = useState(() => getData('EXPENSES') || []);
  const [materials, setMaterials] = useState(() => getData('MATERIALS') || []);
  const [stockTx, setStockTx] = useState(() => getData('STOCK_TRANSACTIONS') || []);

  // Real-time DB update listener
  useEffect(() => {
    const handleDbUpdate = () => {
      setStockList(getData('STOCK') || []);
      setProducts(getData('PRODUCTS') || []);
      setPurchases(getData('PURCHASES') || []);
      setInvoices(getData('INVOICES') || []);
      setExpenses(getData('EXPENSES') || []);
      setMaterials(getData('MATERIALS') || []);
      setStockTx(getData('STOCK_TRANSACTIONS') || []);
    };
    window.addEventListener('aliston-db-updated', handleDbUpdate);
    return () => window.removeEventListener('aliston-db-updated', handleDbUpdate);
  }, []);

  // Compute Metrics
  let totalStock = 0;
  let totalShirts = 0;
  let totalPants = 0;
  let totalLinenShirts = 0;
  let lowStockItemsCount = 0;
  let totalInventoryValue = 0;

  stockList.forEach(s => {
    const itemTotal = Math.max(0, s.total || 0);
    totalStock += itemTotal;
    const prod = products.find(p => p.id === s.productId);
    if (prod) {
      if (prod.category && prod.category.includes('Shirt')) {
        totalShirts += itemTotal;
      }
      if (prod.category && (prod.category.includes('Trouser') || prod.category.includes('Pant'))) {
        totalPants += itemTotal;
      }
      if (prod.category && prod.category.includes('Linen Shirt')) {
        totalLinenShirts += itemTotal;
      }
      totalInventoryValue += itemTotal * (prod.costPrice || 0);

      // Low stock check by size
      if (s.sizes) {
        Object.entries(s.sizes).forEach(([size, qty]) => {
          const safeQty = Math.max(0, parseInt(qty) || 0);
          if (safeQty < (prod.minStockLevel || 10)) {
            lowStockItemsCount++;
          }
        });
      }
    }
  });

  // Raw Material Inventory Value
  let rawMaterialValue = 0;
  materials.forEach(m => {
    rawMaterialValue += (m.currentStock || 0) * (m.rate || 0);
  });
  totalInventoryValue += rawMaterialValue;

  // Purchases Total
  const totalPurchase = purchases.reduce((sum, p) => sum + (p.grandTotal || 0), 0);

  // Sales Total
  const totalSales = invoices.reduce((sum, i) => sum + (i.grandTotal || 0), 0);

  // Expenses Total
  const totalExpenses = expenses.reduce((sum, e) => sum + (e.amount || 0), 0);

  // Profit Total = Sales Taxable - Total Purchase - Total Expenses
  const taxableSales = invoices.reduce((sum, i) => sum + (i.taxableTotal || 0), 0);
  const totalProfit = taxableSales - (totalPurchase * 0.8) - totalExpenses;

  // Today's Sales & Purchases
  const todayStr = new Date().toISOString().split('T')[0];
  const todaySales = invoices
    .filter(i => i.date === todayStr)
    .reduce((sum, i) => sum + (i.grandTotal || 0), 0);

  const todayPurchases = purchases
    .filter(p => p.date === todayStr)
    .reduce((sum, p) => sum + (p.grandTotal || 0), 0);

  const kpis = [
    { title: 'Total Stock Units', value: totalStock.toLocaleString(), sub: `${totalShirts} Shirts | ${totalPants} Pants`, icon: Boxes, color: '#38bdf8' },
    { title: 'Total Linen Shirts', value: totalLinenShirts.toLocaleString(), sub: 'Pure & Blend Linen', icon: Shirt, color: '#e5b95c' },
    { title: 'Low Stock Alerts', value: lowStockItemsCount, sub: 'Items below min threshold', icon: AlertTriangle, color: lowStockItemsCount > 0 ? '#f85149' : '#3fb950' },
    { title: 'Inventory Value', value: `₹${totalInventoryValue.toLocaleString('en-IN', { maximumFractionDigits: 0 })}`, sub: 'Finished Goods + Materials', icon: DollarSign, color: '#a855f7' },
    { title: 'Total Purchases', value: `₹${totalPurchase.toLocaleString('en-IN', { maximumFractionDigits: 0 })}`, sub: `${purchases.length} Purchase Bills`, icon: ArrowDownRight, color: '#f59e0b' },
    { title: 'Total Sales Revenue', value: `₹${totalSales.toLocaleString('en-IN', { maximumFractionDigits: 0 })}`, sub: `${invoices.length} Sales Invoices`, icon: ArrowUpRight, color: '#10b981' },
    { title: 'Total Operating Expenses', value: `₹${totalExpenses.toLocaleString('en-IN', { maximumFractionDigits: 0 })}`, sub: 'Rent, Stitching, Labor', icon: TrendingDown, color: '#ef4444' },
    { title: 'Estimated Net Profit', value: `₹${totalProfit.toLocaleString('en-IN', { maximumFractionDigits: 0 })}`, sub: 'Gross Profit - Expenses', icon: TrendingUp, color: '#3b82f6' },
    { title: "Today's Sales", value: `₹${todaySales.toLocaleString('en-IN')}`, sub: todayStr, icon: DollarSign, color: '#34d399' },
    { title: "Today's Purchases", value: `₹${todayPurchases.toLocaleString('en-IN')}`, sub: todayStr, icon: ShoppingBag, color: '#fbbf24' }
  ];

  const quickButtons = [
    { label: 'Add Product', icon: PlusCircle, action: onOpenAddProduct, color: 'var(--accent-gold)' },
    { label: 'Add Stock', icon: Boxes, action: onOpenAddStock, color: '#38bdf8' },
    { label: 'Stock Adjustment', icon: Layers, action: () => onNavigate('stock'), color: '#a855f7' },
    { label: 'Purchase Entry', icon: ShoppingBag, action: () => onNavigate('purchases'), color: '#f59e0b' },
    { label: 'Sales Invoice', icon: FileText, action: onOpenInvoice, color: '#10b981' },
    { label: 'Generate Invoice', icon: FileText, action: onOpenInvoice, color: '#34d399' },
    { label: 'Product Costing', icon: Calculator, action: () => onNavigate('bom'), color: '#ec4899' },
    { label: 'Stock Report', icon: BarChart3, action: () => onNavigate('reports'), color: '#6366f1' },
    { label: 'Purchase Report', icon: BarChart3, action: () => onNavigate('reports'), color: '#8b5cf6' },
    { label: 'Sales Report', icon: BarChart3, action: () => onNavigate('reports'), color: '#10b981' },
    { label: 'Expense Report', icon: BarChart3, action: () => onNavigate('reports'), color: '#ef4444' }
  ];

  return (
    <div style={{ padding: '24px', display: 'flex', flexDirection: 'column', gap: '24px' }}>
      {/* Top Banner */}
      <div className="card" style={{
        background: 'linear-gradient(135deg, #002b36 0%, #0d1117 100%)',
        border: '1px solid #006680',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        padding: '20px 24px'
      }}>
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            <h2 style={{ fontSize: '1.4rem', color: '#ffffff', fontWeight: '800' }}>
              ALISTON GARMENT MANUFACTURING & ERP
            </h2>
            <span className="badge badge-gold">SHREE RAM ENTERPRISE</span>
          </div>
          <p style={{ color: '#94a3b8', fontSize: '0.875rem', marginTop: '4px' }}>
            Garment Manufacturing • BOM Costing • Size-wise Stock Ledger • GST Invoices
          </p>
        </div>
        <div style={{ display: 'flex', gap: '12px' }}>
          <button className="btn btn-primary" onClick={onOpenInvoice}>
            <FileText size={16} /> Create Sales Invoice
          </button>
          <button className="btn btn-secondary" onClick={() => onNavigate('production')}>
            <Shirt size={16} /> Record Production
          </button>
        </div>
      </div>

      {/* Quick Action Shortcuts */}
      <div>
        <h3 style={{ fontSize: '0.9rem', textTransform: 'uppercase', letterSpacing: '0.5px', color: 'var(--text-secondary)', marginBottom: '12px' }}>
          Quick Action Shortcuts
        </h3>
        <div style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fill, minmax(160px, 1fr))',
          gap: '12px'
        }}>
          {quickButtons.map((btn, idx) => {
            const Icon = btn.icon;
            return (
              <button
                key={idx}
                onClick={btn.action}
                style={{
                  backgroundColor: 'var(--bg-card)',
                  border: '1px solid var(--border-color)',
                  borderRadius: 'var(--radius-md)',
                  padding: '12px',
                  display: 'flex',
                  flexDirection: 'column',
                  alignItems: 'center',
                  gap: '8px',
                  color: 'var(--text-primary)',
                  fontSize: '0.8rem',
                  fontWeight: '600',
                  textAlign: 'center'
                }}
              >
                <div style={{
                  padding: '8px',
                  borderRadius: '8px',
                  backgroundColor: 'rgba(255, 255, 255, 0.04)',
                  color: btn.color
                }}>
                  <Icon size={20} />
                </div>
                <span>{btn.label}</span>
              </button>
            );
          })}
        </div>
      </div>

      {/* KPI Cards Grid */}
      <div>
        <h3 style={{ fontSize: '0.9rem', textTransform: 'uppercase', letterSpacing: '0.5px', color: 'var(--text-secondary)', marginBottom: '12px' }}>
          Inventory & Financial Performance Metrics
        </h3>
        <div style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fill, minmax(220px, 1fr))',
          gap: '16px'
        }}>
          {kpis.map((kpi, idx) => {
            const Icon = kpi.icon;
            return (
              <div key={idx} className="card" style={{ padding: '16px', display: 'flex', flexDirection: 'column', justifyContent: 'space-between' }}>
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                  <span style={{ fontSize: '0.775rem', color: 'var(--text-secondary)', fontWeight: '600' }}>
                    {kpi.title}
                  </span>
                  <div style={{
                    width: '30px',
                    height: '30px',
                    borderRadius: '6px',
                    backgroundColor: 'rgba(255, 255, 255, 0.04)',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    color: kpi.color
                  }}>
                    <Icon size={16} />
                  </div>
                </div>
                <div style={{ marginTop: '12px' }}>
                  <div style={{ fontSize: '1.4rem', fontWeight: '800', color: 'var(--text-primary)', fontFamily: 'var(--font-heading)' }}>
                    {kpi.value}
                  </div>
                  <div style={{ fontSize: '0.725rem', color: 'var(--text-muted)', marginTop: '2px' }}>
                    {kpi.sub}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Audit Trail & Recent Stock Movements */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '24px' }}>
        {/* Recent Audit Transactions */}
        <div className="card">
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '16px' }}>
            <h3 style={{ fontSize: '1rem', fontWeight: '700' }}>Recent Stock Audit Transactions</h3>
            <button className="btn btn-secondary btn-sm" onClick={() => onNavigate('stock')}>View Stock Ledger</button>
          </div>
          <div className="erp-table-container">
            <table className="erp-table">
              <thead>
                <tr>
                  <th>Time</th>
                  <th>Product</th>
                  <th>Size</th>
                  <th>Type</th>
                  <th>Change</th>
                </tr>
              </thead>
              <tbody>
                {stockTx.length === 0 ? (
                  <tr>
                    <td colSpan="5" style={{ textAlign: 'center', padding: '20px', color: 'var(--text-muted)' }}>
                      No stock transactions logged yet.
                    </td>
                  </tr>
                ) : (
                  stockTx.slice(0, 6).map((tx, i) => (
                    <tr key={i}>
                      <td style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>
                        {new Date(tx.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                      </td>
                      <td style={{ fontSize: '0.8rem', fontWeight: '600' }}>{tx.productName} ({tx.color})</td>
                      <td><span className="badge badge-gold">{tx.size}</span></td>
                      <td>
                        <span className={`badge ${tx.changeQty > 0 ? 'badge-green' : 'badge-red'}`}>
                          {tx.transactionType}
                        </span>
                      </td>
                      <td className="mono" style={{ fontWeight: '700', color: tx.changeQty > 0 ? '#3fb950' : '#f85149' }}>
                        {tx.changeQty > 0 ? `+${tx.changeQty}` : tx.changeQty}
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>

        {/* Low Stock Warning Summary */}
        <div className="card">
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '16px' }}>
            <h3 style={{ fontSize: '1rem', fontWeight: '700', display: 'flex', alignItems: 'center', gap: '8px' }}>
              <AlertTriangle size={18} color="#f85149" /> Low Stock Alerts
            </h3>
            <button className="btn btn-secondary btn-sm" onClick={() => onNavigate('products')}>Order Material</button>
          </div>
          <div className="erp-table-container">
            <table className="erp-table">
              <thead>
                <tr>
                  <th>Product / Color</th>
                  <th>Size</th>
                  <th>Current Stock</th>
                  <th>Status</th>
                </tr>
              </thead>
              <tbody>
                {stockList.flatMap(s => 
                  Object.entries(s.sizes || {}).map(([sz, qty]) => ({
                    productId: s.productId,
                    productName: s.productName,
                    color: s.color,
                    size: sz,
                    qty
                  }))
                ).filter(item => item.qty < 10).slice(0, 6).map((item, idx) => (
                  <tr key={idx}>
                    <td style={{ fontSize: '0.8rem', fontWeight: '600' }}>{item.productName} ({item.color})</td>
                    <td><span className="badge badge-blue">{item.size}</span></td>
                    <td className="mono" style={{ color: '#f85149', fontWeight: '800' }}>{item.qty} pcs</td>
                    <td><span className="badge badge-red">CRITICAL REORDER</span></td>
                  </tr>
                ))}
                {stockList.length === 0 && (
                  <tr>
                    <td colSpan="4" style={{ textAlign: 'center', padding: '20px', color: 'var(--text-muted)' }}>
                      Stock is empty. Add products & stock to view alerts.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  );
};
