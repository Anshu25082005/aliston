import React, { useState } from 'react';
import { 
  Shirt, 
  Plus, 
  Search, 
  Filter, 
  Edit, 
  Trash2, 
  Barcode as BarcodeIcon, 
  Image as ImageIcon,
  Check,
  Tag
} from 'lucide-react';
import { getData, saveData } from '../db/storage';
import { generateBarcodeSvg } from '../utils/barcodeHelper';

export const ProductMasterView = ({ searchQuery = '' }) => {
  const [products, setProducts] = useState(() => getData('PRODUCTS') || []);
  const [categories, setCategories] = useState(() => getData('CATEGORIES') || []);
  const [suppliers, setSuppliers] = useState(() => getData('SUPPLIERS') || []);

  // Real-time listener for DB updates
  React.useEffect(() => {
    const handleDbUpdate = () => {
      setProducts(getData('PRODUCTS') || []);
      setCategories(getData('CATEGORIES') || []);
      setSuppliers(getData('SUPPLIERS') || []);
    };
    window.addEventListener('aliston-db-updated', handleDbUpdate);
    return () => window.removeEventListener('aliston-db-updated', handleDbUpdate);
  }, []);
  
  const [filterCategory, setFilterCategory] = useState('ALL');
  const [searchTerm, setSearchTerm] = useState(searchQuery);

  // Modal State
  const [showModal, setShowModal] = useState(false);
  const [editingProduct, setEditingProduct] = useState(null);

  // New Category Modal State
  const [showAddCatModal, setShowAddCatModal] = useState(false);
  const [newCatName, setNewCatName] = useState('');

  // Form State
  const [formData, setFormData] = useState({
    name: '',
    code: '',
    sku: '',
    barcode: '',
    category: 'Linen Shirt',
    subCategory: 'Formal Linen',
    fabric: 'Linen Pure 60 Lea',
    fabricColor: 'Royal Blue',
    design: 'Solid Slim Fit',
    pattern: 'Plain Cutaway',
    season: 'Summer 2026',
    supplierId: suppliers[0]?.id || '',
    purchaseDate: new Date().toISOString().split('T')[0],
    costPrice: 750,
    marginPercent: 35,
    sellingPrice: 1012.50,
    hsnCode: '620520',
    gstPercent: 12,
    image: 'https://images.unsplash.com/photo-1596755094514-f87e34085b2c?w=400&auto=format&fit=crop&q=60',
    remarks: ''
  });

  const handleOpenAddModal = () => {
    setEditingProduct(null);
    const nextSeq = products.length + 101;
    const code = `AL-SH-${nextSeq}`;
    const sku = `AL-LIN-ITEM-${nextSeq}`;
    const barcode = `8901234567${nextSeq}`;
    
    setFormData({
      name: '',
      code,
      sku,
      barcode,
      category: categories[0]?.name || 'Linen Shirt',
      subCategory: 'Formal Linen',
      fabric: 'Linen Pure 60 Lea',
      fabricColor: 'Royal Blue',
      design: 'Solid Slim Fit',
      pattern: 'Plain Cutaway',
      season: 'Summer 2026',
      supplierId: suppliers[0]?.id || '',
      purchaseDate: new Date().toISOString().split('T')[0],
      costPrice: 750,
      marginPercent: 35,
      sellingPrice: 1012.50,
      hsnCode: '620520',
      gstPercent: 12,
      image: 'https://images.unsplash.com/photo-1596755094514-f87e34085b2c?w=400&auto=format&fit=crop&q=60',
      remarks: ''
    });
    setShowModal(true);
  };

  const handleOpenEditModal = (prod) => {
    setEditingProduct(prod);
    setFormData({ ...prod });
    setShowModal(true);
  };

  // Costing & Selling Price Calculations
  const handleCostOrMarginChange = (cost, margin) => {
    const c = parseFloat(cost) || 0;
    const m = parseFloat(margin) || 0;
    const sp = c + (c * (m / 100));
    setFormData(prev => ({
      ...prev,
      costPrice: c,
      marginPercent: m,
      sellingPrice: parseFloat(sp.toFixed(2))
    }));
  };

  const handleSellingPriceChange = (sp) => {
    const s = parseFloat(sp) || 0;
    const c = formData.costPrice || 1;
    const m = ((s - c) / c) * 100;
    setFormData(prev => ({
      ...prev,
      sellingPrice: s,
      marginPercent: parseFloat(m.toFixed(2))
    }));
  };

  const handleSaveProduct = (e) => {
    e.preventDefault();
    let updated;
    const finalPrice = formData.sellingPrice + (formData.sellingPrice * (formData.gstPercent / 100));
    const payload = {
      ...formData,
      finalSellingPrice: parseFloat(finalPrice.toFixed(2))
    };

    if (editingProduct) {
      updated = products.map(p => p.id === editingProduct.id ? { ...p, ...payload } : p);
    } else {
      const newProd = {
        id: 'prod-' + Date.now(),
        ...payload
      };
      updated = [newProd, ...products];
    }

    setProducts(updated);
    saveData('PRODUCTS', updated);
    setShowModal(false);
  };

  const handleDeleteProduct = (id) => {
    if (confirm('Are you sure you want to deactivate/delete this product master entry?')) {
      const updated = products.filter(p => p.id !== id);
      setProducts(updated);
      saveData('PRODUCTS', updated);
    }
  };

  const handleAddCategory = (e) => {
    e.preventDefault();
    if (!newCatName.trim()) return;
    const newCat = { id: 'cat-' + Date.now(), name: newCatName.trim(), code: newCatName.substring(0, 3).toUpperCase() };
    const updatedCats = [...categories, newCat];
    setCategories(updatedCats);
    saveData('CATEGORIES', updatedCats);
    setNewCatName('');
    setShowAddCatModal(false);
  };

  // Filter & Search Logic
  const filteredProducts = products.filter(p => {
    const matchCat = filterCategory === 'ALL' || p.category === filterCategory;
    const matchSearch = !searchTerm || 
      p.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      p.code.toLowerCase().includes(searchTerm.toLowerCase()) ||
      p.sku.toLowerCase().includes(searchTerm.toLowerCase()) ||
      p.barcode.includes(searchTerm) ||
      p.fabric.toLowerCase().includes(searchTerm.toLowerCase());
    return matchCat && matchSearch;
  });

  return (
    <div style={{ padding: '24px' }}>
      {/* Top Header Controls */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '20px' }}>
        <div>
          <h2 style={{ fontSize: '1.4rem', fontWeight: '800' }}>ALISTON Product Master</h2>
          <p style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>
            Manage garment styles, codes, SKUs, fabrics, costs & pricing
          </p>
        </div>
        <div style={{ display: 'flex', gap: '12px' }}>
          <button className="btn btn-secondary" onClick={() => setShowAddCatModal(true)}>
            <Tag size={16} /> + New Category
          </button>
          <button className="btn btn-primary" onClick={handleOpenAddModal}>
            <Plus size={16} /> Add Product Master
          </button>
        </div>
      </div>

      {/* Filter Bar */}
      <div className="card" style={{ padding: '14px 20px', marginBottom: '20px', display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '12px' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px', flex: 1, minWidth: '280px' }}>
          <Search size={16} color="var(--text-muted)" />
          <input 
            type="text" 
            placeholder="Search by Product Name, Code, SKU, Barcode, Fabric..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            style={{ width: '100%' }}
          />
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
          <Filter size={16} color="var(--text-muted)" />
          <select value={filterCategory} onChange={(e) => setFilterCategory(e.target.value)}>
            <option value="ALL">All Categories</option>
            {categories.map(c => <option key={c.id} value={c.name}>{c.name}</option>)}
          </select>
        </div>
      </div>

      {/* Product Master Table */}
      <div className="erp-table-container">
        <table className="erp-table">
          <thead>
            <tr>
              <th>Image</th>
              <th style={{ textAlign: 'center' }}>Actions</th>
              <th>Code / SKU</th>
              <th>Product Name</th>
              <th>Category</th>
              <th>Fabric & Color</th>
              <th>Cost Price</th>
              <th>Margin %</th>
              <th>Selling Price</th>
              <th>Barcode</th>
              <th style={{ textAlign: 'center' }}>Actions</th>
            </tr>
          </thead>
          <tbody>
            {filteredProducts.length === 0 ? (
              <tr>
                <td colSpan="11" style={{ textAlign: 'center', padding: '30px', color: 'var(--text-muted)' }}>
                  No products found matching filters. Click "+ Add Product Master" to create one.
                </td>
              </tr>
            ) : (
              filteredProducts.map(prod => (
                <tr key={prod.id}>
                  <td>
                    <img 
                      src={prod.image || 'https://via.placeholder.com/40'} 
                      alt={prod.name} 
                      style={{ width: '40px', height: '40px', objectFit: 'cover', borderRadius: '6px', border: '1px solid var(--border-color)' }} 
                    />
                  </td>
                  <td style={{ textAlign: 'center' }}>
                    <div style={{ display: 'flex', gap: '6px', justifyContent: 'center' }}>
                      <button className="btn btn-secondary btn-sm" onClick={() => handleOpenEditModal(prod)} title="Edit Product">
                        <Edit size={14} />
                      </button>
                      <button className="btn btn-danger btn-sm" onClick={() => handleDeleteProduct(prod.id)} title="Delete Product" style={{ backgroundColor: '#dc2626', color: '#ffffff' }}>
                        <Trash2 size={14} />
                      </button>
                    </div>
                  </td>
                  <td>
                    <div style={{ fontWeight: '700', fontSize: '0.85rem' }}>{prod.code}</div>
                    <div style={{ fontSize: '0.725rem', color: 'var(--text-muted)' }}>{prod.sku}</div>
                  </td>
                  <td style={{ fontWeight: '600', maxWidth: '200px', whiteSpace: 'normal' }}>
                    {prod.name}
                    <div style={{ fontSize: '0.725rem', color: 'var(--accent-gold)' }}>HSN: {prod.hsnCode} | GST: {prod.gstPercent}%</div>
                  </td>
                  <td><span className="badge badge-gold">{prod.category}</span></td>
                  <td>
                    <div style={{ fontWeight: '600' }}>{prod.fabric}</div>
                    <div style={{ fontSize: '0.725rem', color: 'var(--text-secondary)' }}>Color: {prod.fabricColor}</div>
                  </td>
                  <td className="mono" style={{ fontWeight: '600' }}>₹{prod.costPrice?.toFixed(2)}</td>
                  <td><span className="badge badge-blue">{prod.marginPercent}%</span></td>
                  <td className="mono" style={{ fontWeight: '700', color: '#3fb950' }}>₹{prod.sellingPrice?.toFixed(2)}</td>
                  <td className="mono" style={{ fontSize: '0.775rem' }}>{prod.barcode}</td>
                  <td style={{ textAlign: 'center' }}>
                    <div style={{ display: 'flex', gap: '6px', justifyContent: 'center' }}>
                      <button className="btn btn-secondary btn-sm" onClick={() => handleOpenEditModal(prod)} title="Edit Product">
                        <Edit size={14} />
                      </button>
                      <button className="btn btn-danger btn-sm" onClick={() => handleDeleteProduct(prod.id)} title="Delete Product" style={{ backgroundColor: '#dc2626', color: '#ffffff' }}>
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

      {/* Add / Edit Product Modal */}
      {showModal && (
        <div className="modal-overlay">
          <div className="modal-content" style={{ maxWidth: '840px' }}>
            <div className="modal-header">
              <h3>{editingProduct ? 'Edit Product Master' : 'Add New ALISTON Product'}</h3>
              <button onClick={() => setShowModal(false)} style={{ background: 'none', color: 'var(--text-muted)' }}>✕</button>
            </div>
            <form onSubmit={handleSaveProduct}>
              <div className="modal-body" style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
                <div>
                  <label style={{ fontSize: '0.775rem', color: 'var(--text-secondary)' }}>Product Name *</label>
                  <input 
                    type="text" 
                    required 
                    style={{ width: '100%' }}
                    value={formData.name} 
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })} 
                    placeholder="e.g. ALISTON Royal Linen Shirt - Navy Blue"
                  />
                </div>

                <div>
                  <label style={{ fontSize: '0.775rem', color: 'var(--text-secondary)' }}>Category *</label>
                  <select 
                    style={{ width: '100%' }}
                    value={formData.category} 
                    onChange={(e) => setFormData({ ...formData, category: e.target.value })}
                  >
                    {categories.map(c => <option key={c.id} value={c.name}>{c.name}</option>)}
                  </select>
                </div>

                <div>
                  <label style={{ fontSize: '0.775rem', color: 'var(--text-secondary)' }}>Product Code</label>
                  <input 
                    type="text" 
                    required 
                    style={{ width: '100%' }}
                    value={formData.code} 
                    onChange={(e) => setFormData({ ...formData, code: e.target.value })} 
                  />
                </div>

                <div>
                  <label style={{ fontSize: '0.775rem', color: 'var(--text-secondary)' }}>SKU</label>
                  <input 
                    type="text" 
                    required 
                    style={{ width: '100%' }}
                    value={formData.sku} 
                    onChange={(e) => setFormData({ ...formData, sku: e.target.value })} 
                  />
                </div>

                <div>
                  <label style={{ fontSize: '0.775rem', color: 'var(--text-secondary)' }}>Fabric / Material</label>
                  <input 
                    type="text" 
                    style={{ width: '100%' }}
                    value={formData.fabric} 
                    onChange={(e) => setFormData({ ...formData, fabric: e.target.value })} 
                  />
                </div>

                <div>
                  <label style={{ fontSize: '0.775rem', color: 'var(--text-secondary)' }}>Fabric Colour</label>
                  <input 
                    type="text" 
                    style={{ width: '100%' }}
                    value={formData.fabricColor} 
                    onChange={(e) => setFormData({ ...formData, fabricColor: e.target.value })} 
                  />
                </div>

                <div>
                  <label style={{ fontSize: '0.775rem', color: 'var(--text-secondary)' }}>Design & Pattern</label>
                  <input 
                    type="text" 
                    style={{ width: '100%' }}
                    value={formData.design} 
                    onChange={(e) => setFormData({ ...formData, design: e.target.value })} 
                  />
                </div>

                <div>
                  <label style={{ fontSize: '0.775rem', color: 'var(--text-secondary)' }}>Season</label>
                  <input 
                    type="text" 
                    style={{ width: '100%' }}
                    value={formData.season} 
                    onChange={(e) => setFormData({ ...formData, season: e.target.value })} 
                  />
                </div>

                <div>
                  <label style={{ fontSize: '0.775rem', color: 'var(--text-secondary)' }}>Cost Price (₹)</label>
                  <input 
                    type="number" 
                    step="0.01" 
                    required 
                    style={{ width: '100%' }}
                    value={formData.costPrice} 
                    onChange={(e) => handleCostOrMarginChange(e.target.value, formData.marginPercent)} 
                  />
                </div>

                <div>
                  <label style={{ fontSize: '0.775rem', color: 'var(--text-secondary)' }}>Margin %</label>
                  <input 
                    type="number" 
                    step="0.1" 
                    required 
                    style={{ width: '100%' }}
                    value={formData.marginPercent} 
                    onChange={(e) => handleCostOrMarginChange(formData.costPrice, e.target.value)} 
                  />
                </div>

                <div>
                  <label style={{ fontSize: '0.775rem', color: 'var(--text-secondary)' }}>Selling Price Excl. GST (₹)</label>
                  <input 
                    type="number" 
                    step="0.01" 
                    required 
                    style={{ width: '100%' }}
                    value={formData.sellingPrice} 
                    onChange={(e) => handleSellingPriceChange(e.target.value)} 
                  />
                </div>

                <div>
                  <label style={{ fontSize: '0.775rem', color: 'var(--text-secondary)' }}>HSN Code & GST %</label>
                  <div style={{ display: 'flex', gap: '8px' }}>
                    <input 
                      type="text" 
                      style={{ flex: 1 }}
                      value={formData.hsnCode} 
                      onChange={(e) => setFormData({ ...formData, hsnCode: e.target.value })} 
                      placeholder="HSN"
                    />
                    <select 
                      style={{ width: '90px' }}
                      value={formData.gstPercent}
                      onChange={(e) => setFormData({ ...formData, gstPercent: parseFloat(e.target.value) })}
                    >
                      <option value={5}>5%</option>
                      <option value={12}>12%</option>
                      <option value={18}>18%</option>
                    </select>
                  </div>
                </div>

                <div>
                  <label style={{ fontSize: '0.775rem', color: 'var(--text-secondary)' }}>Barcode</label>
                  <input 
                    type="text" 
                    style={{ width: '100%' }}
                    value={formData.barcode} 
                    onChange={(e) => setFormData({ ...formData, barcode: e.target.value })} 
                  />
                </div>

                <div>
                  <label style={{ fontSize: '0.775rem', color: 'var(--text-secondary)' }}>Product Image URL</label>
                  <input 
                    type="text" 
                    style={{ width: '100%' }}
                    value={formData.image} 
                    onChange={(e) => setFormData({ ...formData, image: e.target.value })} 
                  />
                </div>

                <div style={{ gridColumn: '1 / -1' }}>
                  <label style={{ fontSize: '0.775rem', color: 'var(--text-secondary)' }}>Remarks / Specifications</label>
                  <textarea 
                    rows={2} 
                    style={{ width: '100%' }}
                    value={formData.remarks} 
                    onChange={(e) => setFormData({ ...formData, remarks: e.target.value })} 
                  />
                </div>
              </div>

              <div className="modal-footer" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <div>
                  {editingProduct && (
                    <button 
                      type="button" 
                      className="btn btn-danger" 
                      onClick={() => {
                        handleDeleteProduct(editingProduct.id);
                        setShowModal(false);
                      }}
                      style={{ backgroundColor: '#dc2626', color: '#ffffff' }}
                    >
                      <Trash2 size={14} /> Delete Product
                    </button>
                  )}
                </div>
                <div style={{ display: 'flex', gap: '8px' }}>
                  <button type="button" className="btn btn-secondary" onClick={() => setShowModal(false)}>Cancel</button>
                  <button type="submit" className="btn btn-primary">Save Product Master</button>
                </div>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Add New Category Modal */}
      {showAddCatModal && (
        <div className="modal-overlay">
          <div className="modal-content" style={{ maxWidth: '400px' }}>
            <div className="modal-header">
              <h3>Add Product Category</h3>
              <button onClick={() => setShowAddCatModal(false)} style={{ background: 'none', color: 'var(--text-muted)' }}>✕</button>
            </div>
            <form onSubmit={handleAddCategory}>
              <div className="modal-body">
                <label style={{ fontSize: '0.775rem', color: 'var(--text-secondary)' }}>Category Name</label>
                <input 
                  type="text" 
                  required 
                  style={{ width: '100%', marginTop: '4px' }}
                  value={newCatName}
                  onChange={(e) => setNewCatName(e.target.value)}
                  placeholder="e.g. Linen Club Shirt"
                />
              </div>
              <div className="modal-footer">
                <button type="button" className="btn btn-secondary" onClick={() => setShowAddCatModal(false)}>Cancel</button>
                <button type="submit" className="btn btn-primary">Save Category</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
