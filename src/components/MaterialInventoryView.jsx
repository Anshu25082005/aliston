import React, { useState } from 'react';
import { Scissors, Search, Plus, Filter, AlertTriangle } from 'lucide-react';
import { getData, saveData } from '../db/storage';
import { exportToExcel } from '../utils/excelExporter';

export const MaterialInventoryView = () => {
  const [materials, setMaterials] = useState(() => getData('MATERIALS') || []);
  const [purchases, setPurchases] = useState(() => getData('PURCHASES') || []);
  const [productions, setProductions] = useState(() => getData('PRODUCTIONS') || []);
  const [boms, setBoms] = useState(() => getData('BOMS') || {});

  // Subscribe to real-time database updates
  React.useEffect(() => {
    const handleDbUpdate = () => {
      setMaterials(getData('MATERIALS') || []);
      setPurchases(getData('PURCHASES') || []);
      setProductions(getData('PRODUCTIONS') || []);
      setBoms(getData('BOMS') || {});
    };
    window.addEventListener('aliston-db-updated', handleDbUpdate);
    return () => window.removeEventListener('aliston-db-updated', handleDbUpdate);
  }, []);

  const [searchTerm, setSearchTerm] = useState('');
  const [filterCategory, setFilterCategory] = useState('ALL');
  const [showAddModal, setShowAddModal] = useState(false);

  const [newMaterial, setNewMaterial] = useState({
    name: '',
    category: 'Fabric',
    rate: 300,
    unit: 'metre',
    currentStock: 500,
    minStock: 100
  });

  const categories = ['Fabric', 'Button', 'Collar', 'Cuff', 'Label', 'Thread', 'Packing Material', 'Other'];

  const handleAddMaterial = (e) => {
    e.preventDefault();
    const newEntry = {
      id: 'mat-' + Date.now(),
      ...newMaterial
    };
    const updated = [...materials, newEntry];
    setMaterials(updated);
    saveData('MATERIALS', updated);
    setShowAddModal(false);
  };

  const handleExport = () => {
    const exportData = materials.map(m => ({
      'Material Name': m.name,
      'Category': m.category,
      'Unit': m.unit,
      'Average Rate (₹)': m.rate,
      'Current Stock': m.currentStock,
      'Min Reorder Stock': m.minStock,
      'Total Stock Value (₹)': (m.currentStock * m.rate).toFixed(2)
    }));
    exportToExcel(exportData, 'ALISTON_Raw_Material_Inventory.xlsx');
  };

  const filteredMaterials = materials.filter(m => {
    const matchCat = filterCategory === 'ALL' || m.category === filterCategory;
    const matchSearch = m.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                        m.category.toLowerCase().includes(searchTerm.toLowerCase());
    return matchCat && matchSearch;
  });

  let totalRawMatValuation = 0;
  materials.forEach(m => totalRawMatValuation += (m.currentStock || 0) * (m.rate || 0));

  return (
    <div style={{ padding: '24px' }}>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '20px' }}>
        <div>
          <h2 style={{ fontSize: '1.4rem', fontWeight: '800' }}>ALISTON Raw Material Inventory</h2>
          <p style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>
            Track fabric rolls, gross buttons, collar/cuff interlining, 7 label sets, threads & packing stock
          </p>
        </div>
        <div style={{ display: 'flex', gap: '12px' }}>
          <button className="btn btn-secondary" onClick={handleExport}>
            Export Inventory Excel
          </button>
          <button className="btn btn-primary" onClick={() => setShowAddModal(true)}>
            <Plus size={16} /> Add Raw Material Master
          </button>
        </div>
      </div>

      {/* Summary KPI Card */}
      <div className="card" style={{ padding: '16px 20px', marginBottom: '20px', display: 'flex', alignItems: 'center', justifyContent: 'space-between', background: 'linear-gradient(135deg, #161b22 0%, #0d1117 100%)' }}>
        <div>
          <div style={{ fontSize: '0.8rem', color: 'var(--text-secondary)' }}>Total Raw Material Inventory Value</div>
          <div className="mono" style={{ fontSize: '1.6rem', fontWeight: '800', color: 'var(--accent-gold)' }}>
            ₹{totalRawMatValuation.toLocaleString('en-IN', { maximumFractionDigits: 0 })}
          </div>
        </div>
        <div style={{ display: 'flex', gap: '20px', fontSize: '0.825rem' }}>
          <div>Total Materials: <strong>{materials.length} Items</strong></div>
          <div>Low Stock Warnings: <strong style={{ color: '#f85149' }}>{materials.filter(m => m.currentStock < m.minStock).length} Items</strong></div>
        </div>
      </div>

      {/* Filter Bar */}
      <div className="card" style={{ padding: '12px 18px', marginBottom: '20px', display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '12px' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px', flex: 1 }}>
          <Search size={16} color="var(--text-muted)" />
          <input 
            type="text" 
            placeholder="Search material by name, type, category..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            style={{ width: '100%' }}
          />
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
          <Filter size={16} color="var(--text-muted)" />
          <select value={filterCategory} onChange={(e) => setFilterCategory(e.target.value)}>
            <option value="ALL">All Material Categories</option>
            {categories.map(c => <option key={c} value={c}>{c}</option>)}
          </select>
        </div>
      </div>

      {/* Inventory Table */}
      <div className="erp-table-container">
        <table className="erp-table">
          <thead>
            <tr>
              <th>Material Name</th>
              <th>Category</th>
              <th>Unit</th>
              <th>Avg Rate (₹)</th>
              <th>Current Remaining Stock</th>
              <th>Min Reorder Stock</th>
              <th>Stock Value (₹)</th>
              <th>Status</th>
            </tr>
          </thead>
          <tbody>
            {filteredMaterials.map(m => {
              const val = (m.currentStock || 0) * (m.rate || 0);
              const isLow = m.currentStock < m.minStock;
              return (
                <tr key={m.id}>
                  <td style={{ fontWeight: '700', fontSize: '0.85rem' }}>{m.name}</td>
                  <td><span className="badge badge-gold">{m.category}</span></td>
                  <td><span className="badge badge-blue">{m.unit}</span></td>
                  <td className="mono">₹{m.rate}</td>
                  <td className="mono" style={{ fontWeight: '800', color: isLow ? '#f85149' : 'var(--text-primary)' }}>
                    {m.currentStock} {m.unit}
                  </td>
                  <td className="mono" style={{ color: 'var(--text-muted)' }}>{m.minStock} {m.unit}</td>
                  <td className="mono" style={{ fontWeight: '800', color: '#3fb950' }}>₹{val.toFixed(2)}</td>
                  <td>
                    {isLow ? (
                      <span className="badge badge-red" style={{ display: 'inline-flex', alignItems: 'center', gap: '4px' }}>
                        <AlertTriangle size={12} /> REORDER
                      </span>
                    ) : (
                      <span className="badge badge-green">IN STOCK</span>
                    )}
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      {/* Add Material Modal */}
      {showAddModal && (
        <div className="modal-overlay">
          <div className="modal-content" style={{ maxWidth: '500px' }}>
            <div className="modal-header">
              <h3>Create Raw Material Master</h3>
              <button onClick={() => setShowAddModal(false)} style={{ background: 'none', color: 'var(--text-muted)' }}>✕</button>
            </div>
            <form onSubmit={handleAddMaterial}>
              <div className="modal-body" style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
                <div>
                  <label style={{ fontSize: '0.775rem', color: 'var(--text-secondary)' }}>Material Name *</label>
                  <input type="text" required style={{ width: '100%' }} value={newMaterial.name} onChange={(e) => setNewMaterial({ ...newMaterial, name: e.target.value })} placeholder="e.g. Linen Pure 60 Lea Fabric - Navy" />
                </div>
                <div>
                  <label style={{ fontSize: '0.775rem', color: 'var(--text-secondary)' }}>Category</label>
                  <select style={{ width: '100%' }} value={newMaterial.category} onChange={(e) => setNewMaterial({ ...newMaterial, category: e.target.value })}>
                    {categories.map(c => <option key={c} value={c}>{c}</option>)}
                  </select>
                </div>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
                  <div>
                    <label style={{ fontSize: '0.775rem', color: 'var(--text-secondary)' }}>Unit Rate (₹)</label>
                    <input type="number" step="0.1" required style={{ width: '100%' }} value={newMaterial.rate} onChange={(e) => setNewMaterial({ ...newMaterial, rate: parseFloat(e.target.value) || 0 })} />
                  </div>
                  <div>
                    <label style={{ fontSize: '0.775rem', color: 'var(--text-secondary)' }}>Unit Type</label>
                    <input type="text" style={{ width: '100%' }} value={newMaterial.unit} onChange={(e) => setNewMaterial({ ...newMaterial, unit: e.target.value })} placeholder="metre / Gross / piece" />
                  </div>
                </div>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
                  <div>
                    <label style={{ fontSize: '0.775rem', color: 'var(--text-secondary)' }}>Opening Stock</label>
                    <input type="number" required style={{ width: '100%' }} value={newMaterial.currentStock} onChange={(e) => setNewMaterial({ ...newMaterial, currentStock: parseFloat(e.target.value) || 0 })} />
                  </div>
                  <div>
                    <label style={{ fontSize: '0.775rem', color: 'var(--text-secondary)' }}>Min Reorder Level</label>
                    <input type="number" required style={{ width: '100%' }} value={newMaterial.minStock} onChange={(e) => setNewMaterial({ ...newMaterial, minStock: parseFloat(e.target.value) || 0 })} />
                  </div>
                </div>
              </div>
              <div className="modal-footer">
                <button type="button" className="btn btn-secondary" onClick={() => setShowAddModal(false)}>Cancel</button>
                <button type="submit" className="btn btn-primary">Save Raw Material</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
