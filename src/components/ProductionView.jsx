import React, { useState } from 'react';
import { Factory, Plus, CheckCircle2, Boxes, Scissors } from 'lucide-react';
import { getData, processProductionEntry } from '../db/storage';

export const ProductionView = () => {
  const [productions, setProductions] = useState(() => getData('PRODUCTIONS') || []);
  const [products, setProducts] = useState(() => getData('PRODUCTS') || []);

  // Real-time listener for DB updates
  React.useEffect(() => {
    const handleDbUpdate = () => {
      setProductions(getData('PRODUCTIONS') || []);
      setProducts(getData('PRODUCTS') || []);
    };
    window.addEventListener('aliston-db-updated', handleDbUpdate);
    return () => window.removeEventListener('aliston-db-updated', handleDbUpdate);
  }, []);

  const [showModal, setShowModal] = useState(false);
  const [selectedProductId, setSelectedProductId] = useState(products[0]?.id || '');
  const [color, setColor] = useState('Royal Blue');
  const [batchNo, setBatchNo] = useState(`BATCH-${new Date().getFullYear()}-01`);
  const [workerTailor, setWorkerTailor] = useState('Master Artisan Tailors (Unit 3)');
  const [remarks, setRemarks] = useState('Production completed & inspected');

  // Size breakdown
  const [sizes, setSizes] = useState({ S: 10, M: 20, L: 25, XL: 20, XXL: 15, XXXL: 10 });

  const [feedback, setFeedback] = useState({ type: '', text: '' });

  const selectedProduct = products.find(p => p.id === selectedProductId);
  const totalQty = Object.values(sizes).reduce((sum, v) => sum + (parseInt(v) || 0), 0);

  const handleCreateProduction = async (e) => {
    e.preventDefault();
    setFeedback({ type: '', text: '' });

    if (!navigator.onLine) {
      setFeedback({ type: 'error', text: 'Cannot record production while offline. Active server connection required.' });
      return;
    }

    const res = await processProductionEntry({
      productId: selectedProductId,
      color,
      sizeQuantities: sizes,
      batchNo,
      workerTailor,
      remarks,
      userEmail: 'studioaliston@gmail.com'
    });

    if (res.success) {
      setProductions(getData('PRODUCTIONS') || []);
      setFeedback({ type: 'success', text: res.message });
      setTimeout(() => {
        setShowModal(false);
        setFeedback({ type: '', text: '' });
      }, 1500);
    } else {
      setFeedback({ type: 'error', text: res.message });
    }
  };

  return (
    <div style={{ padding: '24px' }}>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '20px' }}>
        <div>
          <h2 style={{ fontSize: '1.4rem', fontWeight: '800' }}>ALISTON Garment Production Entry Module</h2>
          <p style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>
            Record finished garment manufacturing batches — automatically consumes raw material & adds size stock
          </p>
        </div>
        <button className="btn btn-primary" onClick={() => setShowModal(true)}>
          <Plus size={16} /> + Record Production Batch
        </button>
      </div>

      {/* Production Entries Table */}
      <div className="erp-table-container">
        <table className="erp-table">
          <thead>
            <tr>
              <th>Production #</th>
              <th>Date</th>
              <th>Batch #</th>
              <th>Product Name</th>
              <th>Colour</th>
              <th>S / M / L / XL / XXL / 3XL</th>
              <th>Total Units Produced</th>
              <th>Tailor / Artisan</th>
              <th>Total Batch Cost</th>
            </tr>
          </thead>
          <tbody>
            {productions.length === 0 ? (
              <tr>
                <td colSpan="9" style={{ textAlign: 'center', padding: '30px', color: 'var(--text-muted)' }}>
                  No production entries recorded yet.
                </td>
              </tr>
            ) : (
              productions.map(prd => (
                <tr key={prd.id}>
                  <td className="mono" style={{ fontWeight: '700', color: 'var(--accent-gold)' }}>{prd.productionNo}</td>
                  <td>{prd.date}</td>
                  <td className="mono">{prd.batchNo}</td>
                  <td style={{ fontWeight: '600' }}>{prd.productName}</td>
                  <td><span className="badge badge-gold">{prd.color}</span></td>
                  <td className="mono" style={{ fontSize: '0.775rem' }}>
                    S:{prd.sizeQuantities?.S || 0} | M:{prd.sizeQuantities?.M || 0} | L:{prd.sizeQuantities?.L || 0} | XL:{prd.sizeQuantities?.XL || 0} | XXL:{prd.sizeQuantities?.XXL || 0} | 3XL:{prd.sizeQuantities?.XXXL || 0}
                  </td>
                  <td className="mono" style={{ fontWeight: '800', color: '#38bdf8' }}>{prd.totalQty} pcs</td>
                  <td style={{ fontSize: '0.8rem' }}>{prd.workerTailor}</td>
                  <td className="mono" style={{ fontWeight: '800', color: '#3fb950' }}>₹{prd.totalProductionCost?.toFixed(2)}</td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {/* Production Modal */}
      {showModal && (
        <div className="modal-overlay">
          <div className="modal-content" style={{ maxWidth: '650px' }}>
            <div className="modal-header">
              <h3>Record Production & BOM Material Consumption</h3>
              <button onClick={() => setShowModal(false)} style={{ background: 'none', color: 'var(--text-muted)' }}>✕</button>
            </div>
            <form onSubmit={handleCreateProduction}>
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
                  <label style={{ fontSize: '0.775rem', color: 'var(--text-secondary)' }}>Select Product to Manufacture *</label>
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
                    <label style={{ fontSize: '0.775rem', color: 'var(--text-secondary)' }}>Fabric Colour</label>
                    <input type="text" style={{ width: '100%' }} value={color} onChange={(e) => setColor(e.target.value)} />
                  </div>
                  <div>
                    <label style={{ fontSize: '0.775rem', color: 'var(--text-secondary)' }}>Batch #</label>
                    <input type="text" style={{ width: '100%' }} value={batchNo} onChange={(e) => setBatchNo(e.target.value)} />
                  </div>
                </div>

                {/* Size breakdown grid */}
                <div>
                  <label style={{ fontSize: '0.8rem', fontWeight: '700', color: 'var(--accent-gold)', marginBottom: '6px', display: 'block' }}>
                    Finished Quantity Produced by Size:
                  </label>
                  <div style={{ display: 'grid', gridTemplateColumns: 'repeat(6, 1fr)', gap: '8px' }}>
                    {['S', 'M', 'L', 'XL', 'XXL', 'XXXL'].map(sz => (
                      <div key={sz} style={{ textAlign: 'center' }}>
                        <div style={{ fontSize: '0.7rem', color: 'var(--text-muted)', marginBottom: '2px' }}>Size {sz}</div>
                        <input 
                          type="number" 
                          min="0" 
                          style={{ width: '100%', textAlign: 'center', fontWeight: '700' }} 
                          value={sizes[sz] || 0}
                          onChange={(e) => setSizes({ ...sizes, [sz]: parseInt(e.target.value) || 0 })}
                        />
                      </div>
                    ))}
                  </div>
                  <div style={{ textAlign: 'right', marginTop: '6px', fontSize: '0.85rem', fontWeight: '800', color: '#38bdf8' }}>
                    Total Units = {totalQty} pcs
                  </div>
                </div>

                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
                  <div>
                    <label style={{ fontSize: '0.775rem', color: 'var(--text-secondary)' }}>Worker / Tailor Unit</label>
                    <input type="text" style={{ width: '100%' }} value={workerTailor} onChange={(e) => setWorkerTailor(e.target.value)} />
                  </div>
                  <div>
                    <label style={{ fontSize: '0.775rem', color: 'var(--text-secondary)' }}>Remarks</label>
                    <input type="text" style={{ width: '100%' }} value={remarks} onChange={(e) => setRemarks(e.target.value)} />
                  </div>
                </div>

                <div style={{ backgroundColor: 'rgba(255,255,255,0.03)', padding: '12px', borderRadius: '6px', border: '1px solid var(--border-color)', fontSize: '0.775rem', color: 'var(--text-muted)' }}>
                  ⓘ Saving this production entry will automatically consume raw materials (Fabric, Buttons, Labels, Interlining) based on the BOM and add {totalQty} finished garments to the size matrix stock.
                </div>
              </div>

              <div className="modal-footer">
                <button type="button" className="btn btn-secondary" onClick={() => setShowModal(false)}>Cancel</button>
                <button type="submit" className="btn btn-primary">Complete Production & Update Stock</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
