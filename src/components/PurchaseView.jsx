import React, { useState, useEffect } from 'react';
import { ShoppingBag, Plus, Search, Calendar, FileText, CheckCircle2, Trash2, Edit } from 'lucide-react';
import { getData, saveData, updateRawMaterialStock, markIdDeleted } from '../db/storage';

export const PurchaseView = () => {
  const [purchases, setPurchases] = useState(() => getData('PURCHASES') || []);
  const [suppliers, setSuppliers] = useState(() => getData('SUPPLIERS') || []);
  const [materials, setMaterials] = useState(() => getData('MATERIALS') || []);

  const [showModal, setShowModal] = useState(false);
  const [editingPurchase, setEditingPurchase] = useState(null);
  const [searchTerm, setSearchTerm] = useState('');

  // Real-time listener for DB updates
  useEffect(() => {
    const handleDbUpdate = () => {
      setPurchases(getData('PURCHASES') || []);
      setSuppliers(getData('SUPPLIERS') || []);
      setMaterials(getData('MATERIALS') || []);
    };
    window.addEventListener('aliston-db-updated', handleDbUpdate);
    return () => window.removeEventListener('aliston-db-updated', handleDbUpdate);
  }, []);

  const handleDeletePurchase = (id) => {
    if (confirm('Are you sure you want to delete this purchase entry?')) {
      markIdDeleted('PURCHASES', id);
      const updated = purchases.filter(p => p.id !== id);
      setPurchases(updated);
      saveData('PURCHASES', updated);
    }
  };

  const [formData, setFormData] = useState({
    date: new Date().toISOString().split('T')[0],
    supplierId: '',
    supplierName: '',
    materialId: '',
    customMaterialName: '',
    quantity: 100,
    unit: 'metre',
    rate: 300,
    gstPercent: 5,
    discount: 0,
    paymentStatus: 'Paid',
    notes: 'Bulk material purchase'
  });

  const handleOpenModal = () => {
    setEditingPurchase(null);
    setFormData({
      date: new Date().toISOString().split('T')[0],
      supplierId: suppliers[0]?.id || 'NEW',
      supplierName: suppliers[0]?.name || '',
      materialId: materials[0]?.id || '',
      customMaterialName: '',
      quantity: 100,
      unit: materials[0]?.unit || 'metre',
      rate: materials[0]?.rate || 300,
      gstPercent: 5,
      discount: 0,
      paymentStatus: 'Paid',
      notes: 'Bulk material purchase'
    });
    setShowModal(true);
  };

  const handleEditPurchase = (pur) => {
    setEditingPurchase(pur);
    setFormData({
      date: pur.date || new Date().toISOString().split('T')[0],
      supplierId: pur.supplierId || 'NEW',
      supplierName: pur.supplierName || '',
      materialId: pur.materialId || '',
      customMaterialName: pur.material || '',
      quantity: pur.quantity || 0,
      unit: pur.unit || 'metre',
      rate: pur.rate || 0,
      gstPercent: pur.gstPercent || 5,
      discount: pur.discount || 0,
      paymentStatus: pur.paymentStatus || 'Paid',
      notes: pur.notes || ''
    });
    setShowModal(true);
  };

  const handleMaterialChange = (matId) => {
    if (matId === 'NEW') {
      setFormData(prev => ({
        ...prev,
        materialId: 'NEW',
        customMaterialName: '',
        rate: 300,
        unit: 'metre'
      }));
      return;
    }
    const mat = materials.find(m => m.id === matId);
    if (mat) {
      setFormData(prev => ({
        ...prev,
        materialId: matId,
        rate: mat.rate || 100,
        unit: mat.unit || 'metre'
      }));
    }
  };

  const subtotal = (formData.quantity * formData.rate) - formData.discount;
  const gstAmount = subtotal * (formData.gstPercent / 100);
  const grandTotal = subtotal + gstAmount;

  const handleSavePurchase = (e) => {
    e.preventDefault();

    let finalSupplierName = formData.supplierName.trim();
    if (!finalSupplierName && formData.supplierId) {
      const s = suppliers.find(sup => sup.id === formData.supplierId);
      if (s) finalSupplierName = s.name;
    }
    if (!finalSupplierName) finalSupplierName = 'Direct Supplier';

    // Auto-save supplier to SUPPLIERS table if new
    if (finalSupplierName && !suppliers.some(s => s.name.toLowerCase() === finalSupplierName.toLowerCase())) {
      const newSup = {
        id: 'sup-' + Date.now(),
        name: finalSupplierName,
        contact: 'Contact Person',
        phone: '',
        email: '',
        gstin: 'UNREGISTERED',
        city: 'Surat'
      };
      saveData('SUPPLIERS', [...suppliers, newSup]);
    }

    let targetMatId = formData.materialId;
    let finalMatName = '';

    // Auto-save material master if new
    if (formData.materialId === 'NEW' || !formData.materialId) {
      finalMatName = formData.customMaterialName.trim() || 'Raw Fabric Roll';
      targetMatId = 'mat-' + Date.now();
      const newMat = {
        id: targetMatId,
        name: finalMatName,
        category: 'Fabric',
        rate: formData.rate,
        unit: formData.unit,
        currentStock: formData.quantity,
        minStock: 50
      };
      saveData('MATERIALS', [...materials, newMat]);
    } else {
      const mat = materials.find(m => m.id === formData.materialId);
      finalMatName = mat ? mat.name : 'Material';
      updateRawMaterialStock({
        materialId: targetMatId,
        changeQty: formData.quantity,
        remarks: `Purchased via PUR`
      });
    }

    let updated;
    if (editingPurchase) {
      updated = purchases.map(p => p.id === editingPurchase.id ? {
        ...p,
        date: formData.date,
        supplierId: formData.supplierId,
        supplierName: finalSupplierName,
        materialId: targetMatId,
        material: finalMatName,
        quantity: formData.quantity,
        unit: formData.unit,
        rate: formData.rate,
        gstPercent: formData.gstPercent,
        subtotal,
        gstAmount,
        grandTotal,
        paymentStatus: formData.paymentStatus,
        notes: formData.notes
      } : p);
    } else {
      const purchaseNo = `PUR-${new Date().getFullYear()}-${String(purchases.length + 1).padStart(3, '0')}`;
      const newPurchase = {
        id: 'pur-' + Date.now(),
        purchaseNo,
        date: formData.date,
        supplierId: formData.supplierId,
        supplierName: finalSupplierName,
        materialId: targetMatId,
        material: finalMatName,
        quantity: formData.quantity,
        unit: formData.unit,
        rate: formData.rate,
        gstPercent: formData.gstPercent,
        subtotal,
        gstAmount,
        grandTotal,
        paymentStatus: formData.paymentStatus,
        notes: formData.notes
      };
      updated = [newPurchase, ...purchases];
    }

    setPurchases(updated);
    saveData('PURCHASES', updated);
    setShowModal(false);
    setEditingPurchase(null);
  };

  const filteredPurchases = purchases.filter(p => 
    p.purchaseNo.toLowerCase().includes(searchTerm.toLowerCase()) ||
    p.supplierName.toLowerCase().includes(searchTerm.toLowerCase()) ||
    p.material.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div style={{ padding: '24px' }}>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '20px' }}>
        <div>
          <h2 style={{ fontSize: '1.4rem', fontWeight: '800' }}>ALISTON Purchase Entry Module</h2>
          <p style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>
            Record raw material purchases, fabric rolls, trims, and update inventory stock automatically
          </p>
        </div>
        <button className="btn btn-primary" onClick={handleOpenModal}>
          <Plus size={16} /> New Purchase Bill Entry
        </button>
      </div>

      {/* Filter Bar */}
      <div className="card" style={{ padding: '12px 18px', marginBottom: '20px', display: 'flex', alignItems: 'center', gap: '12px' }}>
        <Search size={16} color="var(--text-muted)" />
        <input 
          type="text" 
          placeholder="Search by Purchase #, Supplier, Material Name..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          style={{ width: '100%' }}
        />
      </div>

      {/* Purchase Entries Table */}
      <div className="erp-table-container">
        <table className="erp-table">
          <thead>
            <tr>
              <th>Purchase #</th>
              <th>Date</th>
              <th>Supplier</th>
              <th>Material / Fabric</th>
              <th>Quantity</th>
              <th>Rate</th>
              <th>GST %</th>
              <th>Grand Total</th>
              <th>Status</th>
              <th>Notes</th>
              <th style={{ textAlign: 'center' }}>Actions</th>
            </tr>
          </thead>
          <tbody>
            {filteredPurchases.length === 0 ? (
              <tr>
                <td colSpan="11" style={{ textAlign: 'center', padding: '30px', color: 'var(--text-muted)' }}>
                  No purchase entries recorded yet. Click "New Purchase Bill Entry" to record your raw material purchase.
                </td>
              </tr>
            ) : (
              filteredPurchases.map(pur => (
                <tr key={pur.id}>
                  <td className="mono" style={{ fontWeight: '700', color: 'var(--accent-gold)' }}>{pur.purchaseNo}</td>
                  <td>{pur.date}</td>
                  <td style={{ fontWeight: '600' }}>{pur.supplierName}</td>
                  <td>{pur.material}</td>
                  <td className="mono" style={{ fontWeight: '700' }}>{pur.quantity} {pur.unit}</td>
                  <td className="mono">₹{pur.rate}</td>
                  <td><span className="badge badge-blue">{pur.gstPercent}%</span></td>
                  <td className="mono" style={{ fontWeight: '800', color: '#3fb950' }}>
                    ₹{(parseFloat(pur.grandTotal) || 0).toFixed(2)}
                  </td>
                  <td><span className="badge badge-green">{pur.paymentStatus}</span></td>
                  <td style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>{pur.notes}</td>
                  <td style={{ textAlign: 'center' }}>
                    <div style={{ display: 'flex', gap: '6px', justifyContent: 'center' }}>
                      <button 
                        className="btn btn-secondary btn-sm"
                        onClick={() => handleEditPurchase(pur)}
                        title="Edit Purchase Entry"
                        style={{ backgroundColor: 'var(--accent-gold)', color: '#000000', fontWeight: '800', padding: '4px 8px' }}
                      >
                        <Edit size={14} />
                      </button>
                      <button 
                        className="btn btn-danger btn-sm"
                        onClick={() => handleDeletePurchase(pur.id)}
                        title="Delete Purchase Entry"
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

      {/* Purchase Modal */}
      {showModal && (
        <div className="modal-overlay">
          <div className="modal-content" style={{ maxWidth: '650px' }}>
            <div className="modal-header">
              <h3>Record Raw Material Purchase</h3>
              <button onClick={() => setShowModal(false)} style={{ background: 'none', color: 'var(--text-muted)' }}>✕</button>
            </div>
            <form onSubmit={handleSavePurchase}>
              <div className="modal-body" style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '14px' }}>
                <div>
                  <label style={{ fontSize: '0.775rem', color: 'var(--text-secondary)' }}>Purchase Date</label>
                  <input type="date" required style={{ width: '100%' }} value={formData.date} onChange={(e) => setFormData({ ...formData, date: e.target.value })} />
                </div>

                <div>
                  <label style={{ fontSize: '0.775rem', color: 'var(--text-secondary)' }}>Supplier Selection</label>
                  <select style={{ width: '100%' }} value={formData.supplierId || 'NEW'} onChange={(e) => {
                    const sId = e.target.value;
                    const s = suppliers.find(sup => sup.id === sId);
                    setFormData({ ...formData, supplierId: sId, supplierName: s ? s.name : '' });
                  }}>
                    <option value="NEW">+ Type New Supplier Name</option>
                    {suppliers.map(s => <option key={s.id} value={s.id}>{s.name}</option>)}
                  </select>
                </div>

                <div style={{ gridColumn: '1 / -1' }}>
                  <label style={{ fontSize: '0.775rem', color: 'var(--text-secondary)' }}>Supplier Name *</label>
                  <input type="text" required style={{ width: '100%', fontWeight: '600' }} value={formData.supplierName} onChange={(e) => setFormData({ ...formData, supplierName: e.target.value })} placeholder="e.g. Vardhman Textiles Ltd" />
                </div>

                <div style={{ gridColumn: '1 / -1' }}>
                  <label style={{ fontSize: '0.775rem', color: 'var(--text-secondary)' }}>Raw Material / Fabric Master</label>
                  <select style={{ width: '100%' }} value={formData.materialId || 'NEW'} onChange={(e) => handleMaterialChange(e.target.value)}>
                    <option value="NEW">+ Add New Material On The Fly</option>
                    {materials.map(m => <option key={m.id} value={m.id}>[{m.category}] {m.name} - ₹{m.rate}/{m.unit}</option>)}
                  </select>
                </div>

                {(formData.materialId === 'NEW' || !formData.materialId) && (
                  <div style={{ gridColumn: '1 / -1' }}>
                    <label style={{ fontSize: '0.775rem', color: 'var(--text-secondary)' }}>New Material Name *</label>
                    <input type="text" required style={{ width: '100%' }} value={formData.customMaterialName} onChange={(e) => setFormData({ ...formData, customMaterialName: e.target.value })} placeholder="e.g. Linen Pure 60 Lea Fabric - Royal Blue" />
                  </div>
                )}

                <div>
                  <label style={{ fontSize: '0.775rem', color: 'var(--text-secondary)' }}>Quantity Purchased ({formData.unit})</label>
                  <input 
                    type="number" 
                    step="0.1" 
                    required 
                    style={{ width: '100%' }} 
                    value={formData.quantity === 0 || formData.quantity === '0' ? '' : formData.quantity} 
                    placeholder="0"
                    onFocus={(e) => e.target.select()}
                    onChange={(e) => setFormData({ ...formData, quantity: e.target.value === '' ? 0 : parseFloat(e.target.value) || 0 })} 
                  />
                </div>

                <div>
                  <label style={{ fontSize: '0.775rem', color: 'var(--text-secondary)' }}>Unit Rate (₹ per {formData.unit})</label>
                  <input 
                    type="number" 
                    step="0.1" 
                    required 
                    style={{ width: '100%' }} 
                    value={formData.rate === 0 || formData.rate === '0' ? '' : formData.rate} 
                    placeholder="0"
                    onFocus={(e) => e.target.select()}
                    onChange={(e) => setFormData({ ...formData, rate: e.target.value === '' ? 0 : parseFloat(e.target.value) || 0 })} 
                  />
                </div>

                <div>
                  <label style={{ fontSize: '0.775rem', color: 'var(--text-secondary)' }}>GST Rate %</label>
                  <select style={{ width: '100%' }} value={formData.gstPercent} onChange={(e) => setFormData({ ...formData, gstPercent: parseFloat(e.target.value) })}>
                    <option value={5}>5% (Fabric)</option>
                    <option value={12}>12% (Trims/Labels)</option>
                    <option value={18}>18% (Packaging)</option>
                  </select>
                </div>

                <div>
                  <label style={{ fontSize: '0.775rem', color: 'var(--text-secondary)' }}>Payment Status</label>
                  <select style={{ width: '100%' }} value={formData.paymentStatus} onChange={(e) => setFormData({ ...formData, paymentStatus: e.target.value })}>
                    <option value="Paid">Paid</option>
                    <option value="Pending">Pending</option>
                    <option value="Partial">Partial</option>
                  </select>
                </div>

                <div style={{ gridColumn: '1 / -1', backgroundColor: 'rgba(255,255,255,0.03)', padding: '12px', borderRadius: '6px', border: '1px solid var(--border-color)', display: 'flex', justifyContent: 'space-between', fontWeight: '800' }}>
                  <span>Grand Total (Incl. GST):</span>
                  <span className="mono" style={{ color: '#3fb950', fontSize: '1.1rem' }}>₹{grandTotal.toFixed(2)}</span>
                </div>

                <div style={{ gridColumn: '1 / -1' }}>
                  <label style={{ fontSize: '0.775rem', color: 'var(--text-secondary)' }}>Notes / Bill Details</label>
                  <input type="text" style={{ width: '100%' }} value={formData.notes} onChange={(e) => setFormData({ ...formData, notes: e.target.value })} />
                </div>
              </div>

              <div className="modal-footer">
                <button type="button" className="btn btn-secondary" onClick={() => setShowModal(false)}>Cancel</button>
                <button type="submit" className="btn btn-primary">Save & Add Material Stock</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
