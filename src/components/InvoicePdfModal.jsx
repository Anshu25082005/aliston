import React from 'react';
import { Printer, Download, Copy, XCircle, FileText } from 'lucide-react';
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

  const isGujarat = (invoice.customerAddress || '').toLowerCase().includes('gujarat');
  const items = invoice.items || [];
  const totalQty = items.reduce((acc, i) => acc + (i.qty || 0), 0);

  // Group by HSN
  const hsnMap = items.reduce((acc, item) => {
    const code = item.hsn || '62052000';
    if (!acc[code]) {
      acc[code] = {
        hsn: code,
        taxableValue: 0,
        cgstRate: isGujarat ? (item.gstPercent || 12) / 2 : 0,
        cgstAmt: 0,
        sgstRate: isGujarat ? (item.gstPercent || 12) / 2 : 0,
        sgstAmt: 0,
        igstRate: !isGujarat ? (item.gstPercent || 12) : 0,
        igstAmt: 0,
        totalTax: 0
      };
    }
    const taxable = item.taxableAmt || ((item.qty * item.rate) - (item.totalDiscVal || 0));
    const gstAmt = item.gstAmt || (taxable * ((item.gstPercent || 12) / 100));

    acc[code].taxableValue += taxable;
    if (isGujarat) {
      acc[code].cgstAmt += gstAmt / 2;
      acc[code].sgstAmt += gstAmt / 2;
    } else {
      acc[code].igstAmt += gstAmt;
    }
    acc[code].totalTax += gstAmt;
    return acc;
  }, {});

  const hsnList = Object.values(hsnMap);
  const totalTaxableValue = hsnList.reduce((a, b) => a + b.taxableValue, 0);
  const totalCgstAmt = hsnList.reduce((a, b) => a + b.cgstAmt, 0);
  const totalSgstAmt = hsnList.reduce((a, b) => a + b.sgstAmt, 0);
  const totalIgstAmt = hsnList.reduce((a, b) => a + b.igstAmt, 0);
  const grandTotalTax = hsnList.reduce((a, b) => a + b.totalTax, 0);

  // Minimum rows calculation for proper vertical fill (6 rows minimum)
  const minRows = 6;
  const emptyRowsCount = Math.max(0, minRows - items.length);

  return (
    <div className="modal-overlay">
      <div className="modal-content" style={{ maxWidth: '950px', backgroundColor: '#ffffff', color: '#000000', padding: 0 }}>
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
            <button onClick={onClose} style={{ background: 'none', color: '#ffffff', fontSize: '1.2rem', marginLeft: '12px', cursor: 'pointer' }}>✕</button>
          </div>
        </div>

        {/* PRINTABLE INVOICE DOCUMENT BODY */}
        <div id="printable-aliston-invoice" style={{
          padding: '20px',
          backgroundColor: '#ffffff',
          color: '#000000',
          fontFamily: "'Arial', 'Helvetica', sans-serif",
          fontSize: '11px',
          lineHeight: '1.3'
        }}>
          {/* Main Outer Box with Crisp Black Border */}
          <div style={{ border: '2px solid #000000' }}>

            {/* Top Title Banner */}
            <div style={{
              textAlign: 'center',
              fontWeight: 'bold',
              fontSize: '16px',
              padding: '6px',
              borderBottom: '2px solid #000000',
              letterSpacing: '1px',
              textTransform: 'uppercase',
              backgroundColor: '#ffffff'
            }}>
              TAX INVOICE
            </div>

            {/* Company Details & Invoice Info Header (Grid Split) */}
            <div style={{ display: 'grid', gridTemplateColumns: '1.4fr 1fr', borderBottom: '2px solid #000000' }}>
              {/* Company Info Left */}
              <div style={{ padding: '10px 14px', borderRight: '2px solid #000000' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '4px' }}>
                  <img src="/aliston-logo.jpg" alt="Logo" style={{ height: '48px', objectFit: 'contain' }} />
                  <div>
                    <h2 style={{ fontSize: '18px', fontWeight: '900', margin: 0, color: '#000000', textTransform: 'uppercase', letterSpacing: '0.5px' }}>
                      {companyDetails.name || 'SHREE RAM ENTERPRISE'}
                    </h2>
                    <div style={{ fontSize: '10px', color: '#333333', fontWeight: 'bold' }}>
                      Proprietor: {companyDetails.legalName || 'Shree Ram Enterprise'}
                    </div>
                  </div>
                </div>
                <div style={{ fontSize: '11px', marginTop: '4px', whiteSpace: 'pre-line' }}>
                  {companyDetails.address || '104. SWAMINARAYAN COMPLEX\nNEAR MADHUBAG, PANCHKUVA. AHMEDABAD'}
                </div>
                <div style={{ fontSize: '11px', fontWeight: 'bold', marginTop: '4px' }}>
                  MOB. NO: {companyDetails.phone || '8160959775, 9274835460'}
                </div>
              </div>

              {/* Invoice Metadata Right */}
              <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '11px' }}>
                <tbody>
                  <tr style={{ borderBottom: '1px solid #000000' }}>
                    <td style={{ padding: '5px 8px', fontWeight: 'bold', width: '45%', borderRight: '1px solid #000000' }}>Invoice No.</td>
                    <td style={{ padding: '5px 8px', fontWeight: 'bold', fontSize: '12px' }}>{invoice.invoiceNo}</td>
                  </tr>
                  <tr style={{ borderBottom: '1px solid #000000' }}>
                    <td style={{ padding: '5px 8px', fontWeight: 'bold', borderRight: '1px solid #000000' }}>Date</td>
                    <td style={{ padding: '5px 8px' }}>{invoice.date}</td>
                  </tr>
                  <tr style={{ borderBottom: '1px solid #000000' }}>
                    <td style={{ padding: '5px 8px', fontWeight: 'bold', borderRight: '1px solid #000000' }}>Place of Supply</td>
                    <td style={{ padding: '5px 8px' }}>{isGujarat ? 'Gujarat (24)' : 'Inter-State'}</td>
                  </tr>
                  <tr style={{ borderBottom: '1px solid #000000' }}>
                    <td style={{ padding: '5px 8px', fontWeight: 'bold', borderRight: '1px solid #000000' }}>Reverse Charge</td>
                    <td style={{ padding: '5px 8px' }}>No</td>
                  </tr>
                  <tr>
                    <td style={{ padding: '5px 8px', fontWeight: 'bold', borderRight: '1px solid #000000' }}>GSTIN/UIN</td>
                    <td style={{ padding: '5px 8px', fontWeight: 'bold' }}>{companyDetails.gstin || '24AFZFS5830A1ZT'}</td>
                  </tr>
                </tbody>
              </table>
            </div>

            {/* Bill To & Ship To Side-by-Side */}
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', borderBottom: '2px solid #000000' }}>
              {/* Bill To */}
              <div style={{ borderRight: '2px solid #000000' }}>
                <div style={{ padding: '4px 8px', fontWeight: 'bold', backgroundColor: '#ffffff', borderBottom: '1px solid #000000', textTransform: 'uppercase' }}>
                  Bill To
                </div>
                <div style={{ padding: '8px 10px', fontSize: '11px', minHeight: '60px' }}>
                  <div style={{ fontWeight: 'bold', fontSize: '12px' }}>
                    {invoice.customerName} {invoice.companyName ? `(${invoice.companyName})` : ''}
                  </div>
                  <div style={{ marginTop: '2px' }}>{invoice.customerAddress || 'BORSAD . 388540'}</div>
                  <div style={{ marginTop: '4px', fontWeight: 'bold' }}>
                    GSTIN/UIN: {invoice.customerGST || '24ADGPK5120J1ZT'}
                  </div>
                  {invoice.mobile && <div>Mob: {invoice.mobile}</div>}
                </div>
              </div>

              {/* Ship To */}
              <div>
                <div style={{ padding: '4px 8px', fontWeight: 'bold', backgroundColor: '#ffffff', borderBottom: '1px solid #000000', textTransform: 'uppercase' }}>
                  Ship To
                </div>
                <div style={{ padding: '8px 10px', fontSize: '11px', minHeight: '60px' }}>
                  <div style={{ fontWeight: 'bold', fontSize: '12px' }}>
                    {invoice.customerName} {invoice.companyName ? `(${invoice.companyName})` : ''}
                  </div>
                  <div style={{ marginTop: '2px' }}>{invoice.customerAddress || 'BORSAD . 388540'}</div>
                  <div style={{ marginTop: '4px', fontWeight: 'bold' }}>
                    GSTIN/UIN: {invoice.customerGST || '24ADGPK5120J1ZT'}
                  </div>
                </div>
              </div>
            </div>

            {/* Transport Info Bar */}
            <div style={{ padding: '4px 10px', fontWeight: 'bold', borderBottom: '2px solid #000000', backgroundColor: '#ffffff', fontSize: '11px' }}>
              TRANSPORT: <span style={{ fontWeight: 'normal' }}>{invoice.transport || 'DHARA TRANSPORTS'}</span>
            </div>

            {/* Product Items Table */}
            <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '11px' }}>
              <thead>
                <tr style={{ backgroundColor: '#ffffff', borderBottom: '2px solid #000000' }}>
                  <th style={{ borderRight: '1px solid #000000', padding: '6px 4px', textAlign: 'center', width: '40px' }}>Sl No.</th>
                  <th style={{ borderRight: '1px solid #000000', padding: '6px 8px', textAlign: 'left' }}>Description of Goods</th>
                  <th style={{ borderRight: '1px solid #000000', padding: '6px 6px', textAlign: 'center', width: '80px' }}>HSN/SAC</th>
                  <th style={{ borderRight: '1px solid #000000', padding: '6px 6px', textAlign: 'center', width: '50px' }}>Size</th>
                  <th style={{ borderRight: '1px solid #000000', padding: '6px 6px', textAlign: 'center', width: '60px' }}>Color</th>
                  <th style={{ borderRight: '1px solid #000000', padding: '6px 6px', textAlign: 'right', width: '70px' }}>Qty. (Nos)</th>
                  <th style={{ borderRight: '1px solid #000000', padding: '6px 6px', textAlign: 'right', width: '75px' }}>Rate (₹)</th>
                  <th style={{ borderRight: '1px solid #000000', padding: '6px 6px', textAlign: 'right', width: '80px' }}>Disc. (%)</th>
                  <th style={{ padding: '6px 8px', textAlign: 'right', width: '95px' }}>Amount (₹)</th>
                </tr>
              </thead>
              <tbody>
                {items.map((item, idx) => {
                  const gross = (item.qty || 0) * (item.rate || 0);
                  const discText = item.discountPercent > 0 
                    ? `${item.discountPercent}%` 
                    : (invoice.fixedDiscountPercent ? `${invoice.fixedDiscountPercent}%+${invoice.additionalDiscountPercent || 0}%` : '40%+10%');

                  return (
                    <tr key={idx} style={{ borderBottom: '1px solid #000000' }}>
                      <td style={{ borderRight: '1px solid #000000', padding: '6px 4px', textAlign: 'center' }}>{idx + 1}</td>
                      <td style={{ borderRight: '1px solid #000000', padding: '6px 8px', fontWeight: 'bold' }}>
                        {item.code ? `${item.code}- ` : ''}{item.productName || 'ALISTON LINEN SHIRTS'}
                      </td>
                      <td style={{ borderRight: '1px solid #000000', padding: '6px 6px', textAlign: 'center' }}>{item.hsn || '62052000'}</td>
                      <td style={{ borderRight: '1px solid #000000', padding: '6px 6px', textAlign: 'center', fontWeight: 'bold' }}>{item.size || 'M'}</td>
                      <td style={{ borderRight: '1px solid #000000', padding: '6px 6px', textAlign: 'center' }}>{item.color || '6'}</td>
                      <td style={{ borderRight: '1px solid #000000', padding: '6px 6px', textAlign: 'right', fontWeight: 'bold' }}>{(item.qty || 0).toFixed(2)}</td>
                      <td style={{ borderRight: '1px solid #000000', padding: '6px 6px', textAlign: 'right' }}>{(item.rate || 0).toFixed(2)}</td>
                      <td style={{ borderRight: '1px solid #000000', padding: '6px 6px', textAlign: 'right', fontWeight: 'bold' }}>{discText}</td>
                      <td style={{ padding: '6px 8px', textAlign: 'right', fontWeight: 'bold' }}>{(item.taxableAmt || gross).toFixed(2)}</td>
                    </tr>
                  );
                })}

                {/* Blank fill rows for traditional invoice height */}
                {Array.from({ length: emptyRowsCount }).map((_, i) => (
                  <tr key={`empty-${i}`} style={{ height: '24px', borderBottom: '1px solid #000000' }}>
                    <td style={{ borderRight: '1px solid #000000' }}></td>
                    <td style={{ borderRight: '1px solid #000000' }}></td>
                    <td style={{ borderRight: '1px solid #000000' }}></td>
                    <td style={{ borderRight: '1px solid #000000' }}></td>
                    <td style={{ borderRight: '1px solid #000000' }}></td>
                    <td style={{ borderRight: '1px solid #000000' }}></td>
                    <td style={{ borderRight: '1px solid #000000' }}></td>
                    <td style={{ borderRight: '1px solid #000000' }}></td>
                    <td></td>
                  </tr>
                ))}

                {/* Items Total Row */}
                <tr style={{ borderTop: '2px solid #000000', borderBottom: '2px solid #000000', fontWeight: 'bold' }}>
                  <td colSpan={5} style={{ borderRight: '1px solid #000000', padding: '6px 8px', textAlign: 'left' }}>Total</td>
                  <td style={{ borderRight: '1px solid #000000', padding: '6px 6px', textAlign: 'right' }}>{totalQty.toFixed(2)}</td>
                  <td style={{ borderRight: '1px solid #000000' }}></td>
                  <td style={{ borderRight: '1px solid #000000' }}></td>
                  <td style={{ padding: '6px 8px', textAlign: 'right', fontSize: '12px' }}>
                    ₹{(invoice.taxableTotal || items.reduce((a, b) => a + (b.taxableAmt || 0), 0)).toFixed(2)}
                  </td>
                </tr>
              </tbody>
            </table>

            {/* HSN / SAC Tax Summary Matrix Table */}
            <div style={{ borderBottom: '2px solid #000000' }}>
              <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '11px' }}>
                <thead>
                  <tr style={{ borderBottom: '1px solid #000000', backgroundColor: '#ffffff' }}>
                    <th style={{ borderRight: '1px solid #000000', padding: '5px', textAlign: 'center', width: '110px' }}>HSN/SAC</th>
                    <th style={{ borderRight: '1px solid #000000', padding: '5px', textAlign: 'right', width: '110px' }}>Taxable Value</th>
                    {isGujarat ? (
                      <>
                        <th style={{ borderRight: '1px solid #000000', padding: '5px', textAlign: 'center', width: '60px' }}>CGST Rate</th>
                        <th style={{ borderRight: '1px solid #000000', padding: '5px', textAlign: 'right', width: '70px' }}>CGST Amount</th>
                        <th style={{ borderRight: '1px solid #000000', padding: '5px', textAlign: 'center', width: '60px' }}>SGST Rate</th>
                        <th style={{ borderRight: '1px solid #000000', padding: '5px', textAlign: 'right', width: '70px' }}>SGST Amount</th>
                      </>
                    ) : (
                      <>
                        <th style={{ borderRight: '1px solid #000000', padding: '5px', textAlign: 'center', width: '80px' }}>IGST Rate</th>
                        <th style={{ borderRight: '1px solid #000000', padding: '5px', textAlign: 'right', width: '100px' }}>IGST Amount</th>
                      </>
                    )}
                    <th style={{ borderRight: '1px solid #000000', padding: '5px', textAlign: 'right', width: '80px' }}>Total Tax</th>
                    <th style={{ padding: '5px', textAlign: 'center', fontWeight: 'bold' }}>Invoice Total</th>
                  </tr>
                </thead>
                <tbody>
                  {hsnList.map((h, i) => (
                    <tr key={i} style={{ borderBottom: '1px solid #000000' }}>
                      <td style={{ borderRight: '1px solid #000000', padding: '5px', textAlign: 'center' }}>{h.hsn}</td>
                      <td style={{ borderRight: '1px solid #000000', padding: '5px', textAlign: 'right' }}>{h.taxableValue.toFixed(2)}</td>
                      {isGujarat ? (
                        <>
                          <td style={{ borderRight: '1px solid #000000', padding: '5px', textAlign: 'center' }}>{h.cgstRate}%</td>
                          <td style={{ borderRight: '1px solid #000000', padding: '5px', textAlign: 'right' }}>{h.cgstAmt.toFixed(2)}</td>
                          <td style={{ borderRight: '1px solid #000000', padding: '5px', textAlign: 'center' }}>{h.sgstRate}%</td>
                          <td style={{ borderRight: '1px solid #000000', padding: '5px', textAlign: 'right' }}>{h.sgstAmt.toFixed(2)}</td>
                        </>
                      ) : (
                        <>
                          <td style={{ borderRight: '1px solid #000000', padding: '5px', textAlign: 'center' }}>{h.igstRate}%</td>
                          <td style={{ borderRight: '1px solid #000000', padding: '5px', textAlign: 'right' }}>{h.igstAmt.toFixed(2)}</td>
                        </>
                      )}
                      <td style={{ borderRight: '1px solid #000000', padding: '5px', textAlign: 'right', fontWeight: 'bold' }}>{h.totalTax.toFixed(2)}</td>
                      {i === 0 && (
                        <td rowSpan={hsnList.length + 1} style={{ padding: '10px', textAlign: 'center', verticalAlign: 'middle', backgroundColor: '#ffffff' }}>
                          <div style={{ fontSize: '18px', fontWeight: '900', color: '#000000' }}>
                            ₹{invoice.grandTotal?.toFixed(2)}
                          </div>
                        </td>
                      )}
                    </tr>
                  ))}
                  {/* Total HSN Row */}
                  <tr style={{ fontWeight: 'bold', backgroundColor: '#ffffff' }}>
                    <td style={{ borderRight: '1px solid #000000', padding: '5px', textAlign: 'center' }}>Total</td>
                    <td style={{ borderRight: '1px solid #000000', padding: '5px', textAlign: 'right' }}>{totalTaxableValue.toFixed(2)}</td>
                    {isGujarat ? (
                      <>
                        <td style={{ borderRight: '1px solid #000000' }}></td>
                        <td style={{ borderRight: '1px solid #000000', padding: '5px', textAlign: 'right' }}>{totalCgstAmt.toFixed(2)}</td>
                        <td style={{ borderRight: '1px solid #000000' }}></td>
                        <td style={{ borderRight: '1px solid #000000', padding: '5px', textAlign: 'right' }}>{totalSgstAmt.toFixed(2)}</td>
                      </>
                    ) : (
                      <>
                        <td style={{ borderRight: '1px solid #000000' }}></td>
                        <td style={{ borderRight: '1px solid #000000', padding: '5px', textAlign: 'right' }}>{totalIgstAmt.toFixed(2)}</td>
                      </>
                    )}
                    <td style={{ borderRight: '1px solid #000000', padding: '5px', textAlign: 'right' }}>{grandTotalTax.toFixed(2)}</td>
                  </tr>
                </tbody>
              </table>
            </div>

            {/* Total Invoice Value in words */}
            <div style={{ borderBottom: '2px solid #000000', padding: '6px 10px' }}>
              <div style={{ fontWeight: 'bold', fontSize: '11px' }}>Total Invoice Value (in words)</div>
              <div style={{ fontWeight: '900', fontSize: '12px', textTransform: 'capitalize', marginTop: '2px' }}>
                {invoice.amountInWords || numberToWords(invoice.grandTotal)}
              </div>
            </div>

            {/* Bank Details & Signature Section */}
            <div style={{ display: 'grid', gridTemplateColumns: '1.3fr 1fr' }}>
              {/* Left Side: Bank Details & Terms */}
              <div style={{ borderRight: '2px solid #000000', padding: '8px 10px', fontSize: '11px' }}>
                <div style={{ fontWeight: 'bold', textDecoration: 'underline', marginBottom: '4px' }}>Company's Bank Details</div>
                <table style={{ width: '100%', fontSize: '11px', borderCollapse: 'collapse' }}>
                  <tbody>
                    <tr>
                      <td style={{ padding: '2px 0', width: '90px', fontWeight: 'bold' }}>Bank Name</td>
                      <td style={{ padding: '2px 0' }}>: {companyDetails.bankName || 'NUTAN NAGRIK SHAHKARI BANK LTD'}</td>
                    </tr>
                    <tr>
                      <td style={{ padding: '2px 0', fontWeight: 'bold' }}>A/c No.</td>
                      <td style={{ padding: '2px 0', fontWeight: 'bold' }}>: {companyDetails.accountNo || '5111500003616'}</td>
                    </tr>
                    <tr>
                      <td style={{ padding: '2px 0', fontWeight: 'bold' }}>IFSC Code</td>
                      <td style={{ padding: '2px 0' }}>: {companyDetails.ifsc || 'NNSB0128005'}</td>
                    </tr>
                    <tr>
                      <td style={{ padding: '2px 0', fontWeight: 'bold' }}>Branch</td>
                      <td style={{ padding: '2px 0' }}>: {companyDetails.branch || 'ASHRAM ROAD AHMEDABAD'}</td>
                    </tr>
                  </tbody>
                </table>

                <div style={{ marginTop: '10px', borderTop: '1px solid #000000', paddingTop: '6px' }}>
                  <div style={{ fontWeight: 'bold', marginBottom: '2px' }}>Terms & Conditions</div>
                  <div>1. Goods once sold will not be taken back.</div>
                  <div>2. Interest @ 24% p.a. will be charged on overdue A/c.</div>
                </div>
              </div>

              {/* Right Side: Signatures & E. & O.E. */}
              <div style={{ padding: '8px 10px', display: 'flex', flexDirection: 'column', justifyContent: 'space-between' }}>
                <div style={{ textAlign: 'right', fontWeight: 'bold', fontSize: '12px' }}>
                  for {companyDetails.name || 'SHREE RAM ENTERPRISE'}
                </div>

                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end', marginTop: '45px', fontSize: '11px' }}>
                  <div style={{ textAlign: 'center', borderTop: '1px solid #000000', paddingTop: '2px', width: '140px' }}>
                    Receiver's Signature
                  </div>
                  <div style={{ textAlign: 'center', borderTop: '1px solid #000000', paddingTop: '2px', width: '140px', fontWeight: 'bold' }}>
                    Authorised Signatory
                  </div>
                </div>

                <div style={{ textAlign: 'right', fontSize: '10px', fontWeight: 'bold', marginTop: '6px' }}>
                  E. & O.E.
                </div>
              </div>
            </div>

          </div>

          {/* Computer Generated Disclaimer Footer */}
          <div style={{ textAlign: 'center', fontSize: '10px', marginTop: '8px', fontWeight: 'bold' }}>
            ** This is a Computer Generated Invoice **
          </div>

        </div>
      </div>
    </div>
  );
};
