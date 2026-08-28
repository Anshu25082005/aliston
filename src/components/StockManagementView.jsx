import React, { useState } from 'react';
import { 
  Boxes, 
  Plus, 
  Minus, 
  RefreshCw, 
  ArrowLeftRight, 
  Search, 
  History, 
  Filter, 
  AlertTriangle,
  CheckCircle2
} from 'lucide-react';
import { getData, updateFinishedStock } from '../db/storage';
import { exportToExcel } from '../utils/excelExporter';

export const StockManagementView = () => {
  const [stockList, setStockList] = useState(() => getData('STOCK') || []);
  const [products, setProducts] = useState(() => getData('PRODUCTS') || []);
  const [stockTx, setStockTx] = useState(() => getData('STOCK_TRANSACTIONS') || []);

  // Subscribe to real-time database updates
  React.useEffect(() => {
    const handleDbUpdate = () => {
      setStockList(getData('STOCK') || []);
      setProducts(getData('PRODUCTS') || []);
      setStockTx(getData('STOCK_TRANSACTIONS') || []);
    };
    window.addEventListener('aliston-db-updated', handleDbUpdate);
    return () => window.removeEventListener('aliston-db-updated', handleDbUpdate);
  }, []);

  const [searchTerm, setSearchTerm] = useState('');
  const [activeSubTab, setActiveSubTab] = useState('matrix'); // 'matrix' | 'colour' | 'ledger'

  // Stock Action Modal State
  const [showModal, setShowModal] = useState(false);
  const [actionType, setActionType] = useState('ADD'); // 'ADD' | 'REMOVE' | 'OPENING' | 'ADJUSTMENT' | 'TRANSFER' | 'RETURN'
  const [selectedProductId, setSelectedProductId] = useState(products[0]?.id || '');
  const [selectedColor, setSelectedColor] = useState('Royal Blue');
  const [selectedSize, setSelectedSize] = useState('M');
  const [quantity, setQuantity] = useState(10);
  const [refNo, setRefNo] = useState('');
  const [remarks, setRemarks] = useState('');
  const [modalFeedback, setModalFeedback] = useState({ type: '', text: '' });

  const handleOpenActionModal = (type = 'ADD', prodId = null, color = null, size = 'M') => {
    setActionType(type);
    if (prodId) setSelectedProductId(prodId);
    if (color) setSelectedColor(color);
    if (size) setSelectedSize(size);
    setQuantity(10);
    setRefNo(`STK-ADJ-${Date.now()}`);
    setRemarks('');
    setModalFeedback({ type: '', text: '' });
    setShowModal(true);
  };

  const handleExecuteStockAction = (e) => {
    e.preventDefault();
    setModalFeedback({ type: '', text: '' });

    const changeQty = (actionType === 'REMOVE' || actionType === 'DAMAGE') ? -Math.abs(quantity) : Math.abs(quantity);

    const res = updateFinishedStock({
      productId: selectedProductId,
      color: selectedColor,
      size: selectedSize,
      changeQty,
      transactionType: actionType === 'ADD' ? 'PURCHASE' : actionType === 'OPENING' ? 'OPENING_STOCK' : actionType === 'REMOVE' ? 'STOCK_ADJUSTMENT' : actionType,
      refNo: refNo || `TX-${Date.now()}`,
      remarks: remarks || `Manual ${actionType} entry`
    });

    if (res.success) {
      setStockList(getData('STOCK') || []);
      setModalFeedback({ type: 'success', text: `Stock updated successfully! New quantity for size ${selectedSize} is ${res.newQty}.` });
      setTimeout(() => {
        setShowModal(false);
        setModalFeedback({ type: '', text: '' });
      }, 1200);
    } else {
      setModalFeedback({ type: 'error', text: res.message });
    }
  };

  const handleExportExcel = () => {
    const dataToExport = stockList.map(s => ({
      'Product Name': s.productName,
      'Fabric': s.fabric,
      'Colour': s.color,
      'Size S': s.sizes?.S || 0,
      'Size M': s.sizes?.M || 0,
      'Size L': s.sizes?.L || 0,
      'Size XL': s.sizes?.XL || 0,
      'Size XXL': s.sizes?.XXL || 0,
      'Size XXXL': s.sizes?.XXXL || 0,
      'Total Stock': s.total || 0
    }));
    exportToExcel(dataToExport, 'ALISTON_Size_Wise_Stock.xlsx', 'StockMatrix');
  };

  // Filter Stock List
  const filteredStock = stockList.filter(s => {
    return s.productName.toLowerCase().includes(searchTerm.toLowerCase()) ||
           s.color.toLowerCase().includes(searchTerm.toLowerCase()) ||
           s.fabric.toLowerCase().includes(searchTerm.toLowerCase());
  });

  return (
    <div style={{ padding: '24px' }}>
      {/* Top Header */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '20px' }}>
        <div>
          <h2 style={{ fontSize: '1.4rem', fontWeight: '800' }}>ALISTON Size & Colour Wise Stock Management</h2>
          <p style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>
            Real-time finished goods stock matrix, stock adjustments & audit ledger
          </p>
        </div>
        <div style={{ display: 'flex', gap: '12px' }}>
          <button className="btn btn-secondary" onClick={handleExportExcel}>
            Export Stock Excel
          </button>
          <button className="btn btn-primary" onClick={() => handleOpenActionModal('ADD')}>
            <Plus size={16} /> Quick Add / Adjust Stock
          </button>
        </div>
      </div>

      {/* Sub Tabs Bar */}
      <div style={{ display: 'flex', gap: '8px', borderBottom: '1px solid var(--border-color)', marginBottom: '20px' }}>
        <button
          onClick={() => setActiveSubTab('matrix')}
          style={{
            padding: '10px 16px',
            fontWeight: '700',
            fontSize: '0.85rem',
            borderBottom: activeSubTab === 'matrix' ? '2px solid var(--accent-gold)' : 'none',
            color: activeSubTab === 'matrix' ? 'var(--accent-gold)' : 'var(--text-secondary)',
            background: 'none'
          }}
        >
          Size-Wise Matrix (S - XXXL)
        </button>
        <button
          onClick={() => setActiveSubTab('colour')}
          style={{
            padding: '10px 16px',
            fontWeight: '700',
            fontSize: '0.85rem',
            borderBottom: activeSubTab === 'colour' ? '2px solid var(--accent-gold)' : 'none',
            color: activeSubTab === 'colour' ? 'var(--accent-gold)' : 'var(--text-secondary)',
            background: 'none'
          }}
        >
          Colour & Fabric Breakdown
        </button>
        <button
          onClick={() => setActiveSubTab('ledger')}
          style={{
            padding: '10px 16px',
            fontWeight: '700',
            fontSize: '0.85rem',
            borderBottom: activeSubTab === 'ledger' ? '2px solid var(--accent-gold)' : 'none',
            color: activeSubTab === 'ledger' ? 'var(--accent-gold)' : 'var(--text-secondary)',
            background: 'none'
          }}
        >
          Stock Audit Ledger Trail
        </button>
      </div>

      {/* Search Input */}
      <div className="card" style={{ padding: '12px 18px', marginBottom: '20px', display: 'flex', alignItems: 'center', gap: '12px' }}>
        <Search size={16} color="var(--text-muted)" />
        <input 
          type="text" 
          placeholder="Filter by Product Name, Colour, Fabric..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          style={{ width: '100%' }}
        />
      </div>

      {/* SUB TAB 1: SIZE-WISE STOCK MATRIX */}
      {activeSubTab === 'matrix' && (
        <div className="erp-table-container">
          <table className="erp-table">
            <thead>
              <tr>
                <th>Product Name</th>
                <th>Fabric</th>
                <th>Colour</th>
                <th style={{ textAlign: 'center' }}>S</th>
                <th style={{ textAlign: 'center' }}>M</th>
                <th style={{ textAlign: 'center' }}>L</th>
                <th style={{ textAlign: 'center' }}>XL</th>
                <th style={{ textAlign: 'center' }}>XXL</th>
                <th style={{ textAlign: 'center' }}>XXXL</th>
                <th style={{ textAlign: 'center', backgroundColor: 'rgba(229, 185, 92, 0.1)' }}>Total Stock</th>
                <th style={{ textAlign: 'center' }}>Quick Actions</th>
              </tr>
            </thead>
            <tbody>
              {filteredStock.length === 0 ? (
                <tr>
                  <td colSpan="11" style={{ textAlign: 'center', padding: '30px', color: 'var(--text-muted)' }}>
                    No stock records found.
                  </td>
                </tr>
              ) : (
                filteredStock.map((s, idx) => (
                  <tr key={idx}>
                    <td style={{ fontWeight: '700', fontSize: '0.85rem' }}>{s.productName}</td>
                    <td style={{ fontSize: '0.8rem', color: 'var(--text-secondary)' }}>{s.fabric}</td>
                    <td><span className="badge badge-gold">{s.color}</span></td>
                    
                    {['S', 'M', 'L', 'XL', 'XXL', 'XXXL'].map(sz => {
                      const qty = Math.max(0, parseInt(s.sizes?.[sz]) || 0);
                      const isLow = qty < 10;
                      return (
                        <td key={sz} style={{ textAlign: 'center' }}>
                          <span 
                            onClick={() => handleOpenActionModal('ADD', s.productId, s.color, sz)}
                            title="Click to adjust size stock"
                            style={{
                              padding: '4px 8px',
                              borderRadius: '4px',
                              fontWeight: '700',
                              fontSize: '0.8rem',
                              fontFamily: 'var(--font-mono)',
                              cursor: 'pointer',
                              backgroundColor: isLow ? 'rgba(218, 54, 51, 0.15)' : 'rgba(255, 255, 255, 0.03)',
                              color: isLow ? '#f85149' : 'var(--text-primary)',
                              border: isLow ? '1px solid rgba(218, 54, 51, 0.3)' : '1px solid var(--border-color)'
                            }}
                          >
                            {qty}
                          </span>
                        </td>
                      );
                    })}

                    <td style={{ textAlign: 'center', backgroundColor: 'rgba(229, 185, 92, 0.05)' }}>
                      <span className="mono" style={{ fontSize: '0.95rem', fontWeight: '800', color: 'var(--accent-gold)' }}>
                        {Math.max(0, s.total || 0)} pcs
                      </span>
                    </td>

                    <td style={{ textAlign: 'center' }}>
                      <div style={{ display: 'flex', justifyContent: 'center', gap: '6px' }}>
                        <button className="btn btn-secondary btn-sm" onClick={() => handleOpenActionModal('ADD', s.productId, s.color, 'M')}>
                          + Add Stock
                        </button>
                        <button className="btn btn-secondary btn-sm" onClick={() => handleOpenActionModal('REMOVE', s.productId, s.color, 'M')}>
                          - Remove
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      )}

      {/* SUB TAB 2: COLOUR & FABRIC BREAKDOWN */}
      {activeSubTab === 'colour' && (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(320px, 1fr))', gap: '16px' }}>
          {filteredStock.map((s, idx) => (
            <div key={idx} className="card">
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '12px' }}>
                <h3 style={{ fontSize: '0.95rem', fontWeight: '700' }}>{s.productName}</h3>
                <span className="badge badge-gold">{s.color}</span>
              </div>

              <div style={{ fontSize: '0.775rem', color: 'var(--text-secondary)', marginBottom: '12px' }}>
                Fabric: <strong>{s.fabric}</strong>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '8px', marginBottom: '16px' }}>
                {Object.entries(s.sizes || {}).map(([sz, qty]) => {
                  const safeQty = Math.max(0, parseInt(qty) || 0);
                  return (
                    <div key={sz} style={{ backgroundColor: 'rgba(255,255,255,0.02)', border: '1px solid var(--border-color)', padding: '6px', borderRadius: '6px', textAlign: 'center' }}>
                      <div style={{ fontSize: '0.7rem', color: 'var(--text-muted)' }}>Size {sz}</div>
                      <div className="mono" style={{ fontWeight: '800', fontSize: '0.9rem', color: safeQty < 10 ? '#f85149' : 'var(--text-primary)' }}>
                        {safeQty}
                      </div>
                    </div>
                  );
                })}
              </div>

              <div style={{ borderTop: '1px solid var(--border-color)', paddingTop: '10px', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                <span style={{ fontSize: '0.8rem', color: 'var(--text-secondary)' }}>Total Color Stock:</span>
                <span className="mono" style={{ fontSize: '1rem', fontWeight: '800', color: 'var(--accent-gold)' }}>{Math.max(0, s.total || 0)} pcs</span>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* SUB TAB 3: STOCK AUDIT LEDGER TRAIL */}
      {activeSubTab === 'ledger' && (
        <div className="erp-table-container">
          <table className="erp-table">
            <thead>
              <tr>
                <th>Date & Time</th>
                <th>Ref / Invoice #</th>
                <th>Product Name</th>
                <th>Colour</th>
                <th>Size</th>
                <th>Tx Type</th>
                <th>Prev Qty</th>
                <th>Change</th>
                <th>New Qty</th>
                <th>User</th>
                <th>Remarks</th>
              </tr>
            </thead>
            <tbody>
              {stockTx.map((tx, idx) => (
                <tr key={idx}>
                  <td style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>
                    {new Date(tx.timestamp).toLocaleString()}
                  </td>
                  <td className="mono" style={{ fontWeight: '700', fontSize: '0.8rem' }}>{tx.refNo}</td>
                  <td style={{ fontWeight: '600' }}>{tx.productName}</td>
                  <td><span className="badge badge-gold">{tx.color}</span></td>
                  <td><span className="badge badge-blue">{tx.size}</span></td>
                  <td>
                    <span className={`badge ${tx.changeQty > 0 ? 'badge-green' : 'badge-red'}`}>
                      {tx.transactionType}
                    </span>
                  </td>
                  <td className="mono">{tx.previousQty}</td>
                  <td className="mono" style={{ fontWeight: '800', color: tx.changeQty > 0 ? '#3fb950' : '#f85149' }}>
                    {tx.changeQty > 0 ? `+${tx.changeQty}` : tx.changeQty}
                  </td>
                  <td className="mono" style={{ fontWeight: '800' }}>{tx.newQty}</td>
                  <td style={{ fontSize: '0.75rem', color: 'var(--text-secondary)' }}>{tx.createdBy}</td>
                  <td style={{ fontSize: '0.75rem', maxWidth: '180px', whiteSpace: 'normal' }}>{tx.remarks}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* Stock Action Modal */}
      {showModal && (
        <div className="modal-overlay">
          <div className="modal-content" style={{ maxWidth: '500px' }}>
            <div className="modal-header">
              <h3>Stock Operation: {actionType} STOCK</h3>
              <button onClick={() => setShowModal(false)} style={{ background: 'none', color: 'var(--text-muted)' }}>✕</button>
            </div>
            <form onSubmit={handleExecuteStockAction}>
              <div className="modal-body" style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
                {modalFeedback.text && (
                  <div style={{
                    padding: '8px 12px',
                    borderRadius: '4px',
                    fontSize: '0.8rem',
                    backgroundColor: modalFeedback.type === 'error' ? 'rgba(218,54,51,0.2)' : 'rgba(35,134,54,0.2)',
                    color: modalFeedback.type === 'error' ? '#f85149' : '#3fb950'
                  }}>
                    {modalFeedback.text}
                  </div>
                )}

                <div>
                  <label style={{ fontSize: '0.775rem', color: 'var(--text-secondary)' }}>Product *</label>
                  <select 
                    style={{ width: '100%' }}
                    value={selectedProductId}
                    onChange={(e) => setSelectedProductId(e.target.value)}
                  >
                    {products.map(p => <option key={p.id} value={p.id}>{p.code} - {p.name}</option>)}
                  </select>
                </div>

                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
                  <div>
                    <label style={{ fontSize: '0.775rem', color: 'var(--text-secondary)' }}>Colour</label>
                    <input 
                      type="text" 
                      style={{ width: '100%' }}
                      value={selectedColor}
                      onChange={(e) => setSelectedColor(e.target.value)}
                    />
                  </div>
                  <div>
                    <label style={{ fontSize: '0.775rem', color: 'var(--text-secondary)' }}>Size</label>
                    <select 
                      style={{ width: '100%' }}
                      value={selectedSize}
                      onChange={(e) => setSelectedSize(e.target.value)}
                    >
                      {['S', 'M', 'L', 'XL', 'XXL', 'XXXL'].map(sz => <option key={sz} value={sz}>{sz}</option>)}
                    </select>
                  </div>
                </div>

                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
                  <div>
                    <label style={{ fontSize: '0.775rem', color: 'var(--text-secondary)' }}>Quantity (Pieces)</label>
                    <input 
                      type="number" 
                      required 
                      min="1"
                      style={{ width: '100%' }}
                      value={quantity === 0 || quantity === '0' ? '' : quantity}
                      placeholder="0"
                      onFocus={(e) => e.target.select()}
                      onChange={(e) => setQuantity(e.target.value === '' ? 0 : parseInt(e.target.value) || 0)}
                    />
                  </div>
                  <div>
                    <label style={{ fontSize: '0.775rem', color: 'var(--text-secondary)' }}>Ref / Batch #</label>
                    <input 
                      type="text" 
                      style={{ width: '100%' }}
                      value={refNo}
                      onChange={(e) => setRefNo(e.target.value)}
                    />
                  </div>
                </div>

                <div>
                  <label style={{ fontSize: '0.775rem', color: 'var(--text-secondary)' }}>Remarks</label>
                  <input 
                    type="text" 
                    style={{ width: '100%' }}
                    placeholder="e.g. Received from production unit"
                    value={remarks}
                    onChange={(e) => setRemarks(e.target.value)}
                  />
                </div>
              </div>

              <div className="modal-footer">
                <button type="button" className="btn btn-secondary" onClick={() => setShowModal(false)}>Cancel</button>
                <button type="submit" className="btn btn-primary">Execute Stock Update</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
