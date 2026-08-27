import React, { useState, useEffect } from 'react';
import { 
  Calculator, 
  Plus, 
  Trash2, 
  Save, 
  Scissors, 
  DollarSign, 
  Layers, 
  Info, 
  Percent,
  CheckCircle2,
  FileSpreadsheet,
  Shirt,
  Tag,
  ArrowRight,
  TrendingUp
} from 'lucide-react';
import { getData, saveData } from '../db/storage';
import { exportToExcel } from '../utils/excelExporter';

export const BomCostingView = () => {
  const products = getData('PRODUCTS') || [];
  const materials = getData('MATERIALS') || [];
  const boms = getData('BOMS') || {};

  const [selectedProductId, setSelectedProductId] = useState(products[0]?.id || '');
  const [activeTab, setActiveTab] = useState('materials'); // 'materials' | 'overheads' | 'margin' | 'sheet'

  // BOM State - Fabric
  const [fabric, setFabric] = useState({
    materialId: 'mat-1',
    type: '100% French Linen',
    name: 'Linen Pure 60 Lea',
    color: 'Royal Blue',
    supplier: 'Vardhman Textiles Ltd',
    rate: 350,
    consumption: 1.60,
    unit: 'metre'
  });

  // Buttons (1 Gross = 144 Buttons)
  const [button, setButton] = useState({
    materialId: 'mat-btn-1',
    type: 'Natural Pearl',
    size: '18L',
    color: 'White Pearl',
    supplier: 'Supreme Trims',
    rate: 200, // per Gross
    quantity: 0.0833, // 12 buttons = 12/144 = 0.0833 Gross
    unit: 'Gross'
  });

  // Collar & Cuff
  const [collar, setCollar] = useState({
    materialId: 'mat-col-1',
    type: 'Cutaway Stiff Collar',
    material: 'Fusible Interlining',
    supplier: 'Supreme Trims',
    qty: 1,
    rate: 25
  });

  const [cuff, setCuff] = useState({
    materialId: 'mat-cuf-1',
    type: 'Chiseled Double Cuff',
    material: 'Fusible Interlining',
    supplier: 'Supreme Trims',
    qty: 1,
    rate: 18
  });

  // 7 Mandatory ALISTON Labels
  const [labels, setLabels] = useState({
    mainLabel: { name: 'ALISTON Main Woven Neck Label', supplier: 'Royal Labels', rate: 4.5, qty: 1 },
    linenLuxuryLabel: { name: 'ALISTON Linen Luxury Edition Gold Tag', supplier: 'Royal Labels', rate: 6.0, qty: 1 },
    sizeLabel: { name: 'Woven Size Label S-3XL', supplier: 'Royal Labels', rate: 1.2, qty: 1 },
    washCareLabel: { name: 'Wash Care & Composition Label', supplier: 'Royal Labels', rate: 1.8, qty: 1 },
    brandLabel: { name: 'Brand Crest Side Tab Label', supplier: 'Royal Labels', rate: 2.5, qty: 1 },
    barcodeLabel: { name: 'Self-Adhesive EAN Barcode Tag', supplier: 'Royal Labels', rate: 0.8, qty: 1 },
    otherLabel: { name: 'Hangtag & Premium Ribbon', supplier: 'Royal Labels', rate: 5.0, qty: 1 }
  });

  // Custom materials
  const [otherMaterials, setOtherMaterials] = useState([
    { id: 'om-1', name: 'Gutermann Sewing Thread', rate: 5.0, qty: 1, unit: 'shirt' },
    { id: 'om-2', name: 'Packaging Polybag 100 Micron', rate: 3.5, qty: 1, unit: 'piece' },
    { id: 'om-3', name: 'Collar Stay & Plastic Butterfly', rate: 4.0, qty: 1, unit: 'set' }
  ]);

  // Manufacturing Expenses / Overheads
  const [mfgExpenses, setMfgExpenses] = useState({
    stitchingCost: 75.00,
    cuttingCost: 20.00,
    washingCost: 15.00,
    ironingCost: 10.00,
    finishingCost: 8.00,
    packingCost: 5.00,
    transportation: 6.00,
    labour: 10.00,
    electricity: 3.00,
    otherExpense: 0.00
  });

  // Margin Calculator State
  const [marginPercent, setMarginPercent] = useState(35);
  const [manualSellingPrice, setManualSellingPrice] = useState('');
  const [gstPercent, setGstPercent] = useState(12);
  const [toastMsg, setToastMsg] = useState('');

  // Load existing BOM if saved
  useEffect(() => {
    if (boms[selectedProductId]) {
      const saved = boms[selectedProductId];
      if (saved.fabric) setFabric(saved.fabric);
      if (saved.button) setButton(saved.button);
      if (saved.collar) setCollar(saved.collar);
      if (saved.cuff) setCuff(saved.cuff);
      if (saved.labels) setLabels(saved.labels);
      if (saved.otherMaterials) setOtherMaterials(saved.otherMaterials);
      if (saved.manufacturingExpenses) setMfgExpenses(saved.manufacturingExpenses);
    }
  }, [selectedProductId]);

  // Calculations
  const fabricCost = (parseFloat(fabric.rate) || 0) * (parseFloat(fabric.consumption) || 0);
  const buttonCost = (parseFloat(button.rate) || 0) * (parseFloat(button.quantity) || 0);
  const collarCost = (parseFloat(collar.rate) || 0) * (parseFloat(collar.qty) || 0);
  const cuffCost = (parseFloat(cuff.rate) || 0) * (parseFloat(cuff.qty) || 0);

  const labelsCost = Object.values(labels).reduce((sum, l) => sum + ((parseFloat(l.rate) || 0) * (parseFloat(l.qty) || 0)), 0);
  const otherMatCost = otherMaterials.reduce((sum, om) => sum + ((parseFloat(om.rate) || 0) * (parseFloat(om.qty) || 0)), 0);

  const totalDirectMaterialCost = fabricCost + buttonCost + collarCost + cuffCost + labelsCost + otherMatCost;
  const totalMfgCost = Object.values(mfgExpenses).reduce((sum, val) => sum + (parseFloat(val) || 0), 0);
  const totalCostPerShirt = totalDirectMaterialCost + totalMfgCost;

  // Margin & Selling Price
  const marginAmount = manualSellingPrice !== '' 
    ? (parseFloat(manualSellingPrice) - totalCostPerShirt)
    : (totalCostPerShirt * (marginPercent / 100));

  const sellingPriceExclGst = manualSellingPrice !== ''
    ? parseFloat(manualSellingPrice) || 0
    : totalCostPerShirt + marginAmount;

  const calculatedMarginPct = manualSellingPrice !== '' && totalCostPerShirt > 0
    ? (((sellingPriceExclGst - totalCostPerShirt) / totalCostPerShirt) * 100)
    : marginPercent;

  const gstAmount = sellingPriceExclGst * (gstPercent / 100);
  const finalSellingPrice = sellingPriceExclGst + gstAmount;

  const handleAddOtherMaterial = () => {
    setOtherMaterials([...otherMaterials, { id: 'om-' + Date.now(), name: 'New Material', rate: 10, qty: 1, unit: 'piece' }]);
  };

  const handleRemoveOtherMaterial = (id) => {
    setOtherMaterials(otherMaterials.filter(om => om.id !== id));
  };

  const handleSaveBOM = () => {
    const bomPayload = {
      productId: selectedProductId,
      fabric: { ...fabric, cost: fabricCost },
      button: { ...button, cost: buttonCost },
      collar: { ...collar, cost: collarCost },
      cuff: { ...cuff, cost: cuffCost },
      labels,
      otherMaterials,
      manufacturingExpenses: mfgExpenses,
      costing: {
        totalDirectMaterialCost,
        totalMfgCost,
        totalCostPerShirt,
        marginPercent: parseFloat(calculatedMarginPct.toFixed(2)),
        marginAmount,
        sellingPriceExclGst,
        gstPercent,
        finalSellingPrice
      }
    };

    // Update BOMS
    const currentBoms = getData('BOMS') || {};
    currentBoms[selectedProductId] = bomPayload;
    saveData('BOMS', currentBoms);

    // Update Product Cost Price & Selling Price in Products Master
    const currentProducts = getData('PRODUCTS') || [];
    const updatedProducts = currentProducts.map(p => {
      if (p.id === selectedProductId) {
        return {
          ...p,
          costPrice: parseFloat(totalCostPerShirt.toFixed(2)),
          marginPercent: parseFloat(calculatedMarginPct.toFixed(2)),
          marginAmount: parseFloat(marginAmount.toFixed(2)),
          sellingPrice: parseFloat(sellingPriceExclGst.toFixed(2)),
          finalSellingPrice: parseFloat(finalSellingPrice.toFixed(2))
        };
      }
      return p;
    });
    saveData('PRODUCTS', updatedProducts);

    setToastMsg('BOM & Costing saved successfully! Product Master updated.');
    setTimeout(() => setToastMsg(''), 3000);
  };

  const handleExportCostingSheet = () => {
    const rows = [
      { 'Component': 'Fabric Cost', 'Specification': `${fabric.name} (${fabric.color})`, 'Rate/Unit': `₹${fabric.rate}`, 'Qty': `${fabric.consumption} m`, 'Total Cost (₹)': fabricCost.toFixed(2) },
      { 'Component': 'Button Cost', 'Specification': `${button.type} (${button.size})`, 'Rate/Unit': `₹${button.rate}/Gross`, 'Qty': `${button.quantity} Gross`, 'Total Cost (₹)': buttonCost.toFixed(2) },
      { 'Component': 'Collar Interlining', 'Specification': collar.type, 'Rate/Unit': `₹${collar.rate}`, 'Qty': '1 pc', 'Total Cost (₹)': collarCost.toFixed(2) },
      { 'Component': 'Cuff Interlining', 'Specification': cuff.type, 'Rate/Unit': `₹${cuff.rate}`, 'Qty': '1 pc', 'Total Cost (₹)': cuffCost.toFixed(2) },
      { 'Component': '7 ALISTON Labels', 'Specification': 'Main, Size, Wash, Gold, Barcode, etc.', 'Rate/Unit': '-', 'Qty': '7 Labels', 'Total Cost (₹)': labelsCost.toFixed(2) },
      { 'Component': 'Other Trims & Packaging', 'Specification': 'Thread, Polybag, Clips', 'Rate/Unit': '-', 'Qty': 'Trims', 'Total Cost (₹)': otherMatCost.toFixed(2) },
      { 'Component': 'DIRECT MATERIAL TOTAL', 'Specification': 'Subtotal Raw Materials', 'Rate/Unit': '-', 'Qty': '-', 'Total Cost (₹)': totalDirectMaterialCost.toFixed(2) },
      { 'Component': 'Stitching & Labour Overhead', 'Specification': 'Master Tailor Stitching', 'Rate/Unit': `₹${mfgExpenses.stitchingCost}`, 'Qty': '1 Shirt', 'Total Cost (₹)': mfgExpenses.stitchingCost.toFixed(2) },
      { 'Component': 'Cutting & Patterning', 'Specification': 'Master Cutter', 'Rate/Unit': `₹${mfgExpenses.cuttingCost}`, 'Qty': '1 Shirt', 'Total Cost (₹)': mfgExpenses.cuttingCost.toFixed(2) },
      { 'Component': 'Washing & Bio-wash', 'Specification': 'Garment Washing', 'Rate/Unit': `₹${mfgExpenses.washingCost}`, 'Qty': '1 Shirt', 'Total Cost (₹)': mfgExpenses.washingCost.toFixed(2) },
      { 'Component': 'Ironing, Packing & Transport', 'Specification': 'Finishing & Delivery', 'Rate/Unit': '-', 'Qty': '-', 'Total Cost (₹)': (mfgExpenses.ironingCost + mfgExpenses.finishingCost + mfgExpenses.packingCost + mfgExpenses.transportation + mfgExpenses.labour + mfgExpenses.electricity).toFixed(2) },
      { 'Component': 'TOTAL MANUFACTURING OVERHEADS', 'Specification': 'Subtotal Overheads', 'Rate/Unit': '-', 'Qty': '-', 'Total Cost (₹)': totalMfgCost.toFixed(2) },
      { 'Component': 'NET TOTAL COST PER SHIRT', 'Specification': 'Raw Material + Overheads', 'Rate/Unit': '-', 'Qty': '-', 'Total Cost (₹)': totalCostPerShirt.toFixed(2) },
      { 'Component': 'PROFIT MARGIN', 'Specification': `${calculatedMarginPct.toFixed(1)}% Profit Margin`, 'Rate/Unit': '-', 'Qty': '-', 'Total Cost (₹)': marginAmount.toFixed(2) },
      { 'Component': 'SELLING PRICE (EXCL. GST)', 'Specification': 'Base Wholesale Selling Price', 'Rate/Unit': '-', 'Qty': '-', 'Total Cost (₹)': sellingPriceExclGst.toFixed(2) },
      { 'Component': 'GST AMOUNT', 'Specification': `${gstPercent}% GST`, 'Rate/Unit': '-', 'Qty': '-', 'Total Cost (₹)': gstAmount.toFixed(2) },
      { 'Component': 'FINAL SELLING PRICE (INCL. GST)', 'Specification': 'Invoice Customer Price', 'Rate/Unit': '-', 'Qty': '-', 'Total Cost (₹)': finalSellingPrice.toFixed(2) }
    ];
    exportToExcel(rows, `ALISTON_BOM_Costing_${selectedProduct?.code || 'Shirt'}.xlsx`);
  };

  const selectedProduct = products.find(p => p.id === selectedProductId);

  return (
    <div style={{ padding: '24px', display: 'flex', flexDirection: 'column', gap: '20px' }}>
      {/* Header */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '12px' }}>
        <div>
          <h2 style={{ fontSize: '1.4rem', fontWeight: '800', display: 'flex', alignItems: 'center', gap: '10px' }}>
            <Calculator size={22} color="var(--accent-gold)" /> ALISTON Shirt BOM & Costing Engine
          </h2>
          <p style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>
            Calculate raw materials, stitching overheads, profit margins, and final selling prices effortlessly
          </p>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
          {toastMsg && (
            <div style={{ padding: '8px 14px', borderRadius: '6px', backgroundColor: 'rgba(35, 134, 54, 0.2)', color: '#3fb950', fontSize: '0.8rem', display: 'flex', alignItems: 'center', gap: '6px' }}>
              <CheckCircle2 size={16} /> {toastMsg}
            </div>
          )}
          <button className="btn btn-secondary" onClick={handleExportCostingSheet}>
            <FileSpreadsheet size={16} /> Export Excel
          </button>
          <button className="btn btn-primary" onClick={handleSaveBOM}>
            <Save size={16} /> Save BOM & Update Product
          </button>
        </div>
      </div>

      {/* Select Garment Product Bar */}
      <div className="card" style={{ padding: '14px 20px', display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '14px', background: 'linear-gradient(135deg, #161b22 0%, #0d1117 100%)' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
          <Shirt size={20} color="var(--accent-gold)" />
          <span style={{ fontWeight: '700', fontSize: '0.9rem', color: 'var(--text-primary)' }}>Select Product:</span>
          <select 
            value={selectedProductId} 
            onChange={(e) => setSelectedProductId(e.target.value)}
            style={{ minWidth: '340px', fontWeight: '700', padding: '8px 14px', color: 'var(--accent-gold)' }}
          >
            {products.map(p => (
              <option key={p.id} value={p.id}>[{p.code}] {p.name} - {p.fabric}</option>
            ))}
          </select>
        </div>

        {selectedProduct && (
          <div style={{ display: 'flex', alignItems: 'center', gap: '20px', fontSize: '0.825rem' }}>
            <div>Category: <strong style={{ color: 'var(--text-primary)' }}>{selectedProduct.category}</strong></div>
            <div>HSN: <strong style={{ color: 'var(--text-primary)' }}>{selectedProduct.hsnCode}</strong></div>
            <div>Current SP: <strong style={{ color: '#3fb950', fontSize: '0.95rem' }}>₹{selectedProduct.sellingPrice?.toFixed(2)}</strong></div>
          </div>
        )}
      </div>

      {/* Top LIVE Cost Summary KPI Cards Grid (5 Visual Cards) */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '14px' }}>
        <div className="card" style={{ padding: '14px 16px', borderLeft: '4px solid #38bdf8' }}>
          <div style={{ fontSize: '0.75rem', color: 'var(--text-secondary)', fontWeight: '600' }}>Direct Raw Materials</div>
          <div className="mono" style={{ fontSize: '1.3rem', fontWeight: '800', color: '#38bdf8', marginTop: '4px' }}>
            ₹{totalDirectMaterialCost.toFixed(2)}
          </div>
          <div style={{ fontSize: '0.675rem', color: 'var(--text-muted)', marginTop: '2px' }}>Fabric, Buttons, Interlining, Labels</div>
        </div>

        <div className="card" style={{ padding: '14px 16px', borderLeft: '4px solid #a855f7' }}>
          <div style={{ fontSize: '0.75rem', color: 'var(--text-secondary)', fontWeight: '600' }}>Manufacturing Overheads</div>
          <div className="mono" style={{ fontSize: '1.3rem', fontWeight: '800', color: '#a855f7', marginTop: '4px' }}>
            ₹{totalMfgCost.toFixed(2)}
          </div>
          <div style={{ fontSize: '0.675rem', color: 'var(--text-muted)', marginTop: '2px' }}>Stitching, Washing, Cutting, Finishing</div>
        </div>

        <div className="card" style={{ padding: '14px 16px', borderLeft: '4px solid var(--accent-gold)' }}>
          <div style={{ fontSize: '0.75rem', color: 'var(--text-secondary)', fontWeight: '600' }}>Total Net Cost / Shirt</div>
          <div className="mono" style={{ fontSize: '1.3rem', fontWeight: '800', color: 'var(--accent-gold)', marginTop: '4px' }}>
            ₹{totalCostPerShirt.toFixed(2)}
          </div>
          <div style={{ fontSize: '0.675rem', color: 'var(--text-muted)', marginTop: '2px' }}>Material Cost + Overheads</div>
        </div>

        <div className="card" style={{ padding: '14px 16px', borderLeft: '4px solid #f59e0b' }}>
          <div style={{ fontSize: '0.75rem', color: 'var(--text-secondary)', fontWeight: '600' }}>Profit Margin</div>
          <div className="mono" style={{ fontSize: '1.3rem', fontWeight: '800', color: '#f59e0b', marginTop: '4px' }}>
            {calculatedMarginPct.toFixed(1)}% <span style={{ fontSize: '0.85rem', fontWeight: '600' }}>(+₹{marginAmount.toFixed(0)})</span>
          </div>
          <div style={{ fontSize: '0.675rem', color: 'var(--text-muted)', marginTop: '2px' }}>Net Profit per Shirt</div>
        </div>

        <div className="card" style={{ padding: '14px 16px', borderLeft: '4px solid #3fb950', background: 'rgba(35, 134, 54, 0.08)' }}>
          <div style={{ fontSize: '0.75rem', color: 'var(--text-secondary)', fontWeight: '600' }}>Final Selling Price (Incl. GST)</div>
          <div className="mono" style={{ fontSize: '1.3rem', fontWeight: '800', color: '#3fb950', marginTop: '4px' }}>
            ₹{finalSellingPrice.toFixed(2)}
          </div>
          <div style={{ fontSize: '0.675rem', color: 'var(--text-muted)', marginTop: '2px' }}>Excl. GST: ₹{sellingPriceExclGst.toFixed(2)}</div>
        </div>
      </div>

      {/* Navigation Sub-Tabs for Easy Step-by-Step Costing */}
      <div style={{ display: 'flex', gap: '8px', borderBottom: '1px solid var(--border-color)', paddingBottom: '8px' }}>
        <button
          onClick={() => setActiveTab('materials')}
          style={{
            padding: '8px 16px',
            borderRadius: '6px',
            fontSize: '0.85rem',
            fontWeight: '700',
            backgroundColor: activeTab === 'materials' ? 'var(--accent-gold)' : 'transparent',
            color: activeTab === 'materials' ? '#0b0f19' : 'var(--text-primary)',
            display: 'flex',
            alignItems: 'center',
            gap: '8px'
          }}
        >
          <Scissors size={16} /> 1. Raw Materials & Fabric BOM
        </button>

        <button
          onClick={() => setActiveTab('overheads')}
          style={{
            padding: '8px 16px',
            borderRadius: '6px',
            fontSize: '0.85rem',
            fontWeight: '700',
            backgroundColor: activeTab === 'overheads' ? 'var(--accent-gold)' : 'transparent',
            color: activeTab === 'overheads' ? '#0b0f19' : 'var(--text-primary)',
            display: 'flex',
            alignItems: 'center',
            gap: '8px'
          }}
        >
          <DollarSign size={16} /> 2. Stitching & Manufacturing Overheads
        </button>

        <button
          onClick={() => setActiveTab('margin')}
          style={{
            padding: '8px 16px',
            borderRadius: '6px',
            fontSize: '0.85rem',
            fontWeight: '700',
            backgroundColor: activeTab === 'margin' ? 'var(--accent-gold)' : 'transparent',
            color: activeTab === 'margin' ? '#0b0f19' : 'var(--text-primary)',
            display: 'flex',
            alignItems: 'center',
            gap: '8px'
          }}
        >
          <TrendingUp size={16} /> 3. Margin & Selling Price Calculator
        </button>

        <button
          onClick={() => setActiveTab('sheet')}
          style={{
            padding: '8px 16px',
            borderRadius: '6px',
            fontSize: '0.85rem',
            fontWeight: '700',
            backgroundColor: activeTab === 'sheet' ? 'var(--accent-gold)' : 'transparent',
            color: activeTab === 'sheet' ? '#0b0f19' : 'var(--text-primary)',
            display: 'flex',
            alignItems: 'center',
            gap: '8px'
          }}
        >
          <FileSpreadsheet size={16} /> 4. Complete Costing Summary Sheet
        </button>
      </div>

      {/* TAB CONTENT 1: RAW MATERIALS */}
      {activeTab === 'materials' && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
          {/* Section 1: Fabric */}
          <div className="card">
            <h3 style={{ fontSize: '1rem', color: 'var(--accent-gold)', marginBottom: '14px', display: 'flex', alignItems: 'center', gap: '8px' }}>
              <Scissors size={18} /> Fabric Specifications & Consumption Rate
            </h3>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '14px' }}>
              <div>
                <label style={{ fontSize: '0.75rem', color: 'var(--text-secondary)' }}>Fabric Name & Quality</label>
                <input 
                  type="text" 
                  style={{ width: '100%', fontWeight: '600' }} 
                  value={fabric.name} 
                  onChange={(e) => setFabric({ ...fabric, name: e.target.value })} 
                />
              </div>
              <div>
                <label style={{ fontSize: '0.75rem', color: 'var(--text-secondary)' }}>Fabric Colour</label>
                <input 
                  type="text" 
                  style={{ width: '100%' }} 
                  value={fabric.color} 
                  onChange={(e) => setFabric({ ...fabric, color: e.target.value })} 
                />
              </div>
              <div>
                <label style={{ fontSize: '0.75rem', color: 'var(--text-secondary)' }}>Fabric Purchase Rate (₹ / Metre)</label>
                <input 
                  type="number" 
                  step="0.1" 
                  style={{ width: '100%', fontWeight: '700' }} 
                  value={fabric.rate} 
                  onChange={(e) => setFabric({ ...fabric, rate: parseFloat(e.target.value) || 0 })} 
                />
              </div>
              <div>
                <label style={{ fontSize: '0.75rem', color: 'var(--text-secondary)' }}>Consumption / Shirt (Metres)</label>
                <input 
                  type="number" 
                  step="0.01" 
                  style={{ width: '100%', fontWeight: '700' }} 
                  value={fabric.consumption} 
                  onChange={(e) => setFabric({ ...fabric, consumption: parseFloat(e.target.value) || 0 })} 
                />
              </div>
            </div>
            <div style={{ marginTop: '14px', padding: '10px 14px', borderRadius: '6px', backgroundColor: 'rgba(56, 189, 248, 0.08)', border: '1px solid rgba(56, 189, 248, 0.2)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <span style={{ fontSize: '0.85rem' }}>Fabric Calculation: <strong>₹{fabric.rate} / metre × {fabric.consumption} metres</strong></span>
              <span className="mono" style={{ fontSize: '1.1rem', fontWeight: '800', color: '#38bdf8' }}>₹{fabricCost.toFixed(2)}</span>
            </div>
          </div>

          {/* Section 2: Buttons */}
          <div className="card">
            <h3 style={{ fontSize: '1rem', color: 'var(--accent-gold)', marginBottom: '14px', display: 'flex', alignItems: 'center', gap: '8px' }}>
              <Layers size={18} /> Button Specifications (1 Gross = 144 Buttons)
            </h3>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', gap: '14px' }}>
              <div>
                <label style={{ fontSize: '0.75rem', color: 'var(--text-secondary)' }}>Button Type & Size</label>
                <input 
                  type="text" 
                  style={{ width: '100%' }} 
                  value={button.type} 
                  onChange={(e) => setButton({ ...button, type: e.target.value })} 
                />
              </div>
              <div>
                <label style={{ fontSize: '0.75rem', color: 'var(--text-secondary)' }}>Button Rate (₹ per Gross)</label>
                <input 
                  type="number" 
                  step="1" 
                  style={{ width: '100%', fontWeight: '700' }} 
                  value={button.rate} 
                  onChange={(e) => setButton({ ...button, rate: parseFloat(e.target.value) || 0 })} 
                />
              </div>
              <div>
                <label style={{ fontSize: '0.75rem', color: 'var(--text-secondary)' }}>Gross Required / Shirt</label>
                <input 
                  type="number" 
                  step="0.001" 
                  style={{ width: '100%', fontWeight: '700' }} 
                  value={button.quantity} 
                  onChange={(e) => setButton({ ...button, quantity: parseFloat(e.target.value) || 0 })} 
                />
                <span style={{ fontSize: '0.7rem', color: 'var(--text-muted)' }}>
                  ≈ {Math.round(button.quantity * 144)} buttons per shirt
                </span>
              </div>
            </div>
            <div style={{ marginTop: '14px', padding: '10px 14px', borderRadius: '6px', backgroundColor: 'rgba(255, 255, 255, 0.03)', border: '1px solid var(--border-color)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <span style={{ fontSize: '0.85rem' }}>Button Cost / Shirt:</span>
              <span className="mono" style={{ fontSize: '1.1rem', fontWeight: '800', color: '#38bdf8' }}>₹{buttonCost.toFixed(2)}</span>
            </div>
          </div>

          {/* Section 3: Collar & Cuff */}
          <div className="card">
            <h3 style={{ fontSize: '1rem', color: 'var(--accent-gold)', marginBottom: '14px' }}>
              Collar & Cuff Fusible Interlining
            </h3>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
              <div style={{ backgroundColor: 'rgba(255,255,255,0.02)', padding: '14px', borderRadius: '8px', border: '1px solid var(--border-color)' }}>
                <div style={{ fontWeight: '700', fontSize: '0.85rem', marginBottom: '8px' }}>Collar Interlining</div>
                <div style={{ display: 'flex', gap: '10px' }}>
                  <input type="text" placeholder="Type" style={{ flex: 1 }} value={collar.type} onChange={(e) => setCollar({ ...collar, type: e.target.value })} />
                  <input type="number" placeholder="Rate ₹" style={{ width: '100px', fontWeight: '700' }} value={collar.rate} onChange={(e) => setCollar({ ...collar, rate: parseFloat(e.target.value) || 0 })} />
                </div>
                <div style={{ fontSize: '0.85rem', textAlign: 'right', marginTop: '8px', color: '#38bdf8', fontWeight: '700' }}>Cost: ₹{collarCost.toFixed(2)}</div>
              </div>

              <div style={{ backgroundColor: 'rgba(255,255,255,0.02)', padding: '14px', borderRadius: '8px', border: '1px solid var(--border-color)' }}>
                <div style={{ fontWeight: '700', fontSize: '0.85rem', marginBottom: '8px' }}>Cuff Interlining</div>
                <div style={{ display: 'flex', gap: '10px' }}>
                  <input type="text" placeholder="Type" style={{ flex: 1 }} value={cuff.type} onChange={(e) => setCuff({ ...cuff, type: e.target.value })} />
                  <input type="number" placeholder="Rate ₹" style={{ width: '100px', fontWeight: '700' }} value={cuff.rate} onChange={(e) => setCuff({ ...cuff, rate: parseFloat(e.target.value) || 0 })} />
                </div>
                <div style={{ fontSize: '0.85rem', textAlign: 'right', marginTop: '8px', color: '#38bdf8', fontWeight: '700' }}>Cost: ₹{cuffCost.toFixed(2)}</div>
              </div>
            </div>
          </div>

          {/* Section 4: 7 ALISTON LABELS */}
          <div className="card">
            <h3 style={{ fontSize: '1rem', color: 'var(--accent-gold)', marginBottom: '14px' }}>
              Complete ALISTON Brand Label Set (7 Labels)
            </h3>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '12px' }}>
              {Object.entries(labels).map(([key, lbl]) => (
                <div key={key} style={{ backgroundColor: 'rgba(255,255,255,0.02)', padding: '10px 12px', borderRadius: '6px', border: '1px solid var(--border-color)' }}>
                  <div style={{ fontSize: '0.725rem', color: 'var(--text-secondary)', fontWeight: '700' }}>{key.toUpperCase()}</div>
                  <input 
                    type="text" 
                    style={{ width: '100%', fontSize: '0.8rem', margin: '4px 0' }} 
                    value={lbl.name} 
                    onChange={(e) => setLabels({ ...labels, [key]: { ...lbl, name: e.target.value } })} 
                  />
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginTop: '4px' }}>
                    <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>Rate ₹:</span>
                    <input 
                      type="number" 
                      step="0.1" 
                      style={{ width: '80px', padding: '4px 8px', fontSize: '0.8rem', fontWeight: '700' }} 
                      value={lbl.rate} 
                      onChange={(e) => setLabels({ ...labels, [key]: { ...lbl, rate: parseFloat(e.target.value) || 0 } })} 
                    />
                  </div>
                </div>
              ))}
            </div>
            <div style={{ marginTop: '14px', padding: '10px 14px', borderRadius: '6px', backgroundColor: 'rgba(255, 255, 255, 0.03)', border: '1px solid var(--border-color)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <span style={{ fontSize: '0.85rem' }}>Total 7 Labels Cost:</span>
              <span className="mono" style={{ fontSize: '1.1rem', fontWeight: '800', color: '#38bdf8' }}>₹{labelsCost.toFixed(2)}</span>
            </div>
          </div>

          {/* Section 5: Other Trims */}
          <div className="card">
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '14px' }}>
              <h3 style={{ fontSize: '1rem', color: 'var(--accent-gold)' }}>
                Additional Trims & Packaging Materials
              </h3>
              <button className="btn btn-secondary btn-sm" onClick={handleAddOtherMaterial}>
                <Plus size={14} /> Add Trim Material
              </button>
            </div>
            {otherMaterials.map(om => (
              <div key={om.id} style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '8px' }}>
                <input 
                  type="text" 
                  style={{ flex: 2 }} 
                  value={om.name} 
                  onChange={(e) => {
                    const val = e.target.value;
                    setOtherMaterials(otherMaterials.map(item => item.id === om.id ? { ...item, name: val } : item));
                  }} 
                />
                <input 
                  type="number" 
                  placeholder="Rate ₹" 
                  style={{ width: '110px', fontWeight: '700' }} 
                  value={om.rate} 
                  onChange={(e) => {
                    const val = parseFloat(e.target.value) || 0;
                    setOtherMaterials(otherMaterials.map(item => item.id === om.id ? { ...item, rate: val } : item));
                  }} 
                />
                <input 
                  type="number" 
                  placeholder="Qty" 
                  style={{ width: '90px' }} 
                  value={om.qty} 
                  onChange={(e) => {
                    const val = parseFloat(e.target.value) || 0;
                    setOtherMaterials(otherMaterials.map(item => item.id === om.id ? { ...item, qty: val } : item));
                  }} 
                />
                <span className="mono" style={{ width: '100px', fontSize: '0.9rem', fontWeight: '800', color: '#38bdf8', textAlign: 'right' }}>
                  ₹{(om.rate * om.qty).toFixed(2)}
                </span>
                <button className="btn btn-danger btn-sm" onClick={() => handleRemoveOtherMaterial(om.id)}>
                  <Trash2 size={14} />
                </button>
              </div>
            ))}
          </div>

          <div style={{ display: 'flex', justifyContent: 'flex-end' }}>
            <button className="btn btn-primary" onClick={() => setActiveTab('overheads')}>
              Proceed to Manufacturing Overheads <ArrowRight size={16} />
            </button>
          </div>
        </div>
      )}

      {/* TAB CONTENT 2: MANUFACTURING OVERHEADS */}
      {activeTab === 'overheads' && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
          <div className="card">
            <h3 style={{ fontSize: '1rem', color: 'var(--accent-gold)', marginBottom: '16px', display: 'flex', alignItems: 'center', gap: '8px' }}>
              <DollarSign size={18} /> Direct Manufacturing Overheads Per Garment
            </h3>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '16px' }}>
              {Object.entries(mfgExpenses).map(([key, val]) => (
                <div key={key} style={{ backgroundColor: 'rgba(255,255,255,0.02)', padding: '12px', borderRadius: '8px', border: '1px solid var(--border-color)' }}>
                  <label style={{ fontSize: '0.775rem', color: 'var(--text-secondary)', textTransform: 'capitalize', fontWeight: '600' }}>
                    {key.replace(/([A-Z])/g, ' $1')} (₹)
                  </label>
                  <input 
                    type="number" 
                    step="0.5" 
                    style={{ width: '100%', marginTop: '6px', fontSize: '1rem', fontWeight: '700' }} 
                    value={val} 
                    onChange={(e) => setMfgExpenses({ ...mfgExpenses, [key]: parseFloat(e.target.value) || 0 })} 
                  />
                </div>
              ))}
            </div>

            <div style={{ marginTop: '20px', padding: '14px 18px', borderRadius: '8px', backgroundColor: 'rgba(168, 85, 247, 0.08)', border: '1px solid rgba(168, 85, 247, 0.3)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <div>
                <div style={{ fontSize: '0.9rem', fontWeight: '700' }}>Total Manufacturing Overheads Subtotal:</div>
                <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>Sum of Stitching, Cutting, Washing, Ironing, Labour & Delivery</div>
              </div>
              <span className="mono" style={{ fontSize: '1.4rem', fontWeight: '800', color: '#a855f7' }}>₹{totalMfgCost.toFixed(2)}</span>
            </div>
          </div>

          <div style={{ display: 'flex', justifyContent: 'space-between' }}>
            <button className="btn btn-secondary" onClick={() => setActiveTab('materials')}>
              ← Back to Raw Materials
            </button>
            <button className="btn btn-primary" onClick={() => setActiveTab('margin')}>
              Proceed to Margin Calculator <ArrowRight size={16} />
            </button>
          </div>
        </div>
      )}

      {/* TAB CONTENT 3: MARGIN & PRICING CALCULATOR */}
      {activeTab === 'margin' && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
          <div className="card" style={{ background: 'linear-gradient(180deg, #161b22 0%, #0d1117 100%)', border: '1px solid var(--accent-gold)' }}>
            <h3 style={{ fontSize: '1.1rem', fontWeight: '800', color: 'var(--accent-gold)', borderBottom: '1px solid var(--border-color)', paddingBottom: '12px', marginBottom: '16px' }}>
              Profit Margin & Selling Price Calculator
            </h3>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '24px' }}>
              {/* Left Column: Presets & Controls */}
              <div>
                <h4 style={{ fontSize: '0.85rem', fontWeight: '700', color: 'var(--text-secondary)', marginBottom: '12px' }}>
                  Choose Profit Margin Preset %
                </h4>
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '8px', marginBottom: '20px' }}>
                  {[10, 15, 20, 25, 30, 35, 40, 50].map(pct => (
                    <button
                      key={pct}
                      type="button"
                      onClick={() => {
                        setMarginPercent(pct);
                        setManualSellingPrice('');
                      }}
                      style={{
                        padding: '10px',
                        borderRadius: '6px',
                        fontSize: '0.85rem',
                        fontWeight: '800',
                        backgroundColor: marginPercent === pct && manualSellingPrice === '' ? 'var(--accent-gold)' : 'var(--bg-input)',
                        color: marginPercent === pct && manualSellingPrice === '' ? '#0b0f19' : 'var(--text-primary)',
                        border: '1px solid var(--border-color)'
                      }}
                    >
                      {pct}%
                    </button>
                  ))}
                </div>

                <div style={{ marginBottom: '20px' }}>
                  <label style={{ fontSize: '0.8rem', color: 'var(--text-secondary)', fontWeight: '600' }}>Or Enter Custom Selling Price (Excl. GST)</label>
                  <input 
                    type="number" 
                    placeholder="e.g. 1050" 
                    style={{ width: '100%', marginTop: '6px', fontSize: '1rem', fontWeight: '700' }} 
                    value={manualSellingPrice}
                    onChange={(e) => setManualSellingPrice(e.target.value)}
                  />
                </div>

                <div>
                  <label style={{ fontSize: '0.8rem', color: 'var(--text-secondary)', fontWeight: '600' }}>GST Slab %</label>
                  <select 
                    style={{ width: '100%', marginTop: '6px', fontSize: '0.9rem', fontWeight: '700' }}
                    value={gstPercent}
                    onChange={(e) => setGstPercent(parseFloat(e.target.value))}
                  >
                    <option value={5}>5% GST (Apparel & Fabric &lt; ₹1000)</option>
                    <option value={12}>12% GST (Apparel Standard &gt; ₹1000)</option>
                    <option value={18}>18% GST (Luxury Premium Apparels)</option>
                  </select>
                </div>
              </div>

              {/* Right Column: Final Financial Output Sheet */}
              <div style={{ backgroundColor: 'rgba(255,255,255,0.02)', padding: '20px', borderRadius: '10px', border: '1px solid var(--border-color)', display: 'flex', flexDirection: 'column', gap: '12px' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.9rem' }}>
                  <span>Raw Material Cost:</span>
                  <span className="mono" style={{ fontWeight: '700' }}>₹{totalDirectMaterialCost.toFixed(2)}</span>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.9rem' }}>
                  <span>Manufacturing Expenses:</span>
                  <span className="mono" style={{ fontWeight: '700' }}>₹{totalMfgCost.toFixed(2)}</span>
                </div>
                <div style={{ borderTop: '1px dashed var(--border-color)', paddingTop: '8px', display: 'flex', justifyContent: 'space-between', fontSize: '1rem', fontWeight: '800' }}>
                  <span>TOTAL SHIRT COST:</span>
                  <span className="mono" style={{ color: 'var(--accent-gold)' }}>₹{totalCostPerShirt.toFixed(2)}</span>
                </div>

                <div style={{ borderTop: '1px dashed var(--border-color)', paddingTop: '8px', display: 'flex', justifyContent: 'space-between', fontSize: '0.9rem' }}>
                  <span>Profit Margin %:</span>
                  <span className="mono" style={{ color: '#f59e0b', fontWeight: '800' }}>{calculatedMarginPct.toFixed(1)}%</span>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.9rem' }}>
                  <span>Profit Amount / Shirt:</span>
                  <span className="mono" style={{ color: '#f59e0b', fontWeight: '800' }}>+₹{marginAmount.toFixed(2)}</span>
                </div>

                <div style={{ borderTop: '1px solid var(--border-color)', paddingTop: '10px', display: 'flex', justifyContent: 'space-between', fontSize: '1rem', fontWeight: '800' }}>
                  <span>Selling Price (Excl. GST):</span>
                  <span className="mono" style={{ color: '#38bdf8' }}>₹{sellingPriceExclGst.toFixed(2)}</span>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.9rem' }}>
                  <span>GST Amount ({gstPercent}%):</span>
                  <span className="mono">₹{gstAmount.toFixed(2)}</span>
                </div>

                <div style={{ borderTop: '2px solid var(--border-color)', paddingTop: '12px', marginTop: '6px', display: 'flex', justifyContent: 'space-between', fontSize: '1.2rem', fontWeight: '800', color: '#3fb950' }}>
                  <span>FINAL INVOICE PRICE:</span>
                  <span className="mono">₹{finalSellingPrice.toFixed(2)}</span>
                </div>

                <button className="btn btn-primary" style={{ marginTop: '12px' }} onClick={handleSaveBOM}>
                  <Save size={16} /> Save BOM & Costing
                </button>
              </div>
            </div>
          </div>

          <div style={{ display: 'flex', justifyContent: 'space-between' }}>
            <button className="btn btn-secondary" onClick={() => setActiveTab('overheads')}>
              ← Back to Overheads
            </button>
            <button className="btn btn-primary" onClick={() => setActiveTab('sheet')}>
              View Full Costing Sheet <ArrowRight size={16} />
            </button>
          </div>
        </div>
      )}

      {/* TAB CONTENT 4: FULL COSTING SHEET TABLE */}
      {activeTab === 'sheet' && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
          <div className="erp-table-container">
            <table className="erp-table">
              <thead>
                <tr>
                  <th>Cost Breakdown Component</th>
                  <th>Specifications & Notes</th>
                  <th>Rate / Unit</th>
                  <th>Quantity / Consumption</th>
                  <th>Total Cost (₹)</th>
                </tr>
              </thead>
              <tbody>
                <tr>
                  <td style={{ fontWeight: '700' }}>1. Fabric Cost</td>
                  <td>{fabric.name} ({fabric.color})</td>
                  <td className="mono">₹{fabric.rate}/m</td>
                  <td className="mono">{fabric.consumption} m</td>
                  <td className="mono" style={{ fontWeight: '700', color: '#38bdf8' }}>₹{fabricCost.toFixed(2)}</td>
                </tr>
                <tr>
                  <td style={{ fontWeight: '700' }}>2. Button Cost</td>
                  <td>{button.type}</td>
                  <td className="mono">₹{button.rate}/Gross</td>
                  <td className="mono">{button.quantity} Gross</td>
                  <td className="mono" style={{ fontWeight: '700', color: '#38bdf8' }}>₹{buttonCost.toFixed(2)}</td>
                </tr>
                <tr>
                  <td style={{ fontWeight: '700' }}>3. Collar Interlining</td>
                  <td>{collar.type}</td>
                  <td className="mono">₹{collar.rate}</td>
                  <td className="mono">1 pc</td>
                  <td className="mono" style={{ fontWeight: '700', color: '#38bdf8' }}>₹{collarCost.toFixed(2)}</td>
                </tr>
                <tr>
                  <td style={{ fontWeight: '700' }}>4. Cuff Interlining</td>
                  <td>{cuff.type}</td>
                  <td className="mono">₹{cuff.rate}</td>
                  <td className="mono">1 pc</td>
                  <td className="mono" style={{ fontWeight: '700', color: '#38bdf8' }}>₹{cuffCost.toFixed(2)}</td>
                </tr>
                <tr>
                  <td style={{ fontWeight: '700' }}>5. ALISTON Label Set</td>
                  <td>7 Brand & Composition Labels</td>
                  <td className="mono">-</td>
                  <td className="mono">7 pcs</td>
                  <td className="mono" style={{ fontWeight: '700', color: '#38bdf8' }}>₹{labelsCost.toFixed(2)}</td>
                </tr>
                <tr>
                  <td style={{ fontWeight: '700' }}>6. Other Trims & Polybag</td>
                  <td>Threads, Packaging, Butterfly</td>
                  <td className="mono">-</td>
                  <td className="mono">-</td>
                  <td className="mono" style={{ fontWeight: '700', color: '#38bdf8' }}>₹{otherMatCost.toFixed(2)}</td>
                </tr>
                <tr style={{ backgroundColor: 'rgba(56, 189, 248, 0.08)', fontWeight: '800' }}>
                  <td colSpan="4">SUBTOTAL: DIRECT RAW MATERIAL COST</td>
                  <td className="mono" style={{ color: '#38bdf8', fontSize: '1rem' }}>₹{totalDirectMaterialCost.toFixed(2)}</td>
                </tr>
                <tr>
                  <td style={{ fontWeight: '700' }}>7. Stitching & Labour</td>
                  <td>Master Artisan Tailor</td>
                  <td className="mono">₹{mfgExpenses.stitchingCost}</td>
                  <td className="mono">1 pc</td>
                  <td className="mono" style={{ fontWeight: '700', color: '#a855f7' }}>₹{mfgExpenses.stitchingCost.toFixed(2)}</td>
                </tr>
                <tr>
                  <td style={{ fontWeight: '700' }}>8. Cutting & Patterning</td>
                  <td>Cutting Master</td>
                  <td className="mono">₹{mfgExpenses.cuttingCost}</td>
                  <td className="mono">1 pc</td>
                  <td className="mono" style={{ fontWeight: '700', color: '#a855f7' }}>₹{mfgExpenses.cuttingCost.toFixed(2)}</td>
                </tr>
                <tr>
                  <td style={{ fontWeight: '700' }}>9. Washing & Bio-wash</td>
                  <td>Softener Wash</td>
                  <td className="mono">₹{mfgExpenses.washingCost}</td>
                  <td className="mono">1 pc</td>
                  <td className="mono" style={{ fontWeight: '700', color: '#a855f7' }}>₹{mfgExpenses.washingCost.toFixed(2)}</td>
                </tr>
                <tr>
                  <td style={{ fontWeight: '700' }}>10. Ironing, Packing & Freight</td>
                  <td>Finishing & Warehouse Delivery</td>
                  <td className="mono">-</td>
                  <td className="mono">1 pc</td>
                  <td className="mono" style={{ fontWeight: '700', color: '#a855f7' }}>
                    ₹{(mfgExpenses.ironingCost + mfgExpenses.finishingCost + mfgExpenses.packingCost + mfgExpenses.transportation + mfgExpenses.labour + mfgExpenses.electricity).toFixed(2)}
                  </td>
                </tr>
                <tr style={{ backgroundColor: 'rgba(168, 85, 247, 0.08)', fontWeight: '800' }}>
                  <td colSpan="4">SUBTOTAL: MANUFACTURING OVERHEADS</td>
                  <td className="mono" style={{ color: '#a855f7', fontSize: '1rem' }}>₹{totalMfgCost.toFixed(2)}</td>
                </tr>
                <tr style={{ backgroundColor: 'rgba(229, 185, 92, 0.12)', fontWeight: '800' }}>
                  <td colSpan="4">NET TOTAL COST PER SHIRT</td>
                  <td className="mono" style={{ color: 'var(--accent-gold)', fontSize: '1.1rem' }}>₹{totalCostPerShirt.toFixed(2)}</td>
                </tr>
                <tr>
                  <td style={{ fontWeight: '700' }}>11. Profit Margin ({calculatedMarginPct.toFixed(1)}%)</td>
                  <td>Net Profit / Unit</td>
                  <td className="mono">-</td>
                  <td className="mono">-</td>
                  <td className="mono" style={{ fontWeight: '700', color: '#f59e0b' }}>+₹{marginAmount.toFixed(2)}</td>
                </tr>
                <tr style={{ backgroundColor: 'rgba(16, 185, 129, 0.15)', fontWeight: '800' }}>
                  <td colSpan="4">FINAL SELLING PRICE (INCL. GST {gstPercent}%)</td>
                  <td className="mono" style={{ color: '#3fb950', fontSize: '1.2rem' }}>₹{finalSellingPrice.toFixed(2)}</td>
                </tr>
              </tbody>
            </table>
          </div>

          <div style={{ display: 'flex', justifyContent: 'space-between' }}>
            <button className="btn btn-secondary" onClick={() => setActiveTab('margin')}>
              ← Back to Margin Calculator
            </button>
            <button className="btn btn-primary" onClick={handleSaveBOM}>
              <Save size={16} /> Save BOM & Costing
            </button>
          </div>
        </div>
      )}
    </div>
  );
};
