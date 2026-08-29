import React, { useState } from "react";
import { Scissors, Search, Plus, Filter, AlertTriangle, Trash2, Edit, Factory, Package, Eye } from "lucide-react";
import { getData, saveData, markIdDeleted } from "../db/storage";
import { exportToExcel } from "../utils/excelExporter";

export const MaterialInventoryView = () => {
  const [materials, setMaterials] = useState(() => getData("MATERIALS") || []);
  const [dispatches, setDispatches] = useState(() => getData("FABRIC_DISPATCHES") || []);
  const [searchTerm, setSearchTerm] = useState("");
  const [filterCategory, setFilterCategory] = useState("ALL");
  const [showAddModal, setShowAddModal] = useState(false);
  const [showDispatchModal, setShowDispatchModal] = useState(false);
  const [showDispatchListModal, setShowDispatchListModal] = useState(false);
  const [editingMaterial, setEditingMaterial] = useState(null);
  const [activeTab, setActiveTab] = useState("inventory");
  const [dispatchFilter, setDispatchFilter] = useState("");

  React.useEffect(() => {
    const h = () => {
      setMaterials(getData("MATERIALS") || []);
      setDispatches(getData("FABRIC_DISPATCHES") || []);
    };
    window.addEventListener("aliston-db-updated", h);
    return () => window.removeEventListener("aliston-db-updated", h);
  }, []);

  const [newMaterial, setNewMaterial] = useState({ name: "", category: "Fabric", rate: 0, unit: "metre", currentStock: 0, minStock: 100 });
  const [newDispatch, setNewDispatch] = useState({ fabricMaterialId: "", fabricName: "", factoryOwnerName: "", factoryName: "", factoryContact: "", factoryAddress: "", shirtName: "", qtyGiven: "", unit: "metre", dateGiven: new Date().toISOString().split("T")[0], expectedReturnDate: "", remarks: "", status: "Given" });

  const categories = ["Fabric", "Button", "Collar", "Cuff", "Label", "Thread", "Packing Material", "Other"];
  const fabricMaterials = materials.filter(m => m.category === "Fabric");

  const handleAddMaterial = (e) => {
    e.preventDefault();
    let updated;
    if (editingMaterial) {
      updated = materials.map(m => m.id === editingMaterial.id ? { ...m, ...newMaterial } : m);
    } else {
      updated = [...materials, { id: "mat-" + Date.now(), ...newMaterial }];
    }
    setMaterials(updated);
    saveData("MATERIALS", updated);
    setShowAddModal(false);
    setEditingMaterial(null);
  };

  const handleDeleteMaterial = (id) => {
    if (confirm("Delete this material?")) {
      markIdDeleted("MATERIALS", id);
      const updated = materials.filter(m => m.id !== id);
      setMaterials(updated);
      saveData("MATERIALS", updated);
    }
  };

  const handleEditMaterial = (m) => {
    setEditingMaterial(m);
    setNewMaterial({ name: m.name || "", category: m.category || "Fabric", rate: m.rate || 0, unit: m.unit || "metre", currentStock: m.currentStock || 0, minStock: m.minStock || 0 });
    setShowAddModal(true);
  };

  const handleOpenAddModal = () => {
    setEditingMaterial(null);
    setNewMaterial({ name: "", category: "Fabric", rate: 0, unit: "metre", currentStock: 0, minStock: 100 });
    setShowAddModal(true);
  };

  const handleAddDispatch = (e) => {
    e.preventDefault();
    const fabric = materials.find(m => m.id === newDispatch.fabricMaterialId);
    const qty = parseFloat(newDispatch.qtyGiven) || 0;
    if (fabric && qty > (fabric.currentStock || 0)) {
      alert("Insufficient fabric stock! Available: " + fabric.currentStock + " " + fabric.unit);
      return;
    }
    const entry = { id: "fd-" + Date.now(), ...newDispatch, qtyGiven: qty, fabricName: fabric ? fabric.name : newDispatch.fabricName, unit: fabric ? fabric.unit : newDispatch.unit, createdAt: new Date().toISOString() };
    const updatedDispatches = [entry, ...dispatches];
    setDispatches(updatedDispatches);
    saveData("FABRIC_DISPATCHES", updatedDispatches);
    if (fabric) {
      const updatedMats = materials.map(m => m.id === fabric.id ? { ...m, currentStock: Math.max(0, (m.currentStock || 0) - qty) } : m);
      setMaterials(updatedMats);
      saveData("MATERIALS", updatedMats);
    }
    setShowDispatchModal(false);
    setNewDispatch({ fabricMaterialId: "", fabricName: "", factoryOwnerName: "", factoryName: "", factoryContact: "", factoryAddress: "", shirtName: "", qtyGiven: "", unit: "metre", dateGiven: new Date().toISOString().split("T")[0], expectedReturnDate: "", remarks: "", status: "Given" });
  };

  const handleMarkReceived = (id) => {
    const updated = dispatches.map(d => d.id === id ? { ...d, status: "Received Back", receivedDate: new Date().toISOString().split("T")[0] } : d);
    setDispatches(updated);
    saveData("FABRIC_DISPATCHES", updated);
  };

  const handleDeleteDispatch = (id) => {
    if (confirm("Delete this dispatch record?")) {
      markIdDeleted("FABRIC_DISPATCHES", id);
      const updated = dispatches.filter(d => d.id !== id);
      setDispatches(updated);
      saveData("FABRIC_DISPATCHES", updated);
    }
  };

  const filteredMaterials = materials.filter(m => {
    const matchCat = filterCategory === "ALL" || m.category === filterCategory;
    const matchSearch = m.name.toLowerCase().includes(searchTerm.toLowerCase()) || m.category.toLowerCase().includes(searchTerm.toLowerCase());
    return matchCat && matchSearch;
  });

  const filteredDispatches = dispatches.filter(d =>
    !dispatchFilter || d.factoryOwnerName.toLowerCase().includes(dispatchFilter.toLowerCase()) || d.factoryName.toLowerCase().includes(dispatchFilter.toLowerCase()) || d.fabricName.toLowerCase().includes(dispatchFilter.toLowerCase()) || d.shirtName.toLowerCase().includes(dispatchFilter.toLowerCase())
  );

  let totalVal = 0;
  materials.forEach(m => totalVal += (m.currentStock || 0) * (m.rate || 0));
  const totalFabricGiven = dispatches.filter(d => d.status === "Given").reduce((s, d) => s + (parseFloat(d.qtyGiven) || 0), 0);
  const pendingCount = dispatches.filter(d => d.status === "Given").length;

  const inputStyle = { width: "100%", padding: "8px 12px", background: "var(--bg-card)", border: "1px solid var(--border-color)", borderRadius: "8px", color: "var(--text-primary)", fontSize: "0.85rem" };
  const labelStyle = { fontSize: "0.75rem", color: "var(--text-secondary)", marginBottom: "4px", display: "block" };

  return (
    <div style={{ padding: "24px" }}>
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: "20px" }}>
        <div>
          <h2 style={{ fontSize: "1.4rem", fontWeight: "800" }}>ALISTON Raw Material Inventory</h2>
          <p style={{ fontSize: "0.8rem", color: "var(--text-muted)" }}>Track fabric, accessories & factory fabric dispatch records</p>
        </div>
        <div style={{ display: "flex", gap: "10px" }}>
          <button className="btn btn-secondary" onClick={() => { const d = materials.map(m => ({ "Material Name": m.name, "Category": m.category, "Unit": m.unit, "Rate (₹)": m.rate, "Current Stock": m.currentStock, "Min Stock": m.minStock, "Value (₹)": ((m.currentStock||0)*(m.rate||0)).toFixed(2) })); exportToExcel(d, "ALISTON_Material_Inventory.xlsx"); }}>Export Excel</button>
          <button className="btn btn-secondary" style={{ background: "linear-gradient(135deg,#7c3aed,#4f46e5)", color: "#fff", border: "none" }} onClick={() => setShowDispatchModal(true)}><Factory size={15} /> Give Fabric to Factory</button>
          <button className="btn btn-primary" onClick={handleOpenAddModal}><Plus size={15} /> Add Material</button>
        </div>
      </div>

      {/* KPI Cards */}
      <div style={{ display: "grid", gridTemplateColumns: "repeat(4,1fr)", gap: "14px", marginBottom: "20px" }}>
        {[
          { label: "Total Inventory Value", value: "₹" + totalVal.toLocaleString("en-IN", { maximumFractionDigits: 0 }), color: "var(--accent-gold)" },
          { label: "Total Materials", value: materials.length + " Items", color: "#3fb950" },
          { label: "Low Stock Alerts", value: materials.filter(m => m.currentStock < m.minStock).length + " Items", color: "#f85149" },
          { label: "Fabric Pending at Factories", value: pendingCount + " Records (" + totalFabricGiven.toFixed(1) + " m)", color: "#a78bfa" }
        ].map((k, i) => (
          <div key={i} className="card" style={{ padding: "16px 18px", background: "linear-gradient(135deg,#161b22,#0d1117)" }}>
            <div style={{ fontSize: "0.75rem", color: "var(--text-secondary)" }}>{k.label}</div>
            <div className="mono" style={{ fontSize: "1.2rem", fontWeight: "800", color: k.color, marginTop: "4px" }}>{k.value}</div>
          </div>
        ))}
      </div>

      {/* Tabs */}
      <div style={{ display: "flex", gap: "4px", marginBottom: "18px", borderBottom: "1px solid var(--border-color)", paddingBottom: "2px" }}>
        {[["inventory", "📦 Material Inventory"], ["dispatches", "🏭 Fabric to Factory"]].map(([tab, label]) => (
          <button key={tab} onClick={() => setActiveTab(tab)} style={{ padding: "8px 18px", borderRadius: "8px 8px 0 0", border: "none", cursor: "pointer", fontWeight: "700", fontSize: "0.85rem", background: activeTab === tab ? "var(--accent-gold)" : "transparent", color: activeTab === tab ? "#000" : "var(--text-muted)", transition: "all 0.2s" }}>{label}</button>
        ))}
      </div>

      {activeTab === "inventory" && (
        <>
          <div className="card" style={{ padding: "12px 18px", marginBottom: "18px", display: "flex", alignItems: "center", gap: "14px", flexWrap: "wrap" }}>
            <div style={{ display: "flex", alignItems: "center", gap: "8px", flex: 1 }}>
              <Search size={15} color="var(--text-muted)" />
              <input type="text" placeholder="Search material..." value={searchTerm} onChange={e => setSearchTerm(e.target.value)} style={{ ...inputStyle, border: "none", background: "transparent" }} />
            </div>
            <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
              <Filter size={15} color="var(--text-muted)" />
              <select value={filterCategory} onChange={e => setFilterCategory(e.target.value)} style={inputStyle}>
                <option value="ALL">All Categories</option>
                {categories.map(c => <option key={c} value={c}>{c}</option>)}
              </select>
            </div>
          </div>
          <div className="erp-table-container">
            <table className="erp-table">
              <thead><tr><th>Material Name</th><th>Category</th><th>Unit</th><th>Rate (₹)</th><th>Current Stock</th><th>Min Reorder</th><th>Stock Value (₹)</th><th>Status</th><th style={{ textAlign: "center" }}>Actions</th></tr></thead>
              <tbody>
                {filteredMaterials.map(m => {
                  const val = (m.currentStock || 0) * (m.rate || 0);
                  const isLow = m.currentStock < m.minStock;
                  return (
                    <tr key={m.id}>
                      <td style={{ fontWeight: "700" }}>{m.name}</td>
                      <td><span className="badge badge-gold">{m.category}</span></td>
                      <td><span className="badge badge-blue">{m.unit}</span></td>
                      <td className="mono">₹{m.rate}</td>
                      <td className="mono" style={{ fontWeight: "800", color: isLow ? "#f85149" : "var(--text-primary)" }}>{m.currentStock} {m.unit}</td>
                      <td className="mono" style={{ color: "var(--text-muted)" }}>{m.minStock} {m.unit}</td>
                      <td className="mono" style={{ fontWeight: "800", color: "#3fb950" }}>₹{val.toFixed(2)}</td>
                      <td>{isLow ? <span className="badge badge-red"><AlertTriangle size={11} /> REORDER</span> : <span className="badge badge-green">IN STOCK</span>}</td>
                      <td style={{ textAlign: "center" }}>
                        <div style={{ display: "flex", gap: "6px", justifyContent: "center" }}>
                          <button className="btn btn-sm" style={{ background: "var(--accent-gold)", color: "#000", padding: "4px 8px" }} onClick={() => handleEditMaterial(m)}><Edit size={13} /></button>
                          <button className="btn btn-sm" style={{ background: "#dc2626", color: "#fff", padding: "4px 8px" }} onClick={() => handleDeleteMaterial(m.id)}><Trash2 size={13} /></button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
                {filteredMaterials.length === 0 && <tr><td colSpan={9} style={{ textAlign: "center", padding: "32px", color: "var(--text-muted)" }}>No materials found. Add your first material.</td></tr>}
              </tbody>
            </table>
          </div>
        </>
      )}

      {activeTab === "dispatches" && (
        <>
          <div className="card" style={{ padding: "12px 18px", marginBottom: "18px", display: "flex", alignItems: "center", gap: "8px" }}>
            <Search size={15} color="var(--text-muted)" />
            <input type="text" placeholder="Search by factory, owner, fabric, shirt name..." value={dispatchFilter} onChange={e => setDispatchFilter(e.target.value)} style={{ ...inputStyle, border: "none", background: "transparent", flex: 1 }} />
            <button className="btn btn-sm" style={{ background: "linear-gradient(135deg,#7c3aed,#4f46e5)", color: "#fff", border: "none", padding: "6px 14px", borderRadius: "8px", fontWeight: "700" }} onClick={() => setShowDispatchModal(true)}><Plus size={13} /> New Dispatch</button>
          </div>
          <div className="erp-table-container">
            <table className="erp-table">
              <thead>
                <tr>
                  <th>Date Given</th>
                  <th>Fabric Name</th>
                  <th>Qty Given</th>
                  <th>Factory Name</th>
                  <th>Owner Name</th>
                  <th>Contact</th>
                  <th>Shirt / Product</th>
                  <th>Expected Return</th>
                  <th>Factory Address</th>
                  <th>Remarks</th>
                  <th>Status</th>
                  <th style={{ textAlign: "center" }}>Actions</th>
                </tr>
              </thead>
              <tbody>
                {filteredDispatches.map(d => (
                  <tr key={d.id}>
                    <td className="mono" style={{ fontSize: "0.8rem" }}>{d.dateGiven}</td>
                    <td style={{ fontWeight: "700", color: "var(--accent-gold)" }}>{d.fabricName}</td>
                    <td className="mono" style={{ fontWeight: "800", color: "#a78bfa" }}>{d.qtyGiven} {d.unit}</td>
                    <td style={{ fontWeight: "700" }}>{d.factoryName}</td>
                    <td>{d.factoryOwnerName}</td>
                    <td className="mono" style={{ fontSize: "0.8rem" }}>{d.factoryContact || "—"}</td>
                    <td><span className="badge badge-blue">{d.shirtName}</span></td>
                    <td className="mono" style={{ fontSize: "0.8rem", color: d.expectedReturnDate && new Date(d.expectedReturnDate) < new Date() && d.status === "Given" ? "#f85149" : "var(--text-muted)" }}>{d.expectedReturnDate || "—"}</td>
                    <td style={{ fontSize: "0.78rem", color: "var(--text-muted)", maxWidth: "140px", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{d.factoryAddress || "—"}</td>
                    <td style={{ fontSize: "0.78rem", color: "var(--text-muted)" }}>{d.remarks || "—"}</td>
                    <td>
                      {d.status === "Given"
                        ? <span className="badge badge-gold">🏭 With Factory</span>
                        : <span className="badge badge-green">✓ Received Back</span>}
                    </td>
                    <td style={{ textAlign: "center" }}>
                      <div style={{ display: "flex", gap: "6px", justifyContent: "center" }}>
                        {d.status === "Given" && <button className="btn btn-sm" style={{ background: "#3fb950", color: "#000", padding: "4px 8px", fontSize: "0.7rem", fontWeight: "700" }} onClick={() => handleMarkReceived(d.id)}>Received</button>}
                        <button className="btn btn-sm" style={{ background: "#dc2626", color: "#fff", padding: "4px 8px" }} onClick={() => handleDeleteDispatch(d.id)}><Trash2 size={12} /></button>
                      </div>
                    </td>
                  </tr>
                ))}
                {filteredDispatches.length === 0 && <tr><td colSpan={12} style={{ textAlign: "center", padding: "32px", color: "var(--text-muted)" }}>No fabric dispatch records. Click "Give Fabric to Factory" to add.</td></tr>}
              </tbody>
            </table>
          </div>
        </>
      )}

      {/* Add Material Modal */}
      {showAddModal && (
        <div className="modal-overlay">
          <div className="modal-content" style={{ maxWidth: "500px" }}>
            <div className="modal-header">
              <h3>{editingMaterial ? "Edit" : "Add"} Raw Material</h3>
              <button onClick={() => setShowAddModal(false)} style={{ background: "none", color: "var(--text-muted)" }}>✕</button>
            </div>
            <form onSubmit={handleAddMaterial}>
              <div className="modal-body" style={{ display: "flex", flexDirection: "column", gap: "12px" }}>
                <div><label style={labelStyle}>Material Name *</label><input style={inputStyle} required type="text" value={newMaterial.name} onChange={e => setNewMaterial({ ...newMaterial, name: e.target.value })} placeholder="e.g. Linen Pure 60 Lea - Navy" /></div>
                <div><label style={labelStyle}>Category</label><select style={inputStyle} value={newMaterial.category} onChange={e => setNewMaterial({ ...newMaterial, category: e.target.value })}>{categories.map(c => <option key={c} value={c}>{c}</option>)}</select></div>
                <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "10px" }}>
                  <div><label style={labelStyle}>Unit Rate (₹)</label><input style={inputStyle} type="number" step="0.1" value={newMaterial.rate || ""} placeholder="0" onChange={e => setNewMaterial({ ...newMaterial, rate: parseFloat(e.target.value) || 0 })} /></div>
                  <div><label style={labelStyle}>Unit Type</label><input style={inputStyle} type="text" value={newMaterial.unit} onChange={e => setNewMaterial({ ...newMaterial, unit: e.target.value })} placeholder="metre / Gross / piece" /></div>
                </div>
                <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "10px" }}>
                  <div><label style={labelStyle}>Opening Stock</label><input style={inputStyle} type="number" value={newMaterial.currentStock || ""} placeholder="0" onChange={e => setNewMaterial({ ...newMaterial, currentStock: parseFloat(e.target.value) || 0 })} /></div>
                  <div><label style={labelStyle}>Min Reorder Level</label><input style={inputStyle} type="number" value={newMaterial.minStock || ""} placeholder="0" onChange={e => setNewMaterial({ ...newMaterial, minStock: parseFloat(e.target.value) || 0 })} /></div>
                </div>
              </div>
              <div className="modal-footer">
                <button type="button" className="btn btn-secondary" onClick={() => setShowAddModal(false)}>Cancel</button>
                <button type="submit" className="btn btn-primary">Save Material</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Fabric Dispatch Modal */}
      {showDispatchModal && (
        <div className="modal-overlay">
          <div className="modal-content" style={{ maxWidth: "620px" }}>
            <div className="modal-header" style={{ background: "linear-gradient(135deg,#7c3aed22,#4f46e522)", borderBottom: "1px solid #7c3aed44" }}>
              <h3 style={{ color: "#a78bfa" }}>🏭 Give Fabric to Factory</h3>
              <button onClick={() => setShowDispatchModal(false)} style={{ background: "none", color: "var(--text-muted)" }}>✕</button>
            </div>
            <form onSubmit={handleAddDispatch}>
              <div className="modal-body" style={{ display: "flex", flexDirection: "column", gap: "12px" }}>
                <div style={{ background: "#7c3aed11", border: "1px solid #7c3aed33", borderRadius: "8px", padding: "10px 14px" }}>
                  <div style={{ fontSize: "0.75rem", color: "#a78bfa", fontWeight: "700", marginBottom: "6px" }}>FABRIC DETAILS</div>
                  <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "10px" }}>
                    <div>
                      <label style={labelStyle}>Select Fabric *</label>
                      <select required style={inputStyle} value={newDispatch.fabricMaterialId} onChange={e => { const f = materials.find(m => m.id === e.target.value); setNewDispatch({ ...newDispatch, fabricMaterialId: e.target.value, fabricName: f ? f.name : "", unit: f ? f.unit : "metre" }); }}>
                        <option value="">-- Select Fabric --</option>
                        {fabricMaterials.map(m => <option key={m.id} value={m.id}>{m.name} (Avail: {m.currentStock} {m.unit})</option>)}
                      </select>
                    </div>
                    <div>
                      <label style={labelStyle}>Qty to Give *</label>
                      <input required style={inputStyle} type="number" step="0.01" min="0.01" value={newDispatch.qtyGiven} onChange={e => setNewDispatch({ ...newDispatch, qtyGiven: e.target.value })} placeholder={"in " + newDispatch.unit} />
                    </div>
                  </div>
                  <div style={{ marginTop: "8px" }}>
                    <label style={labelStyle}>Shirt / Product Name Being Made *</label>
                    <input required style={inputStyle} type="text" value={newDispatch.shirtName} onChange={e => setNewDispatch({ ...newDispatch, shirtName: e.target.value })} placeholder="e.g. Linen Casual Shirt - Navy Blue" />
                  </div>
                </div>
                <div style={{ background: "#0d1117", border: "1px solid var(--border-color)", borderRadius: "8px", padding: "10px 14px" }}>
                  <div style={{ fontSize: "0.75rem", color: "var(--accent-gold)", fontWeight: "700", marginBottom: "6px" }}>FACTORY DETAILS</div>
                  <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "10px" }}>
                    <div><label style={labelStyle}>Factory Owner Name *</label><input required style={inputStyle} type="text" value={newDispatch.factoryOwnerName} onChange={e => setNewDispatch({ ...newDispatch, factoryOwnerName: e.target.value })} placeholder="Owner's full name" /></div>
                    <div><label style={labelStyle}>Factory Name *</label><input required style={inputStyle} type="text" value={newDispatch.factoryName} onChange={e => setNewDispatch({ ...newDispatch, factoryName: e.target.value })} placeholder="Factory / Workshop name" /></div>
                    <div><label style={labelStyle}>Contact Number</label><input style={inputStyle} type="text" value={newDispatch.factoryContact} onChange={e => setNewDispatch({ ...newDispatch, factoryContact: e.target.value })} placeholder="+91 XXXXXXXXXX" /></div>
                    <div><label style={labelStyle}>Factory Address</label><input style={inputStyle} type="text" value={newDispatch.factoryAddress} onChange={e => setNewDispatch({ ...newDispatch, factoryAddress: e.target.value })} placeholder="City / Area" /></div>
                  </div>
                </div>
                <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: "10px" }}>
                  <div><label style={labelStyle}>Date Given *</label><input required style={inputStyle} type="date" value={newDispatch.dateGiven} onChange={e => setNewDispatch({ ...newDispatch, dateGiven: e.target.value })} /></div>
                  <div><label style={labelStyle}>Expected Return Date</label><input style={inputStyle} type="date" value={newDispatch.expectedReturnDate} onChange={e => setNewDispatch({ ...newDispatch, expectedReturnDate: e.target.value })} /></div>
                  <div><label style={labelStyle}>Status</label><select style={inputStyle} value={newDispatch.status} onChange={e => setNewDispatch({ ...newDispatch, status: e.target.value })}><option value="Given">Given to Factory</option><option value="Received Back">Received Back</option></select></div>
                </div>
                <div><label style={labelStyle}>Remarks / Notes</label><textarea style={{ ...inputStyle, height: "60px", resize: "vertical" }} value={newDispatch.remarks} onChange={e => setNewDispatch({ ...newDispatch, remarks: e.target.value })} placeholder="Any additional notes..." /></div>
              </div>
              <div className="modal-footer">
                <button type="button" className="btn btn-secondary" onClick={() => setShowDispatchModal(false)}>Cancel</button>
                <button type="submit" style={{ background: "linear-gradient(135deg,#7c3aed,#4f46e5)", color: "#fff", border: "none", padding: "8px 20px", borderRadius: "8px", fontWeight: "700", cursor: "pointer" }}>Record Fabric Dispatch</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
