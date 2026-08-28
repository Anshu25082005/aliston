import React, { useState, useEffect } from 'react';
import { FileText, Plus, Trash2, Edit, Printer, Eye, Search, CheckCircle2, AlertTriangle, UserPlus } from 'lucide-react';
import { getData, saveSalesInvoice, saveData } from '../db/storage';
import { InvoicePdfModal } from './InvoicePdfModal';
import { numberToWords } from '../utils/numberToWords';

export const SalesInvoiceView = () => {
  const [invoices, setInvoices] = useState(() => getData('INVOICES') || []);
  const [customers, setCustomers] = useState(() => getData('CUSTOMERS') || []);
  const [products, setProducts] = useState(() => getData('PRODUCTS') || []);
  const [stockList, setStockList] = useState(() => getData('STOCK') || []);
  const [settings, setSettings] = useState(() => getData('SETTINGS') || {});
  const [companyDetails, setCompanyDetails] = useState(() => getData('COMPANY') || {});

  const [showCreateModal, setShowCreateModal] = useState(false);
  const [selectedInvoiceForPdf, setSelectedInvoiceForPdf] = useState(null);
  const [searchTerm, setSearchTerm] = useState('');

  // Subscribe to DB updates
  useEffect(() => {
    const handleDbUpdate = () => {
      setInvoices(getData('INVOICES') || []);
      setCustomers(getData('CUSTOMERS') || []);
      setProducts(getData('PRODUCTS') || []);
      setStockList(getData('STOCK') || []);
      setSettings(getData('SETTINGS') || {});
      setCompanyDetails(getData('COMPANY') || {});
    };
    window.addEventListener('aliston-db-updated', handleDbUpdate);
    return () => window.removeEventListener('aliston-db-updated', handleDbUpdate);
  }, []);

  const nextSeq = (settings.invoiceSeq || 1001);
  const autoInvoiceNo = `${companyDetails.invoicePrefix || 'AL/2026-27/'}${String(nextSeq).padStart(4, '0')}`;

  const [invoiceForm, setInvoiceForm] = useState({
    invoiceNo: autoInvoiceNo,
    date: new Date().toISOString().split('T')[0],
    customerId: '',
    customerName: '',
    companyName: '',
    customerAddress: 'Surat, Gujarat',
    customerGST: 'UNREGISTERED',
    mobile: '',
    paymentMode: 'Bank Transfer (NEFT/RTGS)',
    notes: 'Thank you for your business with ALISTON.'
  });

  const [lineItems, setLineItems] = useState([
    {
      productId: '',
      color: '',
      size: 'M',
      qty: 1,
      rate: 0,
      discountPercent: 0,
      gstPercent: 12
    }
  ]);

  const [formFeedback, setFormFeedback] = useState({ type: '', text: '' });
  const [editingInvoice, setEditingInvoice] = useState(null);

  // Dual Discount System (1 Fixed 40% + 2nd Additional Option 0/5/10/15/20%)
  const [fixedDiscountPercent, setFixedDiscountPercent] = useState(40);
  const [additionalDiscountPercent, setAdditionalDiscountPercent] = useState(10);

  const handleOpenCreateModal = () => {
    setEditingInvoice(null);
    setFixedDiscountPercent(40);
    setAdditionalDiscountPercent(10);

    const freshNextSeq = (settings.invoiceSeq || 1001);
    const freshInvoiceNo = `${companyDetails.invoicePrefix || 'AL/2026-27/'}${String(freshNextSeq).padStart(4, '0')}`;
    const firstCust = customers[0];
    const firstProd = products[0];

    setInvoiceForm({
      invoiceNo: freshInvoiceNo,
      date: new Date().toISOString().split('T')[0],
      customerId: firstCust?.id || '',
      customerName: firstCust?.name || '',
      companyName: firstCust?.company || '',
      customerAddress: firstCust?.address || 'Surat, Gujarat',
      customerGST: firstCust?.gstin || 'UNREGISTERED',
      mobile: firstCust?.phone || '',
      paymentMode: 'Bank Transfer (NEFT/RTGS)',
      notes: 'Thank you for your business with ALISTON.'
    });

    setLineItems([
      {
        productId: firstProd?.id || '',
        color: firstProd?.fabricColor || 'Royal Blue',
        size: 'M',
        qty: 1,
        rate: firstProd?.sellingPrice || 1000,
        discountPercent: 0,
        gstPercent: firstProd?.gstPercent || 12
      }
    ]);
    setShowCreateModal(true);
  };

  const handleEditInvoice = (inv) => {
    setEditingInvoice(inv);
    setFixedDiscountPercent(inv.fixedDiscountPercent !== undefined ? inv.fixedDiscountPercent : 40);
    setAdditionalDiscountPercent(inv.additionalDiscountPercent !== undefined ? inv.additionalDiscountPercent : 0);

    setInvoiceForm({
      invoiceNo: inv.invoiceNo,
      date: inv.date || new Date().toISOString().split('T')[0],
      customerId: inv.customerId || '',
      customerName: inv.customerName || '',
      companyName: inv.companyName || '',
      customerAddress: inv.customerAddress || '',
      customerGST: inv.customerGST || '',
      mobile: inv.mobile || '',
      paymentMode: inv.paymentMode || 'Bank Transfer (NEFT/RTGS)',
      notes: inv.notes || 'Thank you for your business with ALISTON.'
    });
    if (inv.items && inv.items.length > 0) {
      setLineItems(inv.items);
    }
    setShowCreateModal(true);
  };

  const handleDeleteInvoice = (invoiceId) => {
    if (confirm('Are you sure you want to permanently delete this sales invoice?')) {
      markIdDeleted('INVOICES', invoiceId);
      const updated = invoices.filter(i => i.id !== invoiceId);
      setInvoices(updated);
      saveData('INVOICES', updated);
    }
  };

  const handleCustomerChange = (custID) => {
    if (custID === 'NEW') {
      setInvoiceForm(prev => ({
        ...prev,
        customerId: '',
        customerName: '',
        companyName: '',
        customerAddress: '',
        customerGST: '',
        mobile: ''
      }));
      return;
    }
    const cust = customers.find(c => c.id === custID);
    if (cust) {
      setInvoiceForm(prev => ({
        ...prev,
        customerId: custID,
        customerName: cust.name,
        companyName: cust.company,
        customerAddress: cust.address,
        customerGST: cust.gstin,
        mobile: cust.phone
      }));
    }
  };

  const handleProductChange = (index, prodId) => {
    const prod = products.find(p => p.id === prodId);
    if (prod) {
      setLineItems(prev => prev.map((item, i) => i === index ? {
        ...item,
        productId: prodId,
        color: prod.fabricColor || 'Royal Blue',
        rate: prod.sellingPrice || 1000,
        gstPercent: prod.gstPercent || 12
      } : item));
    }
  };

  const handleAddLineItem = () => {
    const firstProd = products[0];
    setLineItems([
      ...lineItems,
      {
        productId: firstProd?.id || '',
        color: firstProd?.fabricColor || 'Royal Blue',
        size: 'L',
        qty: 1,
        rate: firstProd?.sellingPrice || 1000,
        discountPercent: 0,
        gstPercent: 12
      }
    ]);
  };

  const handleRemoveLineItem = (index) => {
    if (lineItems.length > 1) {
      setLineItems(lineItems.filter((_, i) => i !== index));
    }
  };

  // Calculations for invoice total with Dual Discount System
  const processedItems = lineItems.map(item => {
    const prod = products.find(p => p.id === item.productId);
    const grossAmount = (item.qty || 0) * (item.rate || 0);

    // 1. Fixed Discount (e.g., 40%)
    const fixedDiscVal = grossAmount * ((fixedDiscountPercent || 0) / 100);
    const afterFixed = grossAmount - fixedDiscVal;

    // 2. Additional Discount (0%, 5%, 10%, 15%, 20%)
    const addDiscVal = afterFixed * ((additionalDiscountPercent || 0) / 100);

    // Custom item discount override if set
    const totalDiscVal = item.discountPercent > 0 
      ? (grossAmount * (item.discountPercent / 100)) 
      : (fixedDiscVal + addDiscVal);

    const taxableAmt = grossAmount - totalDiscVal;
    const gstAmt = taxableAmt * ((item.gstPercent || 12) / 100);
    const totalAmt = taxableAmt + gstAmt;

    return {
      ...item,
      productName: prod ? prod.name : 'Garment Shirt',
      code: prod ? prod.code : 'AL-SH-101',
      hsn: prod ? prod.hsnCode : '620520',
      grossAmount: parseFloat(grossAmount.toFixed(2)),
      fixedDiscVal: parseFloat(fixedDiscVal.toFixed(2)),
      addDiscVal: parseFloat(addDiscVal.toFixed(2)),
      totalDiscVal: parseFloat(totalDiscVal.toFixed(2)),
      taxableAmt: parseFloat(taxableAmt.toFixed(2)),
      gstAmt: parseFloat(gstAmt.toFixed(2)),
      totalAmt: parseFloat(totalAmt.toFixed(2))
    };
  });

  const subtotal = processedItems.reduce((acc, i) => acc + i.grossAmount, 0);
  const totalFixedDisc = processedItems.reduce((acc, i) => acc + i.fixedDiscVal, 0);
  const totalAddDisc = processedItems.reduce((acc, i) => acc + i.addDiscVal, 0);
  const taxableTotal = processedItems.reduce((acc, i) => acc + i.taxableAmt, 0);
  const gstTotal = processedItems.reduce((acc, i) => acc + i.gstAmt, 0);
  const rawGrandTotal = taxableTotal + gstTotal;
  const roundedGrandTotal = Math.round(rawGrandTotal);
  const roundOff = parseFloat((roundedGrandTotal - rawGrandTotal).toFixed(2));

  // CGST/SGST vs IGST split
  const isGujarat = (invoiceForm.customerAddress || '').toLowerCase().includes('gujarat');
  const cgst = isGujarat ? gstTotal / 2 : 0;
  const sgst = isGujarat ? gstTotal / 2 : 0;
  const igst = !isGujarat ? gstTotal : 0;

  const handleSaveInvoice = async (e) => {
    e.preventDefault();
    setFormFeedback({ type: '', text: '' });

    if (!invoiceForm.customerName.trim()) {
      setFormFeedback({ type: 'error', text: 'Please enter Customer Name.' });
      return;
    }
    if (products.length === 0) {
      setFormFeedback({ type: 'error', text: 'No products available. Please add products in Product Master first.' });
      return;
    }

    const invoicePayload = {
      ...invoiceForm,
      items: processedItems,
      subtotal: parseFloat(subtotal.toFixed(2)),
      fixedDiscountPercent,
      totalFixedDisc: parseFloat(totalFixedDisc.toFixed(2)),
      additionalDiscountPercent,
      totalAddDisc: parseFloat(totalAddDisc.toFixed(2)),
      taxableTotal: parseFloat(taxableTotal.toFixed(2)),
      cgst: parseFloat(cgst.toFixed(2)),
      sgst: parseFloat(sgst.toFixed(2)),
      igst: parseFloat(igst.toFixed(2)),
      roundOff,
      grandTotal: roundedGrandTotal,
      amountInWords: numberToWords(roundedGrandTotal)
    };

    if (!navigator.onLine) {
      setFormFeedback({ type: 'error', text: 'Cannot create invoice while offline. Active server connection required.' });
      return;
    }

    if (editingInvoice) {
      const updated = invoices.map(i => i.id === editingInvoice.id ? {
        ...i,
        ...invoicePayload
      } : i);
      setInvoices(updated);
      saveData('INVOICES', updated);
      setFormFeedback({ type: 'success', text: `Invoice ${invoicePayload.invoiceNo} updated successfully!` });
      setTimeout(() => {
        setShowCreateModal(false);
        setFormFeedback({ type: '', text: '' });
        setEditingInvoice(null);
      }, 1000);
      return;
    }

    const res = await saveSalesInvoice(invoicePayload);
    if (res.success) {
      setInvoices(getData('INVOICES') || []);
      setFormFeedback({ type: 'success', text: `Invoice ${invoicePayload.invoiceNo} saved & customer record updated successfully!` });
      setTimeout(() => {
        setShowCreateModal(false);
        setFormFeedback({ type: '', text: '' });
        setSelectedInvoiceForPdf(res.invoice);
      }, 1000);
    } else {
      setFormFeedback({ type: 'error', text: res.message });
    }
  };

  const handleCancelInvoice = (invoiceId) => {
    if (confirm('Are you sure you want to cancel this invoice? Cancelled invoices maintain audit records.')) {
      const updated = invoices.map(i => i.id === invoiceId ? { ...i, status: 'CANCELLED' } : i);
      setInvoices(updated);
      saveData('INVOICES', updated);
      if (selectedInvoiceForPdf && selectedInvoiceForPdf.id === invoiceId) {
        setSelectedInvoiceForPdf({ ...selectedInvoiceForPdf, status: 'CANCELLED' });
      }
    }
  };

  const filteredInvoices = invoices.filter(i => 
    i.invoiceNo.toLowerCase().includes(searchTerm.toLowerCase()) ||
    i.customerName.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div style={{ padding: '24px' }}>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '20px' }}>
        <div>
          <h2 style={{ fontSize: '1.4rem', fontWeight: '800' }}>ALISTON Sales Invoice & Billing Module</h2>
          <p style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>
            Generate professional GST tax invoices — automatically decrements finished stock ledger by size
          </p>
        </div>
        <button className="btn btn-primary" onClick={handleOpenCreateModal}>
          <Plus size={16} /> + Generate New Sales Invoice
        </button>
      </div>

      {/* Filter Bar */}
      <div className="card" style={{ padding: '12px 18px', marginBottom: '20px', display: 'flex', alignItems: 'center', gap: '12px' }}>
        <Search size={16} color="var(--text-muted)" />
        <input 
          type="text" 
          placeholder="Search Invoice #, Customer Name..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          style={{ width: '100%' }}
        />
      </div>

      {/* Invoices List Table */}
      <div className="erp-table-container">
        <table className="erp-table">
          <thead>
            <tr>
              <th>Invoice #</th>
              <th>Date</th>
              <th>Customer Name</th>
              <th>Items Count</th>
              <th>Taxable Amt</th>
              <th>GST (CGST/SGST/IGST)</th>
              <th>Grand Total</th>
              <th>Status</th>
              <th>Actions</th>
            </tr>
          </thead>
          <tbody>
            {filteredInvoices.length === 0 ? (
              <tr>
                <td colSpan="9" style={{ textAlign: 'center', padding: '30px', color: 'var(--text-muted)' }}>
                  No sales invoices generated yet. Click "+ Generate New Sales Invoice" to add your first bill.
                </td>
              </tr>
            ) : (
              filteredInvoices.map(inv => (
                <tr key={inv.id}>
                  <td className="mono" style={{ fontWeight: '800', color: 'var(--accent-gold)' }}>{inv.invoiceNo}</td>
                  <td>{inv.date}</td>
                  <td style={{ fontWeight: '600' }}>{inv.customerName}</td>
                  <td><span className="badge badge-blue">{inv.items?.length || 0} Items</span></td>
                  <td className="mono">₹{inv.taxableTotal?.toFixed(2)}</td>
                  <td className="mono" style={{ fontSize: '0.8rem' }}>₹{((inv.cgst || 0) + (inv.sgst || 0) + (inv.igst || 0)).toFixed(2)}</td>
                  <td className="mono" style={{ fontWeight: '800', color: '#3fb950', fontSize: '0.95rem' }}>₹{inv.grandTotal?.toFixed(2)}</td>
                  <td>
                    <span className={`badge ${inv.status === 'CANCELLED' ? 'badge-red' : 'badge-green'}`}>
                      {inv.status || 'SAVED'}
                    </span>
                  </td>
                  <td>
                    <div style={{ display: 'flex', gap: '6px' }}>
                      <button className="btn btn-secondary btn-sm" onClick={() => setSelectedInvoiceForPdf(inv)} title="View / Print PDF">
                        <Eye size={14} /> View
                      </button>
                      <button className="btn btn-secondary btn-sm" onClick={() => handleEditInvoice(inv)} title="Edit Invoice Details" style={{ backgroundColor: 'var(--accent-gold)', color: '#000000', fontWeight: '800' }}>
                        <Edit size={14} /> Edit
                      </button>
                      <button className="btn btn-danger btn-sm" onClick={() => handleDeleteInvoice(inv.id)} title="Delete Invoice" style={{ backgroundColor: '#dc2626', color: '#ffffff' }}>
                        <Trash2 size={14} /> Delete
                      </button>
                    </div>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {/* Create Sales Invoice Modal */}
      {showCreateModal && (
        <div className="modal-overlay">
          <div className="modal-content" style={{ maxWidth: '920px' }}>
            <div className="modal-header">
              <h3>Create ALISTON GST Sales Invoice</h3>
              <button onClick={() => setShowCreateModal(false)} style={{ background: 'none', color: 'var(--text-muted)' }}>✕</button>
            </div>
            <form onSubmit={handleSaveInvoice}>
              <div className="modal-body" style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                {formFeedback.text && (
                  <div style={{
                    padding: '8px 12px',
                    borderRadius: '4px',
                    fontSize: '0.8rem',
                    backgroundColor: formFeedback.type === 'error' ? 'rgba(218,54,51,0.2)' : 'rgba(35,134,54,0.2)',
                    color: formFeedback.type === 'error' ? '#f85149' : '#3fb950'
                  }}>
                    {formFeedback.text}
                  </div>
                )}

                {/* Header info grid */}
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '12px' }}>
                  <div>
                    <label style={{ fontSize: '0.75rem', color: 'var(--text-secondary)' }}>Invoice Number</label>
                    <input type="text" required style={{ width: '100%', fontWeight: '700' }} value={invoiceForm.invoiceNo} onChange={(e) => setInvoiceForm({ ...invoiceForm, invoiceNo: e.target.value })} />
                  </div>

                  <div>
                    <label style={{ fontSize: '0.75rem', color: 'var(--text-secondary)' }}>Invoice Date</label>
                    <input type="date" required style={{ width: '100%' }} value={invoiceForm.date} onChange={(e) => setInvoiceForm({ ...invoiceForm, date: e.target.value })} />
                  </div>

                  <div>
                    <label style={{ fontSize: '0.75rem', color: 'var(--text-secondary)' }}>Customer Selection</label>
                    <select style={{ width: '100%' }} value={invoiceForm.customerId || 'NEW'} onChange={(e) => handleCustomerChange(e.target.value)}>
                      <option value="NEW">+ Type New Customer Details</option>
                      {customers.map(c => <option key={c.id} value={c.id}>{c.name} ({c.company || c.phone})</option>)}
                    </select>
                  </div>

                  <div>
                    <label style={{ fontSize: '0.75rem', color: 'var(--text-secondary)' }}>Customer Name *</label>
                    <input type="text" required style={{ width: '100%', fontWeight: '600' }} value={invoiceForm.customerName} onChange={(e) => setInvoiceForm({ ...invoiceForm, customerName: e.target.value })} placeholder="e.g. Keshvi Men's Studio" />
                  </div>

                  <div>
                    <label style={{ fontSize: '0.75rem', color: 'var(--text-secondary)' }}>Company Name</label>
                    <input type="text" style={{ width: '100%' }} value={invoiceForm.companyName} onChange={(e) => setInvoiceForm({ ...invoiceForm, companyName: e.target.value })} placeholder="e.g. Keshvi Garments Pvt Ltd" />
                  </div>

                  <div>
                    <label style={{ fontSize: '0.75rem', color: 'var(--text-secondary)' }}>Mobile Phone</label>
                    <input type="text" style={{ width: '100%' }} value={invoiceForm.mobile} onChange={(e) => setInvoiceForm({ ...invoiceForm, mobile: e.target.value })} placeholder="e.g. 9824055566" />
                  </div>

                  <div>
                    <label style={{ fontSize: '0.75rem', color: 'var(--text-secondary)' }}>Customer GSTIN</label>
                    <input type="text" style={{ width: '100%' }} value={invoiceForm.customerGST} onChange={(e) => setInvoiceForm({ ...invoiceForm, customerGST: e.target.value })} placeholder="24AAAFK9876C1Z3" />
                  </div>

                  <div>
                    <label style={{ fontSize: '0.75rem', color: 'var(--text-secondary)' }}>Address & State</label>
                    <input type="text" style={{ width: '100%' }} value={invoiceForm.customerAddress} onChange={(e) => setInvoiceForm({ ...invoiceForm, customerAddress: e.target.value })} placeholder="Surat, Gujarat" />
                  </div>
                </div>

                {/* Dual Discount System Control Panel */}
                <div style={{
                  backgroundColor: 'rgba(212, 175, 55, 0.08)',
                  border: '1px solid rgba(212, 175, 55, 0.3)',
                  borderRadius: '8px',
                  padding: '12px 16px',
                  display: 'grid',
                  gridTemplateColumns: '1fr 1fr 1.2fr',
                  gap: '14px',
                  alignItems: 'center'
                }}>
                  <div>
                    <label style={{ fontSize: '0.75rem', fontWeight: '800', color: 'var(--accent-gold)', display: 'block', marginBottom: '4px' }}>
                      1. Fixed Trade Discount
                    </label>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                      <input
                        type="number"
                        min="0"
                        max="100"
                        value={fixedDiscountPercent}
                        onChange={(e) => setFixedDiscountPercent(parseFloat(e.target.value) || 0)}
                        style={{ width: '80px', fontWeight: '800', textAlign: 'center', padding: '6px 8px', borderRadius: '4px', border: '1px solid var(--border-color)' }}
                      />
                      <span style={{ fontWeight: '800', color: 'var(--accent-gold)', fontSize: '0.85rem' }}>% (Fixed)</span>
                    </div>
                  </div>

                  <div>
                    <label style={{ fontSize: '0.75rem', fontWeight: '800', color: '#60a5fa', display: 'block', marginBottom: '4px' }}>
                      2. Additional Festive Discount
                    </label>
                    <select
                      value={additionalDiscountPercent}
                      onChange={(e) => setAdditionalDiscountPercent(parseFloat(e.target.value) || 0)}
                      style={{ width: '100%', fontWeight: '700', padding: '6px 10px', borderRadius: '4px', border: '1px solid var(--border-color)', backgroundColor: 'var(--bg-card)', color: '#ffffff', fontSize: '0.85rem' }}
                    >
                      <option value="0">0% Additional Discount</option>
                      <option value="5">5% Additional Discount</option>
                      <option value="10">10% Additional Discount</option>
                      <option value="15">15% Additional Discount</option>
                      <option value="20">20% Additional Discount</option>
                    </select>
                  </div>

                  <div style={{ textAlign: 'right', borderLeft: '1px solid rgba(255,255,255,0.1)', paddingLeft: '12px' }}>
                    <div style={{ fontSize: '0.7rem', color: 'var(--text-muted)' }}>Total Savings / Discount:</div>
                    <div style={{ fontSize: '1.1rem', fontWeight: '900', color: '#3fb950', marginTop: '2px' }}>
                      -₹{(totalFixedDisc + totalAddDisc).toFixed(2)}
                    </div>
                  </div>
                </div>

                {/* Product Line Items */}
                <div className="card" style={{ padding: '14px' }}>
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '10px' }}>
                    <h4 style={{ fontSize: '0.9rem', color: 'var(--accent-gold)' }}>Invoice Garment Line Items</h4>
                    {products.length > 0 && (
                      <button type="button" className="btn btn-secondary btn-sm" onClick={handleAddLineItem}>
                        <Plus size={14} /> Add Item Row
                      </button>
                    )}
                  </div>

                  {products.length === 0 ? (
                    <div style={{ padding: '20px', textAlign: 'center', color: '#f85149', backgroundColor: 'rgba(218,54,51,0.1)', borderRadius: '6px' }}>
                      <AlertTriangle size={24} style={{ marginBottom: '8px' }} />
                      <div>No products exist in Product Master! Please add products under "Product Master [F2]" tab first.</div>
                    </div>
                  ) : (
                    lineItems.map((item, idx) => {
                      const selProd = products.find(p => p.id === item.productId);
                      const stkEntry = stockList.find(s => s.productId === item.productId && s.color.toLowerCase() === (item.color || '').toLowerCase());
                      const availSizeQty = stkEntry?.sizes?.[item.size] || 0;

                      return (
                        <div key={idx} style={{ display: 'grid', gridTemplateColumns: '2fr 1fr 80px 70px 100px 70px 100px 40px', gap: '8px', alignItems: 'center', marginBottom: '10px' }}>
                          <div>
                            <select style={{ width: '100%', fontSize: '0.8rem' }} value={item.productId} onChange={(e) => handleProductChange(idx, e.target.value)}>
                              {products.map(p => <option key={p.id} value={p.id}>{p.code} - {p.name}</option>)}
                            </select>
                          </div>

                          <div>
                            <input type="text" placeholder="Color" style={{ width: '100%', fontSize: '0.8rem' }} value={item.color} onChange={(e) => {
                              const val = e.target.value;
                              setLineItems(lineItems.map((it, i) => i === idx ? { ...it, color: val } : it));
                            }} />
                          </div>

                          <div>
                            <select style={{ width: '100%', fontSize: '0.8rem' }} value={item.size} onChange={(e) => {
                              const val = e.target.value;
                              setLineItems(lineItems.map((it, i) => i === idx ? { ...it, size: val } : it));
                            }}>
                              {['S', 'M', 'L', 'XL', 'XXL', 'XXXL'].map(sz => <option key={sz} value={sz}>{sz}</option>)}
                            </select>
                          </div>

                          <div>
                            <input type="number" min="1" placeholder="Qty" style={{ width: '100%', fontSize: '0.8rem', fontWeight: '700' }} value={item.qty} onChange={(e) => {
                              const val = parseInt(e.target.value) || 1;
                              setLineItems(lineItems.map((it, i) => i === idx ? { ...it, qty: val } : it));
                            }} />
                            <div style={{ fontSize: '0.65rem', color: availSizeQty < item.qty ? '#f85149' : 'var(--text-muted)' }}>
                              Stk: {availSizeQty} pcs
                            </div>
                          </div>

                          <div>
                            <input type="number" step="0.1" placeholder="Rate ₹" style={{ width: '100%', fontSize: '0.8rem' }} value={item.rate} onChange={(e) => {
                              const val = parseFloat(e.target.value) || 0;
                              setLineItems(lineItems.map((it, i) => i === idx ? { ...it, rate: val } : it));
                            }} />
                          </div>

                          <div>
                            <input type="number" placeholder="Override %" style={{ width: '100%', fontSize: '0.8rem' }} value={item.discountPercent} onChange={(e) => {
                              const val = parseFloat(e.target.value) || 0;
                              setLineItems(lineItems.map((it, i) => i === idx ? { ...it, discountPercent: val } : it));
                            }} />
                          </div>

                          <div className="mono" style={{ fontSize: '0.8rem', fontWeight: '700', color: '#3fb950', textAlign: 'right' }}>
                            ₹{processedItems[idx]?.totalAmt?.toFixed(2)}
                          </div>

                          <div>
                            <button type="button" className="btn btn-danger btn-sm" style={{ padding: '4px' }} onClick={() => handleRemoveLineItem(idx)}>
                              <Trash2 size={14} />
                            </button>
                          </div>
                        </div>
                      );
                    })
                  )}
                </div>

                {/* Bottom summary matrix */}
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 340px', gap: '16px' }}>
                  <div>
                    <label style={{ fontSize: '0.75rem', color: 'var(--text-secondary)' }}>Payment Mode</label>
                    <select style={{ width: '100%', marginBottom: '10px' }} value={invoiceForm.paymentMode} onChange={(e) => setInvoiceForm({ ...invoiceForm, paymentMode: e.target.value })}>
                      <option value="Bank Transfer (NEFT/RTGS)">Bank Transfer (NEFT/RTGS)</option>
                      <option value="UPI / GPay / PhonePe">UPI / GPay / PhonePe</option>
                      <option value="Cash">Cash</option>
                      <option value="Cheque">Cheque</option>
                    </select>

                    <label style={{ fontSize: '0.75rem', color: 'var(--text-secondary)' }}>Amount in Rupee Words:</label>
                    <div style={{ fontSize: '0.8rem', fontWeight: '700', color: 'var(--accent-gold)', backgroundColor: 'var(--bg-input)', padding: '8px 12px', borderRadius: '4px' }}>
                      {numberToWords(roundedGrandTotal)}
                    </div>
                  </div>

                  <div style={{ backgroundColor: 'rgba(255,255,255,0.03)', padding: '12px', borderRadius: '8px', border: '1px solid var(--border-color)', fontSize: '0.825rem', display: 'flex', flexDirection: 'column', gap: '6px' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                      <span>Gross MRP Subtotal:</span>
                      <span className="mono">₹{subtotal.toFixed(2)}</span>
                    </div>
                    {totalFixedDisc > 0 && (
                      <div style={{ display: 'flex', justifyContent: 'space-between', color: 'var(--accent-gold)' }}>
                        <span>Fixed Disc ({fixedDiscountPercent}%):</span>
                        <span className="mono">-₹{totalFixedDisc.toFixed(2)}</span>
                      </div>
                    )}
                    {totalAddDisc > 0 && (
                      <div style={{ display: 'flex', justifyContent: 'space-between', color: '#60a5fa' }}>
                        <span>Additional Disc ({additionalDiscountPercent}%):</span>
                        <span className="mono">-₹{totalAddDisc.toFixed(2)}</span>
                      </div>
                    )}
                    <div style={{ display: 'flex', justifyContent: 'space-between', fontWeight: '700', borderTop: '1px dashed var(--border-color)', paddingTop: '4px' }}>
                      <span>Taxable Total:</span>
                      <span className="mono">₹{taxableTotal.toFixed(2)}</span>
                    </div>
                    {isGujarat ? (
                      <>
                        <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                          <span>CGST (6%):</span>
                          <span className="mono">₹{cgst.toFixed(2)}</span>
                        </div>
                        <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                          <span>SGST (6%):</span>
                          <span className="mono">₹{sgst.toFixed(2)}</span>
                        </div>
                      </>
                    ) : (
                      <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                        <span>IGST (12%):</span>
                        <span className="mono">₹{igst.toFixed(2)}</span>
                      </div>
                    )}
                    <div style={{ borderTop: '1px solid var(--border-color)', paddingTop: '6px', display: 'flex', justifyContent: 'space-between', fontSize: '1rem', fontWeight: '800', color: '#3fb950' }}>
                      <span>GRAND TOTAL:</span>
                      <span className="mono">₹{roundedGrandTotal.toFixed(2)}</span>
                    </div>
                  </div>
                </div>
              </div>

              <div className="modal-footer">
                <button type="button" className="btn btn-secondary" onClick={() => setShowCreateModal(false)}>Cancel</button>
                <button type="submit" className="btn btn-primary">Save Invoice & Deduct Stock</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* PDF View Modal */}
      {selectedInvoiceForPdf && (
        <InvoicePdfModal 
          invoice={selectedInvoiceForPdf} 
          companyDetails={companyDetails}
          onClose={() => setSelectedInvoiceForPdf(null)} 
          onCancel={handleCancelInvoice}
        />
      )}
    </div>
  );
};
