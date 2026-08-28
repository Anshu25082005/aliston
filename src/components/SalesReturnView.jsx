import React, { useState } from 'react';
import { RotateCcw, Plus, Search, CheckCircle2, Trash2, Edit } from 'lucide-react';
import { getData, saveData, saveSalesReturn, markIdDeleted } from '../db/storage';

export const SalesReturnView = () => {
  const [returns, setReturns] = useState(() => getData('RETURNS') || []);
  const [invoices] = useState(() => getData('INVOICES') || []);
  const [products] = useState(() => getData('PRODUCTS') || []);

  const [showModal, setShowModal] = useState(false);
  const [editingReturn, setEditingReturn] = useState(null);
  const [selectedInvoiceNo, setSelectedInvoiceNo] = useState(invoices[0]?.invoiceNo || '');
  const [returnReason, setReturnReason] = useState('Size Fitting Exchange');

  const [returnItems, setReturnItems] = useState([
    {
      productId: products[0]?.id || '',
      color: 'Royal Blue',
      size: 'M',
      qty: 2,
      rate: products[0]?.sellingPrice || 1000
    }
  ]);

  const [feedback, setFeedback] = useState({ type: '', text: '' });

  const handleOpenModal = () => {
    setEditingReturn(null);
    setSelectedInvoiceNo(invoices[0]?.invoiceNo || '');
    setReturnReason('Size Fitting Exchange');
    setReturnItems([
      {
        productId: products[0]?.id || '',
        color: 'Royal Blue',
        size: 'M',
        qty: 2,
        rate: products[0]?.sellingPrice || 1000
      }
    ]);
    setShowModal(true);
  };

  const handleEditReturn = (ret) => {
    setEditingReturn(ret);
    setSelectedInvoiceNo(ret.invoiceNo || invoices[0]?.invoiceNo || '');
    setReturnReason(ret.remarks || 'Size Fitting Exchange');
    if (ret.items && ret.items.length > 0) {
      setReturnItems(ret.items);
    }
    setShowModal(true);
  };

  const handleDeleteReturn = (id) => {
    if (confirm('Are you sure you want to delete this sales return entry?')) {
      markIdDeleted('RETURNS', id);
      const updated = returns.filter(r => r.id !== id);
      setReturns(updated);
      saveData('RETURNS', updated);
    }
  };

  const handleSaveReturn = (e) => {
    e.preventDefault();
    setFeedback({ type: '', text: '' });

    const inv = invoices.find(i => i.invoiceNo === selectedInvoiceNo);
    const totalRefund = returnItems.reduce((sum, item) => sum + (item.qty * item.rate), 0);

    if (editingReturn) {
      const updated = returns.map(r => r.id === editingReturn.id ? {
        ...r,
        invoiceNo: selectedInvoiceNo,
        customerId: inv?.customerId || r.customerId,
        customerName: inv?.customerName || r.customerName,
        items: returnItems.map(i => ({ ...i, reason: returnReason })),
        totalRefund,
        remarks: returnReason
      } : r);
      setReturns(updated);
      saveData('RETURNS', updated);
      setFeedback({ type: 'success', text: `Sales return ${editingReturn.returnNo} updated successfully!` });
      setTimeout(() => {
        setShowModal(false);
        setFeedback({ type: '', text: '' });
        setEditingReturn(null);
      }, 1200);
      return;
    }

    const returnNo = `RET-${new Date().getFullYear()}-${String(returns.length + 1).padStart(3, '0')}`;
    const payload = {
      returnNo,
      invoiceNo: selectedInvoiceNo,
      date: new Date().toISOString().split('T')[0],
      customerId: inv?.customerId || 'cust-1',
      customerName: inv?.customerName || 'Customer',
      items: returnItems.map(i => ({ ...i, reason: returnReason })),
      totalRefund,
      remarks: returnReason
    };

    const res = saveSalesReturn(payload);
    if (res.success) {
      setReturns(getData('RETURNS') || []);
      setFeedback({ type: 'success', text: `Sales return ${returnNo} saved! Items added back to inventory stock.` });
      setTimeout(() => {
        setShowModal(false);
        setFeedback({ type: '', text: '' });
      }, 1400);
    } else {
      setFeedback({ type: 'error', text: 'Error saving return entry.' });
    }
  };

  return (
    <div style={{ padding: '24px' }}>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '20px' }}>
        <div>
          <h2 style={{ fontSize: '1.4rem', fontWeight: '800' }}>ALISTON Sales Return Module</h2>
          <p style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>
            Process customer garment returns & automatically add returned size units back into stock
          </p>
        </div>
        <button className="btn btn-primary" onClick={handleOpenModal}>
          <Plus size={16} /> + New Sales Return Entry
        </button>
      </div>

      {/* Return Table */}
      <div className="erp-table-container">
        <table className="erp-table">
          <thead>
            <tr>
              <th>Return #</th>
              <th>Date</th>
              <th>Orig Invoice #</th>
              <th>Customer Name</th>
              <th>Returned Garments</th>
              <th>Total Refund</th>
              <th>Reason</th>
              <th style={{ textAlign: 'center' }}>Actions</th>
            </tr>
          </thead>
          <tbody>
            {returns.length === 0 ? (
              <tr>
                <td colSpan="8" style={{ textAlign: 'center', padding: '30px', color: 'var(--text-muted)' }}>
                  No sales returns recorded yet.
                </td>
              </tr>
            ) : (
              returns.map(ret => (
                <tr key={ret.id}>
                  <td className="mono" style={{ fontWeight: '700', color: 'var(--accent-gold)' }}>{ret.returnNo}</td>
                  <td>{ret.date}</td>
                  <td className="mono">{ret.invoiceNo}</td>
                  <td style={{ fontWeight: '600' }}>{ret.customerName}</td>
                  <td>
                    {ret.items?.map((it, i) => (
                      <span key={i} className="badge badge-blue" style={{ marginRight: '4px' }}>
                        {it.color} ({it.size}): {it.qty} pcs
                      </span>
                    ))}
                  </td>
                  <td className="mono" style={{ fontWeight: '800', color: '#f85149' }}>
                    ₹{(parseFloat(ret.totalRefund) || 0).toFixed(2)}
                  </td>
                  <td style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>{ret.remarks}</td>
                  <td style={{ textAlign: 'center' }}>
                    <div style={{ display: 'flex', gap: '6px', justifyContent: 'center' }}>
                      <button 
                        className="btn btn-secondary btn-sm"
                        onClick={() => handleEditReturn(ret)}
                        title="Edit Sales Return Entry"
                        style={{ backgroundColor: 'var(--accent-gold)', color: '#000000', fontWeight: '800', padding: '4px 8px' }}
                      >
                        <Edit size={14} />
                      </button>
                      <button 
                        className="btn btn-danger btn-sm"
                        onClick={() => handleDeleteReturn(ret.id)}
                        title="Delete Sales Return Entry"
                        style={{ backgroundColor: '#dc2626', color: '#ffffff', padding: '4px 8px' }}
                      >
                        <Trash2 size={14} />
                      </button>
                    </div>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {/* Sales Return Modal */}
      {showModal && (
        <div className="modal-overlay">
          <div className="modal-content" style={{ maxWidth: '550px' }}>
            <div className="modal-header">
              <h3>Create Sales Return Entry</h3>
              <button onClick={() => setShowModal(false)} style={{ background: 'none', color: 'var(--text-muted)' }}>✕</button>
            </div>
            <form onSubmit={handleSaveReturn}>
              <div className="modal-body" style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
                {feedback.text && (
                  <div style={{
                    padding: '8px 12px',
                    borderRadius: '4px',
                    fontSize: '0.8rem',
                    backgroundColor: feedback.type === 'error' ? 'rgba(218,54,51,0.2)' : 'rgba(35,134,54,0.2)',
                    color: feedback.type === 'error' ? '#f85149' : '#3fb950'
                  }}>
                    {feedback.text}
                  </div>
                )}

                <div>
                  <label style={{ fontSize: '0.775rem', color: 'var(--text-secondary)' }}>Select Invoice #</label>
                  <select style={{ width: '100%' }} value={selectedInvoiceNo} onChange={(e) => setSelectedInvoiceNo(e.target.value)}>
                    {invoices.map(i => <option key={i.id} value={i.invoiceNo}>{i.invoiceNo} - {i.customerName} (₹{i.grandTotal})</option>)}
                  </select>
                </div>

                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
                  <div>
                    <label style={{ fontSize: '0.775rem', color: 'var(--text-secondary)' }}>Returned Size</label>
                    <select style={{ width: '100%' }} value={returnItems[0].size} onChange={(e) => setReturnItems([{ ...returnItems[0], size: e.target.value }])}>
                      {['S', 'M', 'L', 'XL', 'XXL', 'XXXL'].map(sz => <option key={sz} value={sz}>{sz}</option>)}
                    </select>
                  </div>
                  <div>
                    <label style={{ fontSize: '0.775rem', color: 'var(--text-secondary)' }}>Quantity Returned</label>
                    <input 
                      type="number" 
                      min="1" 
                      style={{ width: '100%', fontWeight: '700' }} 
                      value={returnItems[0].qty === 0 || returnItems[0].qty === '0' ? '' : returnItems[0].qty} 
                      placeholder="0"
                      onFocus={(e) => e.target.select()}
                      onChange={(e) => setReturnItems([{ ...returnItems[0], qty: e.target.value === '' ? 0 : parseInt(e.target.value) || 0 }])} 
                    />
                  </div>
                </div>

                <div>
                  <label style={{ fontSize: '0.775rem', color: 'var(--text-secondary)' }}>Return Reason</label>
                  <input type="text" style={{ width: '100%' }} value={returnReason} onChange={(e) => setReturnReason(e.target.value)} placeholder="e.g. Size fitting exchange" />
                </div>

                <div style={{ backgroundColor: 'rgba(255,255,255,0.03)', padding: '12px', borderRadius: '6px', border: '1px solid var(--border-color)', fontSize: '0.775rem', color: 'var(--text-muted)' }}>
                  ⓘ Saving this return will immediately increment the finished goods size stock for {returnItems[0].size} by {returnItems[0].qty} pcs.
                </div>
              </div>

              <div className="modal-footer">
                <button type="button" className="btn btn-secondary" onClick={() => setShowModal(false)}>Cancel</button>
                <button type="submit" className="btn btn-primary">Process Return & Add Back to Stock</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
