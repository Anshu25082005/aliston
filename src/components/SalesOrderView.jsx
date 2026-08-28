import React, { useState } from 'react';
import { 
  ShoppingCart, 
  Plus, 
  Search, 
  Filter, 
  Calendar, 
  UserCheck, 
  FileText, 
  Printer, 
  CheckCircle2, 
  Clock, 
  Truck, 
  Trash2, 
  ArrowRight,
  User,
  MapPin,
  Phone,
  DollarSign
} from 'lucide-react';
import { getData, saveData } from '../db/storage';
import { exportToExcel } from '../utils/excelExporter';

export const SalesOrderView = () => {
  const [orders, setOrders] = useState(() => getData('ORDERS') || []);
  const [products] = useState(() => getData('PRODUCTS') || []);
  const [customers] = useState(() => getData('CUSTOMERS') || []);
  const [companyDetails] = useState(() => getData('COMPANY') || {});
  const [invoices, setInvoices] = useState(() => getData('INVOICES') || []);

  // Listen to real-time database updates
  React.useEffect(() => {
    const handleDbUpdate = () => {
      setOrders(getData('ORDERS') || []);
      setInvoices(getData('INVOICES') || []);
    };
    window.addEventListener('aliston-db-updated', handleDbUpdate);
    return () => window.removeEventListener('aliston-db-updated', handleDbUpdate);
  }, []);

  const [searchTerm, setSearchTerm] = useState('');
  const [filterStatus, setFilterStatus] = useState('ALL');

  // Modal States
  const [showOrderModal, setShowOrderModal] = useState(false);
  const [showReceiptModal, setShowReceiptModal] = useState(false);
  const [selectedOrder, setSelectedOrder] = useState(null);

  // Default Order Form State
  const [salespersonName, setSalespersonName] = useState('Rahul Sharma (Sales Rep)');
  const [customerName, setCustomerName] = useState('');
  const [customerPhone, setCustomerPhone] = useState('');
  const [customerCity, setCustomerCity] = useState('');
  const [deliveryDate, setDeliveryDate] = useState(() => {
    const d = new Date();
    d.setDate(d.getDate() + 7);
    return d.toISOString().split('T')[0];
  });
  const [notes, setNotes] = useState('Festive bulk order - ALISTON Premium Box Packaging');
  const [advanceAmount, setAdvanceAmount] = useState(5000);
  const [paymentMode, setPaymentMode] = useState('UPI / Bank Transfer');
  const [gstPercent, setGstPercent] = useState(12);

  // Discount Controls: 1 Fixed (40%) + 1 Additional Scheme (0%, 5%, 10%, 15%, 20%)
  const [fixedDiscountPercent, setFixedDiscountPercent] = useState(40);
  const [additionalDiscountPercent, setAdditionalDiscountPercent] = useState(10);

  // Form Order Items State
  const [orderItems, setOrderItems] = useState([
    {
      productId: products[0]?.id || 'p-1',
      productName: products[0]?.name || 'Linen Formal Shirt',
      fabric: products[0]?.fabric || 'Linen Pure 60 Lea',
      color: products[0]?.fabricColor || 'Royal Blue',
      sizeQty: { S: 5, M: 15, L: 20, XL: 10, '2XL': 5, '3XL': 0 },
      rate: products[0]?.sellingPrice || 950
    }
  ]);

  const handleAddItemRow = () => {
    const firstProd = products[0];
    setOrderItems(prev => [
      ...prev,
      {
        productId: firstProd?.id || 'p-1',
        productName: firstProd?.name || 'Garment Item',
        fabric: firstProd?.fabric || 'Linen',
        color: firstProd?.fabricColor || 'White',
        sizeQty: { S: 0, M: 10, L: 10, XL: 5, '2XL': 0, '3XL': 0 },
        rate: firstProd?.sellingPrice || 900
      }
    ]);
  };

  const handleRemoveItemRow = (index) => {
    if (orderItems.length === 1) return;
    setOrderItems(prev => prev.filter((_, i) => i !== index));
  };

  const handleProductSelect = (index, prodId) => {
    const prod = products.find(p => p.id === prodId);
    if (!prod) return;
    setOrderItems(prev => {
      const copy = [...prev];
      copy[index] = {
        ...copy[index],
        productId: prod.id,
        productName: prod.name,
        fabric: `${prod.fabric} (${prod.fabricColor})`,
        color: prod.fabricColor,
        rate: prod.sellingPrice || 950
      };
      return copy;
    });
  };

  const handleProductNameChange = (index, val) => {
    setOrderItems(prev => {
      const copy = [...prev];
      copy[index] = {
        ...copy[index],
        productName: val
      };
      return copy;
    });
  };

  const handleFabricColorChange = (index, val) => {
    setOrderItems(prev => {
      const copy = [...prev];
      copy[index] = {
        ...copy[index],
        fabric: val
      };
      return copy;
    });
  };

  const handleSizeQtyChange = (itemIdx, sizeKey, val) => {
    const qty = Math.max(0, parseInt(val) || 0);
    setOrderItems(prev => {
      const copy = [...prev];
      copy[itemIdx].sizeQty = {
        ...copy[itemIdx].sizeQty,
        [sizeKey]: qty
      };
      return copy;
    });
  };

  const handleRateChange = (itemIdx, val) => {
    const r = Math.max(0, parseFloat(val) || 0);
    setOrderItems(prev => {
      const copy = [...prev];
      copy[itemIdx].rate = r;
      return copy;
    });
  };

  // Calculate totals with Dual Discount System (Fixed 40% + Additional 0/5/10/15/20%)
  const processedItems = orderItems.map(item => {
    const totalQty = Object.values(item.sizeQty).reduce((a, b) => a + b, 0);
    const grossAmount = totalQty * item.rate;
    const fixedDiscVal = grossAmount * (fixedDiscountPercent / 100);
    const afterFixed = grossAmount - fixedDiscVal;
    const addDiscVal = afterFixed * (additionalDiscountPercent / 100);
    const amount = afterFixed - addDiscVal;
    const netRate = totalQty > 0 ? amount / totalQty : 0;

    return { 
      ...item, 
      totalQty, 
      grossAmount, 
      fixedDiscVal, 
      addDiscVal, 
      amount, 
      netRate 
    };
  });

  const grandTotalQty = processedItems.reduce((sum, item) => sum + item.totalQty, 0);
  const grossMRPTotal = processedItems.reduce((sum, item) => sum + item.grossAmount, 0);
  const totalFixedDisc = processedItems.reduce((sum, item) => sum + item.fixedDiscVal, 0);
  const totalAddDisc = processedItems.reduce((sum, item) => sum + item.addDiscVal, 0);
  const subTotalAmount = processedItems.reduce((sum, item) => sum + item.amount, 0);
  const calculatedGst = subTotalAmount * (gstPercent / 100);
  const grandTotalAmount = subTotalAmount + calculatedGst;
  const balanceDueAmount = Math.max(0, grandTotalAmount - advanceAmount);

  const handleSaveOrder = (e) => {
    e.preventDefault();
    if (!customerName.trim()) {
      alert('Please enter Customer Name');
      return;
    }
    if (grandTotalQty === 0) {
      alert('Please enter at least 1 item quantity across sizes S-3XL');
      return;
    }

    const nextOrderNo = 'SO/2026-27/' + (1000 + orders.length + 1);
    const newOrder = {
      id: 'so-' + Date.now(),
      orderNo: nextOrderNo,
      date: new Date().toISOString().split('T')[0],
      deliveryDate,
      salesperson: salespersonName,
      customerName,
      customerPhone,
      customerCity,
      items: processedItems,
      totalQuantity: grandTotalQty,
      grossMRPTotal,
      fixedDiscountPercent,
      totalFixedDisc,
      additionalDiscountPercent,
      totalAddDisc,
      subTotal: subTotalAmount,
      gstPercent,
      gstAmount: calculatedGst,
      grandTotal: grandTotalAmount,
      advanceAmount: parseFloat(advanceAmount) || 0,
      balanceAmount: balanceDueAmount,
      paymentMode,
      notes,
      status: 'Pending',
      convertedToInvoice: false
    };

    const updated = [newOrder, ...orders];
    setOrders(updated);
    saveData('ORDERS', updated);
    setShowOrderModal(false);

    // Reset Form
    setCustomerName('');
    setCustomerPhone('');
    setCustomerCity('');
  };

  const handleStatusChange = (orderId, newStatus) => {
    const updated = orders.map(o => o.id === orderId ? { ...o, status: newStatus } : o);
    setOrders(updated);
    saveData('ORDERS', updated);
  };

  const handleDeleteOrder = (orderId) => {
    if (confirm('Are you sure you want to delete this sales order booking?')) {
      const updated = orders.filter(o => o.id !== orderId);
      setOrders(updated);
      saveData('ORDERS', updated);
    }
  };

  const handleConvertToInvoice = (order) => {
    if (order.convertedToInvoice) {
      alert('This order has already been converted to a Sales Invoice.');
      return;
    }

    if (confirm(`Convert Sales Order ${order.orderNo} into an Official Sales Invoice?`)) {
      const nextInvNo = 'AL/2026-27/' + (1000 + invoices.length + 1);
      const newInvoice = {
        id: 'inv-' + Date.now(),
        invoiceNo: nextInvNo,
        date: new Date().toISOString().split('T')[0],
        customerName: order.customerName,
        customerPhone: order.customerPhone,
        customerCity: order.customerCity,
        salesperson: order.salesperson,
        items: order.items,
        totalQuantity: order.totalQuantity,
        subTotal: order.subTotal,
        gstPercent: order.gstPercent,
        gstAmount: order.gstAmount,
        grandTotal: order.grandTotal,
        advancePaid: order.advanceAmount,
        balanceDue: order.balanceAmount,
        status: 'PAID',
        sourceOrderNo: order.orderNo
      };

      // Save Invoice
      const updatedInvoices = [newInvoice, ...invoices];
      setInvoices(updatedInvoices);
      saveData('INVOICES', updatedInvoices);

      // Mark Order as Converted & Delivered
      const updatedOrders = orders.map(o => o.id === order.id ? { ...o, convertedToInvoice: true, status: 'Delivered' } : o);
      setOrders(updatedOrders);
      saveData('ORDERS', updatedOrders);

      alert(`Sales Invoice ${nextInvNo} generated successfully! View under Sales Invoices [F8].`);
    }
  };

  const handleExportExcel = () => {
    const data = orders.map(o => ({
      'Order No': o.orderNo,
      'Order Date': o.date,
      'Target Delivery': o.deliveryDate,
      'Salesperson': o.salesperson,
      'Customer Name': o.customerName,
      'City': o.customerCity,
      'Phone': o.customerPhone,
      'Total Shirts Qty': o.totalQuantity,
      'Grand Total (₹)': o.grandTotal,
      'Advance Paid (₹)': o.advanceAmount,
      'Balance Due (₹)': o.balanceAmount,
      'Status': o.status,
      'Converted to Invoice': o.convertedToInvoice ? 'Yes' : 'No'
    }));
    exportToExcel(data, 'ALISTON_Sales_Orders_Book.xlsx');
  };

  const filteredOrders = orders.filter(o => {
    const matchStatus = filterStatus === 'ALL' || o.status === filterStatus;
    const matchSearch = !searchTerm || 
      o.orderNo.toLowerCase().includes(searchTerm.toLowerCase()) ||
      o.salesperson.toLowerCase().includes(searchTerm.toLowerCase()) ||
      o.customerName.toLowerCase().includes(searchTerm.toLowerCase()) ||
      o.customerCity.toLowerCase().includes(searchTerm.toLowerCase());
    return matchStatus && matchSearch;
  });

  // KPI Calculations
  const totalActiveOrders = orders.filter(o => o.status !== 'Cancelled').length;
  const totalBookedValue = orders.filter(o => o.status !== 'Cancelled').reduce((sum, o) => sum + (o.grandTotal || 0), 0);
  const totalAdvanceCollected = orders.filter(o => o.status !== 'Cancelled').reduce((sum, o) => sum + (o.advanceAmount || 0), 0);
  const totalBalanceDue = orders.filter(o => o.status !== 'Cancelled').reduce((sum, o) => sum + (o.balanceAmount || 0), 0);

  return (
    <div style={{ padding: '24px' }}>
      {/* Top Bar Header */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '20px' }}>
        <div>
          <h2 style={{ fontSize: '1.4rem', fontWeight: '800' }}>ALISTON Sales Order Booking Portal</h2>
          <p style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>
            Record customer orders taken by sales representatives with size breakdown (S-3XL) & advance payments
          </p>
        </div>
        <div style={{ display: 'flex', gap: '12px' }}>
          <button className="btn btn-secondary" onClick={handleExportExcel}>
            Export Orders Excel
          </button>
          <button className="btn btn-primary" onClick={() => setShowOrderModal(true)} style={{ backgroundColor: 'var(--accent-gold)', color: '#090d12', fontWeight: '800' }}>
            <Plus size={16} /> + Book New Sales Order
          </button>
        </div>
      </div>

      {/* KPI Cards */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '16px', marginBottom: '24px' }}>
        <div className="card" style={{ padding: '16px 20px', background: 'linear-gradient(135deg, #161b22 0%, #0d1117 100%)' }}>
          <div style={{ fontSize: '0.775rem', color: 'var(--text-secondary)' }}>Total Booked Orders</div>
          <div style={{ fontSize: '1.6rem', fontWeight: '800', color: '#ffffff', marginTop: '4px' }}>{totalActiveOrders} Orders</div>
        </div>
        <div className="card" style={{ padding: '16px 20px', background: 'linear-gradient(135deg, #161b22 0%, #0d1117 100%)' }}>
          <div style={{ fontSize: '0.775rem', color: 'var(--text-secondary)' }}>Total Order Book Value</div>
          <div className="mono" style={{ fontSize: '1.6rem', fontWeight: '800', color: 'var(--accent-gold)', marginTop: '4px' }}>
            ₹{totalBookedValue.toLocaleString('en-IN', { maximumFractionDigits: 0 })}
          </div>
        </div>
        <div className="card" style={{ padding: '16px 20px', background: 'linear-gradient(135deg, #161b22 0%, #0d1117 100%)' }}>
          <div style={{ fontSize: '0.775rem', color: 'var(--text-secondary)' }}>Advance Payment Collected</div>
          <div className="mono" style={{ fontSize: '1.6rem', fontWeight: '800', color: '#3fb950', marginTop: '4px' }}>
            ₹{totalAdvanceCollected.toLocaleString('en-IN', { maximumFractionDigits: 0 })}
          </div>
        </div>
        <div className="card" style={{ padding: '16px 20px', background: 'linear-gradient(135deg, #161b22 0%, #0d1117 100%)' }}>
          <div style={{ fontSize: '0.775rem', color: 'var(--text-secondary)' }}>Pending Balance Outstanding</div>
          <div className="mono" style={{ fontSize: '1.6rem', fontWeight: '800', color: '#f85149', marginTop: '4px' }}>
            ₹{totalBalanceDue.toLocaleString('en-IN', { maximumFractionDigits: 0 })}
          </div>
        </div>
      </div>

      {/* Filter Bar */}
      <div className="card" style={{ padding: '14px 20px', marginBottom: '20px', display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '12px' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px', flex: 1, minWidth: '280px' }}>
          <Search size={16} color="var(--text-muted)" />
          <input 
            type="text" 
            placeholder="Search by Order #, Salesperson Name, Customer, City..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            style={{ width: '100%' }}
          />
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
          <Filter size={16} color="var(--text-muted)" />
          <select value={filterStatus} onChange={(e) => setFilterStatus(e.target.value)}>
            <option value="ALL">All Order Statuses</option>
            <option value="Pending">Pending</option>
            <option value="In Production">In Production</option>
            <option value="Ready to Dispatch">Ready to Dispatch</option>
            <option value="Dispatched">Dispatched</option>
            <option value="Delivered">Delivered</option>
            <option value="Cancelled">Cancelled</option>
          </select>
        </div>
      </div>

      {/* Sales Orders Table */}
      <div className="erp-table-container">
        <table className="erp-table">
          <thead>
            <tr>
              <th style={{ textAlign: 'center' }}>Actions</th>
              <th>Order #</th>
              <th>Date / Target</th>
              <th>Salesperson</th>
              <th>Customer & City</th>
              <th>Items & Sizes (S-3XL)</th>
              <th>Total Qty</th>
              <th>Grand Total (₹)</th>
              <th>Advance / Balance</th>
              <th>Status</th>
              <th>Invoice</th>
            </tr>
          </thead>
          <tbody>
            {filteredOrders.length === 0 ? (
              <tr>
                <td colSpan="11" style={{ textAlign: 'center', padding: '40px', color: 'var(--text-muted)' }}>
                  No sales orders found. Click "+ Book New Sales Order" to record an order taken by your sales representative.
                </td>
              </tr>
            ) : (
              filteredOrders.map(order => {
                let badgeClass = 'badge-gold';
                if (order.status === 'Pending') badgeClass = 'badge-gold';
                if (order.status === 'In Production') badgeClass = 'badge-blue';
                if (order.status === 'Dispatched' || order.status === 'Delivered') badgeClass = 'badge-green';
                if (order.status === 'Cancelled') badgeClass = 'badge-red';

                return (
                  <tr key={order.id}>
                    <td style={{ textAlign: 'center' }}>
                      <div style={{ display: 'flex', gap: '6px', justifyContent: 'center' }}>
                        <button 
                          className="btn btn-secondary btn-sm"
                          onClick={() => { setSelectedOrder(order); setShowReceiptModal(true); }}
                          title="Print Sales Order Slip"
                        >
                          <Printer size={14} />
                        </button>
                        <button 
                          className="btn btn-danger btn-sm"
                          onClick={() => handleDeleteOrder(order.id)}
                          title="Delete Sales Order"
                          style={{ backgroundColor: '#dc2626', color: '#ffffff' }}
                        >
                          <Trash2 size={14} />
                        </button>
                      </div>
                    </td>
                    <td className="mono" style={{ fontWeight: '800', color: 'var(--accent-gold)' }}>{order.orderNo}</td>
                    <td>
                      <div style={{ fontWeight: '600' }}>{order.date}</div>
                      <div style={{ fontSize: '0.725rem', color: '#3fb950' }}>Due: {order.deliveryDate}</div>
                    </td>
                    <td>
                      <div style={{ fontWeight: '700', color: '#ffffff' }}>{order.salesperson}</div>
                    </td>
                    <td>
                      <div style={{ fontWeight: '700' }}>{order.customerName}</div>
                      <div style={{ fontSize: '0.725rem', color: 'var(--text-muted)' }}>{order.customerCity} | {order.customerPhone}</div>
                    </td>
                    <td style={{ fontSize: '0.775rem' }}>
                      {order.items?.map((it, idx) => (
                        <div key={idx} style={{ marginBottom: '2px' }}>
                          <strong>{it.productName}</strong> ({it.color})
                          <div style={{ color: 'var(--text-secondary)', fontSize: '0.7rem' }}>
                            S:{it.sizeQty?.S||0} M:{it.sizeQty?.M||0} L:{it.sizeQty?.L||0} XL:{it.sizeQty?.XL||0} 2XL:{it.sizeQty?.['2XL']||0} 3XL:{it.sizeQty?.['3XL']||0}
                          </div>
                        </div>
                      ))}
                    </td>
                    <td className="mono" style={{ fontWeight: '800', fontSize: '0.95rem' }}>{order.totalQuantity} Pcs</td>
                    <td className="mono" style={{ fontWeight: '800', color: 'var(--accent-gold)' }}>₹{order.grandTotal?.toFixed(2)}</td>
                    <td>
                      <div style={{ fontSize: '0.75rem', color: '#3fb950' }}>Adv: ₹{order.advanceAmount}</div>
                      <div style={{ fontSize: '0.75rem', color: '#f85149', fontWeight: '700' }}>Bal: ₹{order.balanceAmount}</div>
                    </td>
                    <td>
                      <select 
                        value={order.status}
                        onChange={(e) => handleStatusChange(order.id, e.target.value)}
                        style={{ padding: '2px 6px', fontSize: '0.75rem', borderRadius: '4px' }}
                      >
                        <option value="Pending">Pending</option>
                        <option value="In Production">In Production</option>
                        <option value="Ready to Dispatch">Ready to Dispatch</option>
                        <option value="Dispatched">Dispatched</option>
                        <option value="Delivered">Delivered</option>
                        <option value="Cancelled">Cancelled</option>
                      </select>
                    </td>
                    <td>
                      {order.convertedToInvoice ? (
                        <span className="badge badge-green">INV GENERATED</span>
                      ) : (
                        <button 
                          className="btn btn-secondary btn-sm"
                          onClick={() => handleConvertToInvoice(order)}
                          style={{ fontSize: '0.7rem', padding: '3px 6px' }}
                        >
                          <FileText size={12} /> Convert to Invoice
                        </button>
                      )}
                    </td>
                  </tr>
                );
              })
            )}
          </tbody>
        </table>
      </div>

      {/* Book New Sales Order Modal */}
      {showOrderModal && (
        <div className="modal-overlay">
          <div className="modal-content" style={{ maxWidth: '850px', maxHeight: '90vh', overflowY: 'auto' }}>
            <div className="modal-header">
              <h3>Book New Sales Order (Salesperson Entry Form)</h3>
              <button onClick={() => setShowOrderModal(false)} style={{ background: 'none', color: 'var(--text-muted)' }}>✕</button>
            </div>
            <form onSubmit={handleSaveOrder}>
              <div className="modal-body" style={{ display: 'flex', flexDirection: 'column', gap: '18px' }}>
                
                {/* Salesperson & Order Meta */}
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '14px', background: 'rgba(255, 255, 255, 0.02)', padding: '14px', borderRadius: '8px' }}>
                  <div>
                    <label style={{ fontSize: '0.775rem', color: 'var(--accent-gold)', fontWeight: '700' }}>Salesperson Name</label>
                    <input 
                      type="text" 
                      required 
                      style={{ width: '100%' }}
                      value={salespersonName}
                      onChange={(e) => setSalespersonName(e.target.value)}
                      placeholder="e.g. Rahul Sharma (West Zone)"
                    />
                  </div>
                  <div>
                    <label style={{ fontSize: '0.775rem', color: 'var(--text-secondary)' }}>Target Delivery Date</label>
                    <input 
                      type="date" 
                      required 
                      style={{ width: '100%' }}
                      value={deliveryDate}
                      onChange={(e) => setDeliveryDate(e.target.value)}
                    />
                  </div>
                  <div>
                    <label style={{ fontSize: '0.775rem', color: 'var(--text-secondary)' }}>Payment Mode</label>
                    <select style={{ width: '100%' }} value={paymentMode} onChange={(e) => setPaymentMode(e.target.value)}>
                      <option value="UPI / Bank Transfer">UPI / Bank Transfer</option>
                      <option value="Cash Advance">Cash Advance</option>
                      <option value="Cheque">Cheque</option>
                      <option value="Credit 15 Days">Credit 15 Days</option>
                    </select>
                  </div>
                </div>

                {/* Customer Info */}
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '14px' }}>
                  <div>
                    <label style={{ fontSize: '0.775rem', color: 'var(--text-secondary)' }}>Customer / Shop Name</label>
                    <input 
                      type="text" 
                      required 
                      style={{ width: '100%' }}
                      value={customerName}
                      onChange={(e) => setCustomerName(e.target.value)}
                      placeholder="e.g. Royal Men's Store"
                    />
                  </div>
                  <div>
                    <label style={{ fontSize: '0.775rem', color: 'var(--text-secondary)' }}>Mobile / Contact #</label>
                    <input 
                      type="text" 
                      style={{ width: '100%' }}
                      value={customerPhone}
                      onChange={(e) => setCustomerPhone(e.target.value)}
                      placeholder="+91 98250 00000"
                    />
                  </div>
                  <div>
                    <label style={{ fontSize: '0.775rem', color: 'var(--text-secondary)' }}>City / Market</label>
                    <input 
                      type="text" 
                      style={{ width: '100%' }}
                      value={customerCity}
                      onChange={(e) => setCustomerCity(e.target.value)}
                      placeholder="e.g. Ahmedabad / Surat"
                    />
                  </div>
                </div>

                {/* Garment Items Matrix (S-3XL) */}
                <div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
                    <h4 style={{ fontSize: '0.9rem', color: 'var(--accent-gold)' }}>Select Garment Items & Size Breakup</h4>
                    <button type="button" className="btn btn-secondary btn-sm" onClick={handleAddItemRow}>
                      + Add Item Row
                    </button>
                  </div>

                  {orderItems.map((item, idx) => (
                    <div key={idx} className="card" style={{ padding: '12px 14px', marginBottom: '10px', background: 'rgba(255, 255, 255, 0.015)' }}>
                      <div style={{ display: 'grid', gridTemplateColumns: '2fr 1.5fr 1fr', gap: '12px', marginBottom: '10px' }}>
                        <div>
                          <label style={{ fontSize: '0.725rem', color: 'var(--accent-gold)', fontWeight: '700' }}>
                            Garment Style / Item Name (Type Manually)
                          </label>
                          <input 
                            type="text"
                            list={`products-list-${idx}`}
                            style={{ width: '100%' }}
                            value={item.productName}
                            onChange={(e) => {
                              const val = e.target.value;
                              const matchedProd = products.find(p => p.name === val || `${p.name} (${p.code})` === val);
                              if (matchedProd) {
                                handleProductSelect(idx, matchedProd.id);
                              } else {
                                handleProductNameChange(idx, val);
                              }
                            }}
                            placeholder="Type garment name e.g. Linen Slim Fit Shirt 1008"
                          />
                          <datalist id={`products-list-${idx}`}>
                            {products.map(p => (
                              <option key={p.id} value={`${p.name} (${p.code})`} />
                            ))}
                          </datalist>
                        </div>
                        <div>
                          <label style={{ fontSize: '0.725rem', color: 'var(--accent-gold)', fontWeight: '700' }}>
                            Fabric & Color (Type Manually)
                          </label>
                          <input 
                            type="text" 
                            style={{ width: '100%' }} 
                            value={item.fabric} 
                            onChange={(e) => handleFabricColorChange(idx, e.target.value)}
                            placeholder="Type fabric & color e.g. Linen Pure 60 Lea (Royal Blue)"
                          />
                        </div>
                        <div>
                          <label style={{ fontSize: '0.725rem', color: 'var(--text-muted)' }}>Rate per Piece (₹)</label>
                          <input 
                            type="number" 
                            style={{ width: '100%' }}
                            value={item.rate}
                            onChange={(e) => handleRateChange(idx, e.target.value)}
                          />
                        </div>
                      </div>

                      {/* Size Matrix Inputs S, M, L, XL, 2XL, 3XL */}
                      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(6, 1fr) 1.5fr auto', gap: '8px', alignItems: 'center' }}>
                        {['S', 'M', 'L', 'XL', '2XL', '3XL'].map(sz => (
                          <div key={sz}>
                            <label style={{ fontSize: '0.7rem', color: 'var(--text-secondary)', display: 'block', textAlign: 'center' }}>Size {sz}</label>
                            <input 
                              type="number" 
                              min="0"
                              style={{ width: '100%', textAlign: 'center', padding: '4px' }}
                              value={item.sizeQty[sz]}
                              onChange={(e) => handleSizeQtyChange(idx, sz, e.target.value)}
                            />
                          </div>
                        ))}
                        <div style={{ textAlign: 'right' }}>
                          <div style={{ fontSize: '0.7rem', color: 'var(--text-muted)' }}>Row Qty & Total</div>
                          <div className="mono" style={{ fontWeight: '800', color: 'var(--accent-gold)' }}>
                            {Object.values(item.sizeQty).reduce((a, b) => a + b, 0)} Pcs = ₹{(Object.values(item.sizeQty).reduce((a, b) => a + b, 0) * item.rate).toFixed(0)}
                          </div>
                        </div>
                        {orderItems.length > 1 && (
                          <button type="button" onClick={() => handleRemoveItemRow(idx)} style={{ color: '#f85149', background: 'none', border: 'none', cursor: 'pointer', padding: '4px' }}>✕</button>
                        )}
                      </div>
                    </div>
                  ))}
                </div>

                {/* Discount Setup Card */}
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '14px', background: 'rgba(255, 255, 255, 0.025)', padding: '14px', borderRadius: '8px', border: '1px solid var(--border-color)' }}>
                  <div>
                    <label style={{ fontSize: '0.775rem', color: 'var(--accent-gold)', fontWeight: '700' }}>
                      Discount 1: Fixed Trade Discount (%)
                    </label>
                    <select 
                      style={{ width: '100%', marginTop: '4px', fontWeight: '700' }}
                      value={fixedDiscountPercent}
                      onChange={(e) => setFixedDiscountPercent(parseFloat(e.target.value) || 0)}
                    >
                      <option value="40">40% (Fixed Trade Discount)</option>
                      <option value="0">0% (No Fixed Discount)</option>
                      <option value="30">30% Trade Discount</option>
                      <option value="35">35% Trade Discount</option>
                      <option value="45">45% Trade Discount</option>
                      <option value="50">50% Trade Discount</option>
                    </select>
                  </div>
                  <div>
                    <label style={{ fontSize: '0.775rem', color: 'var(--accent-gold)', fontWeight: '700' }}>
                      Discount 2: Additional Scheme Discount (%)
                    </label>
                    <select 
                      style={{ width: '100%', marginTop: '4px', fontWeight: '700' }}
                      value={additionalDiscountPercent}
                      onChange={(e) => setAdditionalDiscountPercent(parseFloat(e.target.value) || 0)}
                    >
                      <option value="0">0% (No Extra Discount)</option>
                      <option value="5">5% Extra Scheme Discount</option>
                      <option value="10">10% Extra Scheme Discount</option>
                      <option value="15">15% Extra Scheme Discount</option>
                      <option value="20">20% Extra Scheme Discount</option>
                    </select>
                  </div>
                </div>

                {/* Calculation Summary & Advance */}
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '20px', background: 'rgba(229, 185, 92, 0.05)', padding: '16px', borderRadius: '8px', border: '1px solid rgba(229, 185, 92, 0.2)' }}>
                  <div>
                    <label style={{ fontSize: '0.775rem', color: 'var(--text-secondary)' }}>Advance Amount Received from Customer (₹)</label>
                    <input 
                      type="number" 
                      style={{ width: '100%', fontSize: '1.1rem', fontWeight: '800', color: '#3fb950', marginTop: '4px' }}
                      value={advanceAmount}
                      onChange={(e) => setAdvanceAmount(e.target.value)}
                    />
                    
                    <div style={{ marginTop: '10px' }}>
                      <label style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>Special Instructions / Delivery Notes</label>
                      <textarea 
                        rows={2}
                        style={{ width: '100%', marginTop: '4px' }}
                        value={notes}
                        onChange={(e) => setNotes(e.target.value)}
                      />
                    </div>
                  </div>

                  <div style={{ display: 'flex', flexDirection: 'column', gap: '6px', justifyContent: 'center' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.85rem' }}>
                      <span>Total Shirts Quantity:</span>
                      <strong className="mono">{grandTotalQty} Pcs</strong>
                    </div>
                    <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.85rem' }}>
                      <span>Gross MRP Total:</span>
                      <span className="mono">₹{grossMRPTotal.toFixed(2)}</span>
                    </div>
                    {fixedDiscountPercent > 0 && (
                      <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.825rem', color: '#3fb950' }}>
                        <span>Less Fixed Trade Disc ({fixedDiscountPercent}%):</span>
                        <span className="mono">-₹{totalFixedDisc.toFixed(2)}</span>
                      </div>
                    )}
                    {additionalDiscountPercent > 0 && (
                      <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.825rem', color: '#3fb950' }}>
                        <span>Less Additional Disc ({additionalDiscountPercent}%):</span>
                        <span className="mono">-₹{totalAddDisc.toFixed(2)}</span>
                      </div>
                    )}
                    <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.85rem', fontWeight: '700', borderTop: '1px dashed var(--border-color)', paddingTop: '4px' }}>
                      <span>Net Subtotal Amount:</span>
                      <span className="mono">₹{subTotalAmount.toFixed(2)}</span>
                    </div>
                    <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.85rem' }}>
                      <span>GST ({gstPercent}%):</span>
                      <span className="mono">₹{calculatedGst.toFixed(2)}</span>
                    </div>
                    <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '1.1rem', fontWeight: '800', borderTop: '1px solid var(--border-color)', paddingTop: '6px', color: 'var(--accent-gold)' }}>
                      <span>Grand Total:</span>
                      <span className="mono">₹{grandTotalAmount.toFixed(2)}</span>
                    </div>
                    <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '1rem', fontWeight: '800', color: '#f85149' }}>
                      <span>Balance Payable on Delivery:</span>
                      <span className="mono">₹{balanceDueAmount.toFixed(2)}</span>
                    </div>
                  </div>
                </div>

              </div>
              <div className="modal-footer">
                <button type="button" className="btn btn-secondary" onClick={() => setShowOrderModal(false)}>Cancel</button>
                <button type="submit" className="btn btn-primary" style={{ backgroundColor: 'var(--accent-gold)', color: '#090d12', fontWeight: '800' }}>
                  Save & Book Sales Order
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Printable Sales Order Receipt Modal */}
      {showReceiptModal && selectedOrder && (
        <div className="modal-overlay">
          <div className="modal-content" style={{ maxWidth: '700px', backgroundColor: '#ffffff', color: '#000000', padding: '30px' }}>
            <div className="no-print" style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '20px' }}>
              <h3 style={{ margin: 0, color: '#000000' }}>Sales Order Slip Confirmation</h3>
              <div style={{ display: 'flex', gap: '10px' }}>
                <button className="btn btn-primary" onClick={() => window.print()}>Print Order Slip</button>
                <button className="btn btn-secondary" onClick={() => setShowReceiptModal(false)}>Close</button>
              </div>
            </div>

            {/* Printable Order Slip Document */}
            <div style={{ border: '2px solid #000000', padding: '20px' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', borderBottom: '2px solid #000000', paddingBottom: '12px' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                  <img src="/aliston-logo.jpg" alt="Logo" style={{ height: '55px', objectFit: 'contain' }} />
                  <div>
                    <h2 style={{ margin: 0, fontSize: '1.4rem', fontWeight: '900', color: '#002b36' }}>{companyDetails.name || "ALISTON MEN'S WEAR"}</h2>
                    <div style={{ fontSize: '0.75rem', color: '#444' }}>{companyDetails.legalName} | Surat, Gujarat</div>
                  </div>
                </div>
                <div style={{ textAlign: 'right' }}>
                  <h3 style={{ margin: 0, color: '#002b36' }}>SALES ORDER CONFIRMATION</h3>
                  <div style={{ fontSize: '0.9rem', fontWeight: '800' }}>{selectedOrder.orderNo}</div>
                  <div style={{ fontSize: '0.75rem' }}>Date: {selectedOrder.date}</div>
                </div>
              </div>

              {/* Order Meta */}
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px', margin: '14px 0', fontSize: '0.825rem' }}>
                <div>
                  <strong>Customer Details:</strong>
                  <div>{selectedOrder.customerName}</div>
                  <div>City: {selectedOrder.customerCity} | Mobile: {selectedOrder.customerPhone}</div>
                </div>
                <div>
                  <strong>Order Booking Info:</strong>
                  <div>Salesperson: {selectedOrder.salesperson}</div>
                  <div>Target Delivery Date: <strong>{selectedOrder.deliveryDate}</strong></div>
                </div>
              </div>

              {/* Items Table */}
              <table style={{ width: '100%', borderCollapse: 'collapse', marginTop: '10px', fontSize: '0.8rem' }}>
                <thead>
                  <tr style={{ backgroundColor: '#f0f0f0', borderBottom: '1px solid #000' }}>
                    <th style={{ padding: '6px', textAlign: 'left', border: '1px solid #ddd' }}>Garment Style</th>
                    <th style={{ padding: '6px', textAlign: 'center', border: '1px solid #ddd' }}>Sizes (S-3XL)</th>
                    <th style={{ padding: '6px', textAlign: 'center', border: '1px solid #ddd' }}>Total Qty</th>
                    <th style={{ padding: '6px', textAlign: 'right', border: '1px solid #ddd' }}>Rate</th>
                    <th style={{ padding: '6px', textAlign: 'right', border: '1px solid #ddd' }}>Amount</th>
                  </tr>
                </thead>
                <tbody>
                  {selectedOrder.items?.map((it, idx) => (
                    <tr key={idx}>
                      <td style={{ padding: '6px', border: '1px solid #ddd' }}>
                        <strong>{it.productName}</strong> ({it.fabric} - {it.color})
                      </td>
                      <td style={{ padding: '6px', textAlign: 'center', border: '1px solid #ddd', fontSize: '0.75rem' }}>
                        S:{it.sizeQty?.S||0} M:{it.sizeQty?.M||0} L:{it.sizeQty?.L||0} XL:{it.sizeQty?.XL||0} 2XL:{it.sizeQty?.['2XL']||0} 3XL:{it.sizeQty?.['3XL']||0}
                      </td>
                      <td style={{ padding: '6px', textAlign: 'center', border: '1px solid #ddd', fontWeight: '700' }}>{it.totalQty} Pcs</td>
                      <td style={{ padding: '6px', textAlign: 'right', border: '1px solid #ddd' }}>₹{it.rate}</td>
                      <td style={{ padding: '6px', textAlign: 'right', border: '1px solid #ddd', fontWeight: '700' }}>₹{it.amount?.toFixed(2)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>

              {/* Financial Breakdown */}
              <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: '16px', fontSize: '0.85rem' }}>
                <div>
                  <strong>Special Notes:</strong>
                  <div style={{ fontSize: '0.75rem', color: '#555' }}>{selectedOrder.notes}</div>
                </div>
                <div style={{ textAlign: 'right', minWidth: '260px' }}>
                  <div>Total Quantity: <strong>{selectedOrder.totalQuantity} Pcs</strong></div>
                  {selectedOrder.grossMRPTotal > 0 && <div>Gross MRP Total: ₹{selectedOrder.grossMRPTotal?.toFixed(2)}</div>}
                  {selectedOrder.fixedDiscountPercent > 0 && <div style={{ color: '#008000' }}>Less Trade Disc ({selectedOrder.fixedDiscountPercent}%): -₹{selectedOrder.totalFixedDisc?.toFixed(2)}</div>}
                  {selectedOrder.additionalDiscountPercent > 0 && <div style={{ color: '#008000' }}>Less Scheme Disc ({selectedOrder.additionalDiscountPercent}%): -₹{selectedOrder.totalAddDisc?.toFixed(2)}</div>}
                  <div>Grand Total (incl GST): <strong>₹{selectedOrder.grandTotal?.toFixed(2)}</strong></div>
                  <div style={{ color: '#008000', fontWeight: '700' }}>Advance Received: ₹{selectedOrder.advanceAmount?.toFixed(2)}</div>
                  <div style={{ color: '#d00000', fontWeight: '900', fontSize: '1rem', marginTop: '4px' }}>Balance Payable: ₹{selectedOrder.balanceAmount?.toFixed(2)}</div>
                </div>
              </div>

              {/* Signatures */}
              <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: '40px', paddingTop: '20px', borderTop: '1px dashed #aaa', fontSize: '0.75rem' }}>
                <div>Customer Signature</div>
                <div>Sales Representative Signature</div>
                <div>For ALISTON (Shree Ram Enterprise)</div>
              </div>
            </div>

          </div>
        </div>
      )}
    </div>
  );
};
