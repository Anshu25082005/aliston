import React from 'react';
import { Printer, Download, Copy, Edit, XCircle, FileText } from 'lucide-react';
import { INITIAL_COMPANY_DETAILS } from '../db/initialData';
import { numberToWords } from '../utils/numberToWords';
import { downloadInvoicePdf, printInvoiceElement } from '../utils/pdfGenerator';

export const InvoicePdfModal = ({ invoice, companyDetails = INITIAL_COMPANY_DETAILS, onClose, onDuplicate, onCancel }) => {
  if (!invoice) return null;

  const handlePrint = () => {
    printInvoiceElement('printable-aliston-invoice');
  };

  const handleDownload = () => {
    downloadInvoicePdf('printable-aliston-invoice', invoice.invoiceNo);
  };

  return (
    <div className="modal-overlay">
      <div className="modal-content" style={{ maxWidth: '900px', backgroundColor: '#ffffff', color: '#000000', padding: 0 }}>
        {/* Top Control Bar (No Print) */}
        <div className="no-print" style={{
          backgroundColor: '#090d12',
          color: '#ffffff',
          padding: '12px 24px',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          borderBottom: '1px solid var(--border-color)'
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <FileText size={18} color="var(--accent-gold)" />
            <span style={{ fontWeight: '700' }}>Sales Invoice: {invoice.invoiceNo}</span>
            <span className="badge badge-green">{invoice.status || 'SAVED'}</span>
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            <button className="btn btn-primary btn-sm" onClick={handlePrint}>
              <Printer size={14} /> Print Invoice
            </button>
            <button className="btn btn-success btn-sm" onClick={handleDownload}>
              <Download size={14} /> Download PDF
            </button>
            {onDuplicate && (
              <button className="btn btn-secondary btn-sm" onClick={() => onDuplicate(invoice)}>
                <Copy size={14} /> Duplicate
              </button>
            )}
            {onCancel && invoice.status !== 'CANCELLED' && (
              <button className="btn btn-danger btn-sm" onClick={() => onCancel(invoice.id)}>
                <XCircle size={14} /> Cancel Invoice
              </button>
            )}
            <button onClick={onClose} style={{ background: 'none', color: '#ffffff', fontSize: '1.2rem', marginLeft: '12px' }}>✕</button>
          </div>
        </div>

        {/* PRINTABLE INVOICE DOCUMENT BODY */}
        <div id="printable-aliston-invoice" className="invoice-card" style={{ padding: '35px', backgroundColor: '#ffffff', color: '#0f172a', fontFamily: "'Inter', sans-serif" }}>
          
          {/* Header Grid */}
          <div style={{ display: 'flex', justifyContent: 'space-between', borderBottom: '2px solid #0f172a', paddingBottom: '16px', marginBottom: '20px' }}>
            <div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '14px', marginBottom: '8px' }}>
                <img 
                  src="/aliston-logo.jpg" 
                  alt="ALISTON Logo" 
                  style={{
                    height: '65px',
                    objectFit: 'contain',
                    borderRadius: '4px'
                  }}
                />
                <div>
                  <h1 style={{ fontSize: '1.5rem', fontWeight: '900', color: '#002b36', margin: 0, letterSpacing: '0.5px' }}>
                    {companyDetails.name}
                  </h1>
                  <div style={{ fontSize: '0.725rem', color: '#64748b', fontWeight: '700' }}>
                    Proprietor: {companyDetails.legalName}
                  </div>
                </div>
              </div>
              <p style={{ fontSize: '0.775rem', color: '0f172a', maxWidth: '380px', lineHeight: '1.4', margin: '4px 0 0 0' }}>
                {companyDetails.address}
              </p>
              <p style={{ fontSize: '0.775rem', fontWeight: '700', color: '#0f172a', marginTop: '4px' }}>
                GSTIN: {companyDetails.gstin} | Ph: {companyDetails.phone}
              </p>
            </div>

            <div style={{ textAlign: 'right' }}>
              <h2 style={{ fontSize: '1.3rem', fontWeight: '800', color: '#002b36', margin: '0 0 6px 0', textTransform: 'uppercase' }}>
                TAX INVOICE
              </h2>
              <div style={{ fontSize: '0.85rem', fontWeight: '700' }}>
                Invoice No: <span style={{ color: '#b45309' }}>{invoice.invoiceNo}</span>
              </div>
              <div style={{ fontSize: '0.8rem', color: '#475569' }}>
                Date: {invoice.date}
              </div>
              <div style={{ fontSize: '0.8rem', color: '#475569', marginTop: '4px' }}>
                State Code: 24 (Gujarat)
              </div>
            </div>
          </div>

          {/* Customer Billed To Box */}
          <div style={{ backgroundColor: '#f8fafc', border: '1px solid #cbd5e1', borderRadius: '6px', padding: '14px', marginBottom: '20px', display: 'flex', justifyContent: 'space-between' }}>
            <div>
              <div style={{ fontSize: '0.7rem', textTransform: 'uppercase', letterSpacing: '0.5px', color: '#64748b', fontWeight: '700' }}>
                BILLED TO / BUYER DETAILS:
              </div>
              <div style={{ fontSize: '1rem', fontWeight: '800', color: '#0f172a', marginTop: '2px' }}>
                {invoice.customerName} {invoice.companyName ? `(${invoice.companyName})` : ''}
              </div>
              <div style={{ fontSize: '0.8rem', color: '#334155', marginTop: '2px' }}>
                {invoice.customerAddress || 'Surat, Gujarat'}
              </div>
              <div style={{ fontSize: '0.8rem', fontWeight: '700', color: '#0f172a', marginTop: '4px' }}>
                GSTIN: {invoice.customerGST || 'UNREGISTERED'} | Mobile: {invoice.mobile || 'N/A'}
              </div>
            </div>
            <div style={{ textAlign: 'right', fontSize: '0.8rem', color: '#475569' }}>
              <div>Place of Supply: <strong>{invoice.customerAddress?.includes('Gujarat') ? 'Gujarat (Intra-State)' : 'Inter-State'}</strong></div>
              <div>Payment Mode: <strong>{invoice.paymentMode || 'NEFT/Bank'}</strong></div>
            </div>
          </div>

          {/* Product Items Table */}
          <table style={{ width: '100%', borderCollapse: 'collapse', marginBottom: '20px', fontSize: '0.8rem' }}>
            <thead>
              <tr style={{ backgroundColor: '#f1f5f9', borderTop: '1px solid #0f172a', borderBottom: '1px solid #0f172a' }}>
                <th style={{ padding: '8px', textAlign: 'center' }}>Sr.</th>
                <th style={{ padding: '8px', textAlign: 'left' }}>Product Description</th>
                <th style={{ padding: '8px', textAlign: 'center' }}>HSN</th>
                <th style={{ padding: '8px', textAlign: 'center' }}>Colour / Size</th>
                <th style={{ padding: '8px', textAlign: 'right' }}>Qty</th>
                <th style={{ padding: '8px', textAlign: 'right' }}>Rate (₹)</th>
                <th style={{ padding: '8px', textAlign: 'right' }}>Taxable Amt (₹)</th>
                <th style={{ padding: '8px', textAlign: 'right' }}>GST %</th>
                <th style={{ padding: '8px', textAlign: 'right' }}>Total (₹)</th>
              </tr>
            </thead>
            <tbody>
              {invoice.items?.map((item, idx) => (
                <tr key={idx} style={{ borderBottom: '1px solid #e2e8f0' }}>
                  <td style={{ padding: '8px', textAlign: 'center' }}>{idx + 1}</td>
                  <td style={{ padding: '8px', fontWeight: '600' }}>
                    {item.productName}
                    <div style={{ fontSize: '0.725rem', color: '#64748b' }}>Code: {item.code}</div>
                  </td>
                  <td style={{ padding: '8px', textAlign: 'center' }}>{item.hsn}</td>
                  <td style={{ padding: '8px', textAlign: 'center' }}>{item.color} / <strong>{item.size}</strong></td>
                  <td style={{ padding: '8px', textAlign: 'right', fontWeight: '700' }}>{item.qty} pcs</td>
                  <td style={{ padding: '8px', textAlign: 'right' }}>₹{item.rate?.toFixed(2)}</td>
                  <td style={{ padding: '8px', textAlign: 'right' }}>₹{item.taxableAmt?.toFixed(2)}</td>
                  <td style={{ padding: '8px', textAlign: 'right' }}>{item.gstPercent}%</td>
                  <td style={{ padding: '8px', textAlign: 'right', fontWeight: '700' }}>₹{item.totalAmt?.toFixed(2)}</td>
                </tr>
              ))}
            </tbody>
          </table>

          {/* Tax Breakdown & Grand Total */}
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 340px', gap: '20px', borderTop: '2px solid #0f172a', paddingTop: '16px' }}>
            <div>
              <div style={{ fontSize: '0.75rem', color: '#64748b', fontWeight: '700', textTransform: 'uppercase' }}>
                Amount in Words:
              </div>
              <div style={{ fontSize: '0.85rem', fontWeight: '800', color: '#0f172a', marginTop: '2px', backgroundColor: '#f8fafc', padding: '8px 12px', borderLeft: '3px solid #b45309' }}>
                {numberToWords(invoice.grandTotal)}
              </div>

              <div style={{ marginTop: '16px', fontSize: '0.75rem', color: '#475569' }}>
                <div style={{ fontWeight: '700', color: '#002b36', marginBottom: '4px' }}>Bank Details for Payment:</div>
                <div>Bank Name: {companyDetails.bankName}</div>
                <div>Account No: <strong>{companyDetails.accountNo}</strong> | IFSC: <strong>{companyDetails.ifsc}</strong></div>
                <div>Branch: {companyDetails.branch}</div>
              </div>
            </div>

            <div style={{ backgroundColor: '#f8fafc', padding: '12px 16px', borderRadius: '6px', border: '1px solid #cbd5e1', fontSize: '0.825rem' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '4px' }}>
                <span>Gross MRP Subtotal:</span>
                <span>₹{(invoice.subtotal || (invoice.taxableTotal + (invoice.totalFixedDisc || 0) + (invoice.totalAddDisc || 0)))?.toFixed(2)}</span>
              </div>

              {(invoice.totalFixedDisc > 0 || invoice.fixedDiscountPercent > 0) && (
                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '4px', color: '#b45309' }}>
                  <span>Less: Fixed Trade Disc ({invoice.fixedDiscountPercent || 40}%):</span>
                  <span>-₹{(invoice.totalFixedDisc || 0)?.toFixed(2)}</span>
                </div>
              )}

              {(invoice.totalAddDisc > 0 || invoice.additionalDiscountPercent > 0) && (
                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '4px', color: '#2563eb' }}>
                  <span>Less: Additional Disc ({invoice.additionalDiscountPercent || 0}%):</span>
                  <span>-₹{(invoice.totalAddDisc || 0)?.toFixed(2)}</span>
                </div>
              )}

              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '4px', fontWeight: '700', borderTop: '1px dashed #cbd5e1', paddingTop: '4px' }}>
                <span>Taxable Amount:</span>
                <span>₹{invoice.taxableTotal?.toFixed(2)}</span>
              </div>

              {invoice.cgst > 0 && (
                <>
                  <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '4px' }}>
                    <span>CGST (6%):</span>
                    <span>₹{invoice.cgst?.toFixed(2)}</span>
                  </div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '4px' }}>
                    <span>SGST (6%):</span>
                    <span>₹{invoice.sgst?.toFixed(2)}</span>
                  </div>
                </>
              )}

              {invoice.igst > 0 && (
                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '4px' }}>
                  <span>IGST (12%):</span>
                  <span>₹{invoice.igst?.toFixed(2)}</span>
                </div>
              )}

              {invoice.roundOff !== 0 && (
                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '4px', color: '#64748b' }}>
                  <span>Round Off:</span>
                  <span>₹{invoice.roundOff?.toFixed(2)}</span>
                </div>
              )}

              <div style={{ borderTop: '2px solid #0f172a', paddingTop: '8px', marginTop: '6px', display: 'flex', justifyContent: 'space-between', fontSize: '1.1rem', fontWeight: '900', color: '#002b36' }}>
                <span>GRAND TOTAL:</span>
                <span>₹{invoice.grandTotal?.toFixed(2)}</span>
              </div>
            </div>
          </div>

          {/* Footer & Signature */}
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end', marginTop: '35px', paddingTop: '15px', borderTop: '1px solid #e2e8f0', fontSize: '0.725rem' }}>
            <div>
              <div style={{ fontWeight: '700', marginBottom: '2px' }}>Terms & Conditions:</div>
              {companyDetails.terms.map((t, i) => <div key={i}>{t}</div>)}
            </div>

            <div style={{ textAlign: 'center', minWidth: '200px' }}>
              <div style={{ height: '40px' }}></div>
              <div style={{ borderTop: '1px solid #0f172a', paddingTop: '4px', fontWeight: '800', color: '#002b36' }}>
                For {companyDetails.name}
              </div>
              <div style={{ fontSize: '0.675rem', color: '#64748b' }}>Authorized Signatory</div>
            </div>
          </div>

        </div>
      </div>
    </div>
  );
};
