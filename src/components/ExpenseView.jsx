import React, { useState } from 'react';
import { DollarSign, Plus, Search, Calendar, Filter, Trash2, Edit } from 'lucide-react';
import { getData, saveData } from '../db/storage';
import { exportToExcel } from '../utils/excelExporter';

export const ExpenseView = () => {
  const [expenses, setExpenses] = useState(() => getData('EXPENSES') || []);

  // Real-time listener for DB updates
  React.useEffect(() => {
    const handleDbUpdate = () => {
      setExpenses(getData('EXPENSES') || []);
    };
    window.addEventListener('aliston-db-updated', handleDbUpdate);
    return () => window.removeEventListener('aliston-db-updated', handleDbUpdate);
  }, []);

  const [showModal, setShowModal] = useState(false);
  const [editingExpense, setEditingExpense] = useState(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterCategory, setFilterCategory] = useState('ALL');

  const categories = [
    'Rent', 'Electricity', 'Salary', 'Labour', 'Transport', 'Packaging', 
    'Washing', 'Stitching', 'Cutting', 'Ironing', 'Marketing', 'Advertisement', 'Commission', 'Other'
  ];

  const [formData, setFormData] = useState({
    category: 'Rent',
    customCategory: '',
    date: new Date().toISOString().split('T')[0],
    amount: 5000,
    description: 'Monthly office & warehouse maintenance',
    paymentMode: 'Bank Transfer'
  });

  const handleOpenModal = () => {
    setEditingExpense(null);
    setFormData({
      category: 'Rent',
      customCategory: '',
      date: new Date().toISOString().split('T')[0],
      amount: 5000,
      description: 'Monthly office & warehouse maintenance',
      paymentMode: 'Bank Transfer'
    });
    setShowModal(true);
  };

  const handleEditExpense = (exp) => {
    setEditingExpense(exp);
    setFormData({
      category: exp.category || 'Rent',
      customCategory: exp.customCategory || '',
      date: exp.date || new Date().toISOString().split('T')[0],
      amount: exp.amount || 0,
      description: exp.description || '',
      paymentMode: exp.paymentMode || 'Bank Transfer'
    });
    setShowModal(true);
  };

  const handleAddExpense = (e) => {
    e.preventDefault();
    let updated;
    if (editingExpense) {
      updated = expenses.map(exp => exp.id === editingExpense.id ? {
        ...exp,
        ...formData,
        amount: parseFloat(formData.amount) || 0
      } : exp);
    } else {
      const newExp = {
        id: 'exp-' + Date.now(),
        ...formData,
        amount: parseFloat(formData.amount) || 0
      };
      updated = [newExp, ...expenses];
    }
    setExpenses(updated);
    saveData('EXPENSES', updated);
    setShowModal(false);
    setEditingExpense(null);
  };

  const handleDeleteExpense = (id) => {
    if (confirm('Are you sure you want to delete this expense record?')) {
      const updated = expenses.filter(e => e.id !== id);
      setExpenses(updated);
      saveData('EXPENSES', updated);
    }
  };

  const handleExport = () => {
    const dataToExport = expenses.map(e => ({
      'Date': e.date,
      'Category': e.category === 'Other' && e.customCategory ? e.customCategory : e.category,
      'Description': e.description,
      'Amount (₹)': e.amount,
      'Payment Mode': e.paymentMode
    }));
    exportToExcel(dataToExport, 'ALISTON_Expenses_Report.xlsx');
  };

  const filteredExpenses = expenses.filter(e => {
    const catName = e.category === 'Other' && e.customCategory ? e.customCategory : e.category;
    const matchCat = filterCategory === 'ALL' || catName === filterCategory;
    const matchSearch = e.description.toLowerCase().includes(searchTerm.toLowerCase()) ||
                        catName.toLowerCase().includes(searchTerm.toLowerCase());
    return matchCat && matchSearch;
  });

  const totalExpenseSum = expenses.reduce((sum, e) => sum + (e.amount || 0), 0);

  return (
    <div style={{ padding: '24px' }}>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '20px' }}>
        <div>
          <h2 style={{ fontSize: '1.4rem', fontWeight: '800' }}>ALISTON Operating Expense Module</h2>
          <p style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>
            Track rent, stitching, washing, ironing, labour, transport, marketing & custom overheads
          </p>
        </div>
        <div style={{ display: 'flex', gap: '12px' }}>
          <button className="btn btn-secondary" onClick={handleExport}>
            Export Expense Excel
          </button>
          <button className="btn btn-primary" onClick={handleOpenModal}>
            <Plus size={16} /> Record Expense
          </button>
        </div>
      </div>

      {/* Total Expense Banner */}
      <div className="card" style={{ padding: '16px 20px', marginBottom: '20px', display: 'flex', alignItems: 'center', justifyContent: 'space-between', background: 'linear-gradient(135deg, #161b22 0%, #0d1117 100%)' }}>
        <div>
          <div style={{ fontSize: '0.8rem', color: 'var(--text-secondary)' }}>Total Operating Expenses Recorded</div>
          <div className="mono" style={{ fontSize: '1.6rem', fontWeight: '800', color: '#ef4444', marginTop: '4px' }}>
            ₹{totalExpensesAmount.toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
          </div>
        </div>
        <div style={{ fontSize: '0.85rem', color: 'var(--text-muted)' }}>
          Showing {filteredExpenses.length} expense entries
        </div>
      </div>

      {/* Filter Bar */}
      <div className="card" style={{ padding: '12px 18px', marginBottom: '20px', display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '12px' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px', flex: 1, minWidth: '240px' }}>
          <Search size={16} color="var(--text-muted)" />
          <input 
            type="text" 
            placeholder="Search description, category..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            style={{ width: '100%' }}
          />
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <Filter size={16} color="var(--text-muted)" />
          <select value={filterCategory} onChange={(e) => setFilterCategory(e.target.value)}>
            <option value="ALL">All Categories</option>
            {categories.map(c => <option key={c} value={c}>{c}</option>)}
          </select>
        </div>
      </div>

      {/* Expense Table */}
      <div className="erp-table-container">
        <table className="erp-table">
          <thead>
            <tr>
              <th>Date</th>
              <th>Expense Category</th>
              <th>Description / Remarks</th>
              <th>Payment Mode</th>
              <th>Amount (₹)</th>
              <th style={{ textAlign: 'center' }}>Actions</th>
            </tr>
          </thead>
          <tbody>
            {filteredExpenses.map(exp => (
              <tr key={exp.id}>
                <td>{exp.date}</td>
                <td>
                  <span className="badge badge-gold">
                    {exp.category === 'Other' && exp.customCategory ? exp.customCategory : exp.category}
                  </span>
                </td>
                <td style={{ fontWeight: '600' }}>{exp.description}</td>
                <td style={{ fontSize: '0.8rem', color: 'var(--text-secondary)' }}>{exp.paymentMode}</td>
                <td className="mono" style={{ fontWeight: '800', color: '#ef4444' }}>₹{exp.amount?.toFixed(2)}</td>
                <td style={{ textAlign: 'center' }}>
                  <div style={{ display: 'flex', gap: '6px', justifyContent: 'center' }}>
                    <button 
                      className="btn btn-secondary btn-sm"
                      onClick={() => handleEditExpense(exp)}
                      title="Edit Expense Record"
                      style={{ backgroundColor: 'var(--accent-gold)', color: '#000000', fontWeight: '800', padding: '4px 8px' }}
                    >
                      <Edit size={14} />
                    </button>
                    <button 
                      className="btn btn-danger btn-sm"
                      onClick={() => handleDeleteExpense(exp.id)}
                      title="Delete Expense Record"
                      style={{ backgroundColor: '#dc2626', color: '#ffffff', padding: '4px 8px' }}
                    >
                      <Trash2 size={14} />
                    </button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Record Expense Modal */}
      {showModal && (
        <div className="modal-overlay">
          <div className="modal-content" style={{ maxWidth: '480px' }}>
            <div className="modal-header">
              <h3>Record New Operating Expense</h3>
              <button onClick={() => setShowModal(false)} style={{ background: 'none', color: 'var(--text-muted)' }}>✕</button>
            </div>
            <form onSubmit={handleAddExpense}>
              <div className="modal-body" style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
                <div>
                  <label style={{ fontSize: '0.775rem', color: 'var(--text-secondary)' }}>Category</label>
                  <select style={{ width: '100%' }} value={formData.category} onChange={(e) => setFormData({ ...formData, category: e.target.value })}>
                    {categories.map(c => <option key={c} value={c}>{c}</option>)}
                  </select>
                </div>

                {formData.category === 'Other' && (
                  <div>
                    <label style={{ fontSize: '0.775rem', color: 'var(--text-secondary)' }}>Custom Category Name</label>
                    <input type="text" required style={{ width: '100%' }} value={formData.customCategory} onChange={(e) => setFormData({ ...formData, customCategory: e.target.value })} placeholder="e.g. Machine Maintenance" />
                  </div>
                )}

                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
                  <div>
                    <label style={{ fontSize: '0.775rem', color: 'var(--text-secondary)' }}>Expense Date</label>
                    <input type="date" required style={{ width: '100%' }} value={formData.date} onChange={(e) => setFormData({ ...formData, date: e.target.value })} />
                  </div>
                  <div>
                    <label style={{ fontSize: '0.775rem', color: 'var(--text-secondary)' }}>Amount (₹)</label>
                    <input type="number" step="0.1" required style={{ width: '100%', fontWeight: '700' }} value={formData.amount} onChange={(e) => setFormData({ ...formData, amount: parseFloat(e.target.value) || 0 })} />
                  </div>
                </div>

                <div>
                  <label style={{ fontSize: '0.775rem', color: 'var(--text-secondary)' }}>Payment Mode</label>
                  <select style={{ width: '100%' }} value={formData.paymentMode} onChange={(e) => setFormData({ ...formData, paymentMode: e.target.value })}>
                    <option value="Bank Transfer">Bank Transfer</option>
                    <option value="UPI">UPI / PhonePe</option>
                    <option value="Cash">Cash</option>
                    <option value="Cheque">Cheque</option>
                  </select>
                </div>

                <div>
                  <label style={{ fontSize: '0.775rem', color: 'var(--text-secondary)' }}>Description</label>
                  <input type="text" style={{ width: '100%' }} value={formData.description} onChange={(e) => setFormData({ ...formData, description: e.target.value })} />
                </div>
              </div>
              <div className="modal-footer">
                <button type="button" className="btn btn-secondary" onClick={() => setShowModal(false)}>Cancel</button>
                <button type="submit" className="btn btn-primary">Save Expense</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
