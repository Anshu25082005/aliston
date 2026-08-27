import React, { useState, useEffect } from 'react';
import { Barcode as BarcodeIcon, Printer, Search, CheckCircle2 } from 'lucide-react';
import { getData } from '../db/storage';
import { generateBarcodeSvg } from '../utils/barcodeHelper';

export const BarcodeModal = ({ onClose, onSelectProduct }) => {
  const products = getData('PRODUCTS') || [];
  const [selectedProductId, setSelectedProductId] = useState(products[0]?.id || '');
  const [scanInput, setScanInput] = useState('');
  const [scannedProduct, setScannedProduct] = useState(null);

  const selectedProd = products.find(p => p.id === selectedProductId);

  useEffect(() => {
    if (selectedProd && selectedProd.barcode) {
      generateBarcodeSvg('barcode-svg-element', selectedProd.barcode);
    }
  }, [selectedProductId]);

  const handleScanSubmit = (e) => {
    e.preventDefault();
    const found = products.find(p => p.barcode === scanInput.trim() || p.code === scanInput.trim() || p.sku === scanInput.trim());
    if (found) {
      setScannedProduct(found);
      setSelectedProductId(found.id);
    } else {
      alert('No product found matching barcode/code: ' + scanInput);
    }
  };

  const handlePrintBarcodeTag = () => {
    const printWin = window.open('', '_blank', 'height=600,width=800');
    if (!printWin) return;
    const svgElem = document.getElementById('barcode-svg-element');
    const svgHtml = svgElem ? svgElem.outerHTML : '';

    printWin.document.write(`
      <!DOCTYPE html>
      <html>
        <head>
          <title>ALISTON Barcode Tag</title>
          <style>
            body { font-family: sans-serif; display: flex; flex-wrap: wrap; gap: 15px; padding: 20px; }
            .tag { border: 1px dashed #000; width: 180px; padding: 10px; text-align: center; font-size: 11px; }
            .tag h4 { margin: 0 0 4px 0; font-size: 12px; }
          </style>
        </head>
        <body>
          ${Array(12).fill(0).map(() => `
            <div class="tag">
              <h4>ALISTON MEN'S WEAR</h4>
              <div>${selectedProd?.name || ''}</div>
              <div style="font-weight:bold;margin:4px 0;">MRP: ₹${selectedProd?.finalSellingPrice?.toFixed(2) || ''}</div>
              ${svgHtml}
            </div>
          `).join('')}
          <script>
            window.onload = function() { window.print(); window.close(); };
          </script>
        </body>
      </html>
    `);
    printWin.document.close();
  };

  return (
    <div className="modal-overlay">
      <div className="modal-content" style={{ maxWidth: '550px' }}>
        <div className="modal-header">
          <h3 style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <BarcodeIcon size={20} color="var(--accent-gold)" />
            ALISTON Barcode Generator & Scanner
          </h3>
          <button onClick={onClose} style={{ background: 'none', color: 'var(--text-muted)' }}>✕</button>
        </div>

        <div className="modal-body" style={{ display: 'flex', flexDirection: 'column', gap: '18px' }}>
          {/* Scan Input Simulation */}
          <form onSubmit={handleScanSubmit} style={{ display: 'flex', gap: '8px' }}>
            <input 
              type="text" 
              placeholder="Scan or type barcode (e.g. 8901234567011 or AL-SH-101)..."
              value={scanInput}
              onChange={(e) => setScanInput(e.target.value)}
              style={{ flex: 1 }}
            />
            <button type="submit" className="btn btn-primary">
              <Search size={14} /> Scan Barcode
            </button>
          </form>

          {/* Product Select Dropdown */}
          <div>
            <label style={{ fontSize: '0.775rem', color: 'var(--text-secondary)' }}>Select Product to Preview & Print Barcode</label>
            <select 
              style={{ width: '100%', marginTop: '4px' }}
              value={selectedProductId}
              onChange={(e) => setSelectedProductId(e.target.value)}
            >
              {products.map(p => <option key={p.id} value={p.id}>{p.code} - {p.name} ({p.barcode})</option>)}
            </select>
          </div>

          {/* Barcode Render Card */}
          {selectedProd && (
            <div className="card" style={{ backgroundColor: '#ffffff', color: '#000000', textAlign: 'center', padding: '20px' }}>
              <div style={{ fontSize: '0.8rem', fontWeight: '800', textTransform: 'uppercase', letterSpacing: '1px' }}>ALISTON GARMENTS</div>
              <div style={{ fontSize: '0.9rem', fontWeight: '700', margin: '4px 0' }}>{selectedProd.name}</div>
              <div style={{ fontSize: '0.75rem', color: '#475569' }}>Fabric: {selectedProd.fabric} | HSN: {selectedProd.hsnCode}</div>
              
              <div style={{ margin: '14px 0', display: 'flex', justifyContent: 'center' }}>
                <svg id="barcode-svg-element"></svg>
              </div>

              <div style={{ fontSize: '1.1rem', fontWeight: '900', color: '#002b36' }}>
                MRP: ₹{selectedProd.finalSellingPrice?.toFixed(2)} (Incl GST)
              </div>
            </div>
          )}
        </div>

        <div className="modal-footer">
          <button type="button" className="btn btn-secondary" onClick={onClose}>Close</button>
          <button type="button" className="btn btn-primary" onClick={handlePrintBarcodeTag}>
            <Printer size={16} /> Print Barcode Tags (Sheet of 12)
          </button>
        </div>
      </div>
    </div>
  );
};
