import React, { useState } from 'react';
import { RotateCcw, Plus, Search, CheckCircle2 } from 'lucide-react';
import { getData, saveSalesReturn } from '../db/storage';

export const SalesReturnView = () => {
  const [returns, setReturns] = useState(() => getData('RETURNS') || []);
  const [invoices] = useState(() => getData('INVOICES') || []);
  const [products] = useState(() => getData('PRODUCTS') || []);

  const [showModal, setShowModal] = useState(false);
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

  const handleSaveReturn = (e) => {
    e.preventDefault();
    setFeedback({ type: '', text: '' });

    const inv = invoices.find(i => i.invoiceNo === selectedInvoiceNo);
    const returnNo = `RET-${new Date().getFullYear()}-${String(returns.length + 1).padStart(3, '0')}`;

    const totalRefund = returnItems.reduce((sum, item) => sum + (item.qty * item.rate), 0);

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
        <button className="btn btn-primary" onClick={() => setShowModal(true)}>
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
            </tr>
          </thead>
          <tbody>
            {returns.length === 0 ? (
              <tr>
                <td colSpan="7" style={{ textAlign: 'center', padding: '30px', color: 'var(--text-muted)' }}>
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
                  <td className="mono" style={{ fontWeight: '800', color: '#f85149' }}>₹{ret.totalRefund?.toFixed(2)}</td>
                  <td style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>{ret.remarks}</td>
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
                    <input type="number" min="1" style={{ width: '100%', fontWeight: '700' }} value={returnItems[0].qty} onChange={(e) => setReturnItems([{ ...returnItems[0], qty: parseInt(e.target.value) || 1 }])} />
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
