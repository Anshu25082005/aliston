import React, { useState } from "react";
import { getData } from "../db/storage";
import { exportToExcel } from "../utils/excelExporter";
import { Download, TrendingUp, TrendingDown, AlertCircle } from "lucide-react";

export const GSTLedgerView = () => {
  const invoices = getData("INVOICES") || [];
  const purchases = getData("PURCHASES") || [];

  const [filterMonth, setFilterMonth] = useState("");
  const [activeTab, setActiveTab] = useState("summary");

  // ── helpers ──────────────────────────────────────────────────────────────
  const toM = (dateStr) => (dateStr || "").slice(0, 7); // "YYYY-MM"
  const fmt = (n) => (parseFloat(n) || 0).toFixed(2);
  const fmtIN = (n) => (parseFloat(n) || 0).toLocaleString("en-IN", { maximumFractionDigits: 2 });
  const S = { width: "100%", padding: "8px 12px", background: "var(--bg-card)", border: "1px solid var(--border-color)", borderRadius: "8px", color: "var(--text-primary)", fontSize: "0.85rem" };
  const L = { fontSize: "0.72rem", color: "var(--text-secondary)", marginBottom: "4px", display: "block" };

  // ── OUTPUT TAX from Sales Invoices ────────────────────────────────────────
  const outputRows = [];
  invoices.forEach(inv => {
    (inv.items || []).forEach(it => {
      const taxable = parseFloat(it.taxableAmt) || 0;
      const gst = parseFloat(it.gstAmt) || 0;
      const rate = it.gstPercent || it.gstRate || 12;
      outputRows.push({
        date: inv.date,
        month: toM(inv.date),
        refNo: inv.invoiceNo,
        party: inv.customerName,
        description: it.productName + (it.color ? " / " + it.color : ""),
        gstRate: rate,
        taxableAmt: taxable,
        cgst: gst / 2,
        sgst: gst / 2,
        igst: 0,
        totalGST: gst,
        type: "OUTPUT"
      });
    });
    // handle invoice-level GST if no items
    if (!(inv.items || []).length && inv.gstAmount) {
      outputRows.push({
        date: inv.date, month: toM(inv.date), refNo: inv.invoiceNo,
        party: inv.customerName, description: "Sales Invoice",
        gstRate: inv.gstPercent || 12,
        taxableAmt: parseFloat(inv.taxableTotal) || 0,
        cgst: (parseFloat(inv.gstAmount) || 0) / 2,
        sgst: (parseFloat(inv.gstAmount) || 0) / 2,
        igst: 0,
        totalGST: parseFloat(inv.gstAmount) || 0,
        type: "OUTPUT"
      });
    }
  });

  // ── INPUT TAX CREDIT from Purchases ──────────────────────────────────────
  const inputRows = purchases.map(p => {
    const gst = parseFloat(p.gstAmount) || 0;
    return {
      date: p.date, month: toM(p.date), refNo: p.purchaseNo,
      party: p.supplierName, description: p.material,
      gstRate: p.gstPercent || 5,
      taxableAmt: parseFloat(p.subtotal) || 0,
      cgst: gst / 2, sgst: gst / 2, igst: 0,
      totalGST: gst,
      type: "INPUT"
    };
  });

  // ── filter by month ───────────────────────────────────────────────────────
  const filtOut = filterMonth ? outputRows.filter(r => r.month === filterMonth) : outputRows;
  const filtIn  = filterMonth ? inputRows.filter(r => r.month === filterMonth)  : inputRows;

  // ── totals ────────────────────────────────────────────────────────────────
  const sumOut  = filtOut.reduce((a, r) => a + r.totalGST, 0);
  const sumIn   = filtIn.reduce((a, r) => a + r.totalGST, 0);
  const netPayable = sumOut - sumIn;

  // ── month-wise summary ────────────────────────────────────────────────────
  const allMonths = [...new Set([...outputRows.map(r => r.month), ...inputRows.map(r => r.month)])].sort().reverse();
  const monthSummary = allMonths.map(m => {
    const o = outputRows.filter(r => r.month === m).reduce((a, r) => a + r.totalGST, 0);
    const i = inputRows.filter(r => r.month === m).reduce((a, r) => a + r.totalGST, 0);
    return { month: m, output: o, input: i, net: o - i };
  });

  // ── unique months for filter ──────────────────────────────────────────────
  const monthOptions = allMonths;

  // ── rate-wise breakup ─────────────────────────────────────────────────────
  const rateBreakup = {};
  [...filtOut, ...filtIn].forEach(r => {
    const k = r.gstRate + "%";
    if (!rateBreakup[k]) rateBreakup[k] = { rate: r.gstRate, outputTaxable: 0, outputGST: 0, inputTaxable: 0, inputGST: 0 };
    if (r.type === "OUTPUT") { rateBreakup[k].outputTaxable += r.taxableAmt; rateBreakup[k].outputGST += r.totalGST; }
    else { rateBreakup[k].inputTaxable += r.taxableAmt; rateBreakup[k].inputGST += r.totalGST; }
  });

  // ── export ────────────────────────────────────────────────────────────────
  const handleExport = () => {
    const rows = [
      ...filtOut.map(r => ({ Type: "OUTPUT (Sales)", ...r })),
      ...filtIn.map(r => ({ Type: "INPUT / ITC (Purchase)", ...r }))
    ];
    exportToExcel(rows, "ALISTON_GST_Ledger.xlsx");
  };

  const tabBtn = (id, label) => (
    <button onClick={() => setActiveTab(id)} style={{ padding: "8px 18px", borderRadius: "8px 8px 0 0", border: "none", cursor: "pointer", fontWeight: "700", fontSize: "0.85rem", background: activeTab === id ? "var(--accent-gold)" : "transparent", color: activeTab === id ? "#000" : "var(--text-muted)", transition: "all 0.2s" }}>{label}</button>
  );

  const kpi = (label, value, color, sub) => (
    <div className="card" style={{ padding: "18px 20px", background: "linear-gradient(135deg,#161b22,#0d1117)" }}>
      <div style={{ fontSize: "0.75rem", color: "var(--text-secondary)" }}>{label}</div>
      <div className="mono" style={{ fontSize: "1.35rem", fontWeight: "800", color, marginTop: "6px" }}>₹{fmtIN(value)}</div>
      {sub && <div style={{ fontSize: "0.72rem", color: "var(--text-muted)", marginTop: "4px" }}>{sub}</div>}
    </div>
  );

  return (
    <div style={{ padding: "24px" }}>
      {/* Header */}
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: "20px" }}>
        <div>
          <h2 style={{ fontSize: "1.4rem", fontWeight: "800" }}>GST Ledger — Input vs Output Tax</h2>
          <p style={{ fontSize: "0.8rem", color: "var(--text-muted)" }}>GSTR-3B style summary · Output Tax (Sales) vs Input Tax Credit ITC (Purchases) · Net GST Payable to Govt</p>
        </div>
        <div style={{ display: "flex", gap: "10px", alignItems: "center" }}>
          <div>
            <select style={{ ...S, width: "auto" }} value={filterMonth} onChange={e => setFilterMonth(e.target.value)}>
              <option value="">All Months</option>
              {monthOptions.map(m => <option key={m} value={m}>{m}</option>)}
            </select>
          </div>
          <button className="btn btn-secondary" onClick={handleExport}><Download size={14} /> Export GST Excel</button>
        </div>
      </div>

      {/* KPI Cards */}
      <div style={{ display: "grid", gridTemplateColumns: "repeat(4,1fr)", gap: "14px", marginBottom: "20px" }}>
        {kpi("🟢 GST Output Tax (You Collected)", sumOut, "#3fb950", "GST collected from customers on sales")}
        {kpi("🔵 GST Input Tax Credit (ITC)", sumIn, "#60a5fa", "GST paid to suppliers — claimable as ITC")}
        {kpi(netPayable >= 0 ? "🔴 Net GST Payable to Govt" : "🟡 GST Refund / Credit Due", Math.abs(netPayable), netPayable >= 0 ? "#f85149" : "#f59e0b", netPayable >= 0 ? "Output − ITC = Amount to deposit" : "ITC > Output = Carry forward or refund")}
        {kpi("📄 Total Transactions", filtOut.length + filtIn.length, "var(--accent-gold)", filtOut.length + " sales + " + filtIn.length + " purchase entries")}
      </div>

      {/* Net Payable Banner */}
      <div className="card" style={{ padding: "14px 20px", marginBottom: "20px", display: "flex", alignItems: "center", justifyContent: "space-between", background: netPayable >= 0 ? "linear-gradient(135deg,#1e0a0a,#0d1117)" : "linear-gradient(135deg,#0a1e0a,#0d1117)", border: `1px solid ${netPayable >= 0 ? "#f85149" : "#3fb950"}` }}>
        <div style={{ display: "flex", alignItems: "center", gap: "12px" }}>
          {netPayable >= 0 ? <TrendingUp size={22} color="#f85149" /> : <TrendingDown size={22} color="#3fb950" />}
          <div>
            <div style={{ fontWeight: "800", fontSize: "1rem", color: netPayable >= 0 ? "#f85149" : "#3fb950" }}>
              {netPayable >= 0 ? "Net GST Payable to Government" : "Net ITC Credit (Refund / Carry Forward)"}
            </div>
            <div style={{ fontSize: "0.78rem", color: "var(--text-muted)" }}>
              Output GST ₹{fmtIN(sumOut)} &nbsp;−&nbsp; Input ITC ₹{fmtIN(sumIn)} &nbsp;=&nbsp;
              <strong style={{ color: netPayable >= 0 ? "#f85149" : "#3fb950" }}>₹{fmtIN(Math.abs(netPayable))}</strong>
            </div>
          </div>
        </div>
        <div className="mono" style={{ fontSize: "1.6rem", fontWeight: "900", color: netPayable >= 0 ? "#f85149" : "#3fb950" }}>
          {netPayable >= 0 ? "▲" : "▼"} ₹{fmtIN(Math.abs(netPayable))}
        </div>
      </div>

      {/* Tabs */}
      <div style={{ display: "flex", gap: "4px", marginBottom: "18px", borderBottom: "1px solid var(--border-color)", paddingBottom: "2px" }}>
        {tabBtn("summary", "📊 Month-wise Summary")}
        {tabBtn("output", "🟢 Output Tax (Sales GST)")}
        {tabBtn("input", "🔵 Input ITC (Purchase GST)")}
        {tabBtn("ratewise", "📋 Rate-wise Breakup")}
      </div>

      {/* Month-wise Summary */}
      {activeTab === "summary" && (
        <div className="erp-table-container">
          <table className="erp-table">
            <thead>
              <tr>
                <th>Filing Month</th>
                <th>Output GST Collected (₹)</th>
                <th>CGST (Output)</th>
                <th>SGST (Output)</th>
                <th>Input ITC Claimed (₹)</th>
                <th>CGST (ITC)</th>
                <th>SGST (ITC)</th>
                <th>Net GST Payable (₹)</th>
                <th>Status</th>
              </tr>
            </thead>
            <tbody>
              {monthSummary.length === 0 && <tr><td colSpan={9} style={{ textAlign: "center", padding: "30px", color: "var(--text-muted)" }}>No GST data found. Add purchase entries and sales invoices.</td></tr>}
              {monthSummary.map(ms => (
                <tr key={ms.month}>
                  <td style={{ fontWeight: "700" }}>{ms.month}</td>
                  <td className="mono" style={{ color: "#3fb950", fontWeight: "700" }}>₹{fmt(ms.output)}</td>
                  <td className="mono" style={{ color: "#86efac" }}>₹{fmt(ms.output / 2)}</td>
                  <td className="mono" style={{ color: "#86efac" }}>₹{fmt(ms.output / 2)}</td>
                  <td className="mono" style={{ color: "#60a5fa", fontWeight: "700" }}>₹{fmt(ms.input)}</td>
                  <td className="mono" style={{ color: "#93c5fd" }}>₹{fmt(ms.input / 2)}</td>
                  <td className="mono" style={{ color: "#93c5fd" }}>₹{fmt(ms.input / 2)}</td>
                  <td className="mono" style={{ fontWeight: "800", color: ms.net >= 0 ? "#f85149" : "#f59e0b" }}>
                    {ms.net >= 0 ? "" : "−"} ₹{fmt(Math.abs(ms.net))}
                  </td>
                  <td>
                    {ms.net > 0
                      ? <span className="badge badge-red">Pay ₹{fmt(ms.net)}</span>
                      : ms.net < 0
                      ? <span className="badge badge-gold">Credit ₹{fmt(Math.abs(ms.net))}</span>
                      : <span className="badge badge-green">NIL</span>}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* Output Tax Detail */}
      {activeTab === "output" && (
        <div className="erp-table-container">
          <table className="erp-table">
            <thead>
              <tr>
                <th>Date</th>
                <th>Invoice #</th>
                <th>Customer</th>
                <th>Description</th>
                <th>GST Rate</th>
                <th>Taxable Value (₹)</th>
                <th>CGST (₹)</th>
                <th>SGST (₹)</th>
                <th>Total GST (₹)</th>
              </tr>
            </thead>
            <tbody>
              {filtOut.length === 0 && <tr><td colSpan={9} style={{ textAlign: "center", padding: "30px", color: "var(--text-muted)" }}>No sales GST entries found.</td></tr>}
              {filtOut.map((r, i) => (
                <tr key={i}>
                  <td className="mono" style={{ fontSize: "0.8rem" }}>{r.date}</td>
                  <td style={{ fontWeight: "700", color: "var(--accent-gold)" }}>{r.refNo}</td>
                  <td style={{ fontWeight: "600" }}>{r.party}</td>
                  <td style={{ fontSize: "0.8rem", color: "var(--text-secondary)" }}>{r.description}</td>
                  <td><span className="badge badge-blue">{r.gstRate}%</span></td>
                  <td className="mono">₹{fmt(r.taxableAmt)}</td>
                  <td className="mono" style={{ color: "#86efac" }}>₹{fmt(r.cgst)}</td>
                  <td className="mono" style={{ color: "#86efac" }}>₹{fmt(r.sgst)}</td>
                  <td className="mono" style={{ fontWeight: "800", color: "#3fb950" }}>₹{fmt(r.totalGST)}</td>
                </tr>
              ))}
              {filtOut.length > 0 && (
                <tr style={{ background: "rgba(63,185,80,0.08)", fontWeight: "800" }}>
                  <td colSpan={5} style={{ textAlign: "right", paddingRight: "12px" }}>TOTAL OUTPUT GST</td>
                  <td className="mono">₹{fmt(filtOut.reduce((a, r) => a + r.taxableAmt, 0))}</td>
                  <td className="mono" style={{ color: "#86efac" }}>₹{fmt(sumOut / 2)}</td>
                  <td className="mono" style={{ color: "#86efac" }}>₹{fmt(sumOut / 2)}</td>
                  <td className="mono" style={{ color: "#3fb950", fontSize: "1rem" }}>₹{fmt(sumOut)}</td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      )}

      {/* Input ITC Detail */}
      {activeTab === "input" && (
        <div className="erp-table-container">
          <table className="erp-table">
            <thead>
              <tr>
                <th>Date</th>
                <th>Purchase #</th>
                <th>Supplier</th>
                <th>Material</th>
                <th>GST Rate</th>
                <th>Taxable Value (₹)</th>
                <th>CGST ITC (₹)</th>
                <th>SGST ITC (₹)</th>
                <th>Total ITC (₹)</th>
              </tr>
            </thead>
            <tbody>
              {filtIn.length === 0 && <tr><td colSpan={9} style={{ textAlign: "center", padding: "30px", color: "var(--text-muted)" }}>No purchase GST / ITC entries found.</td></tr>}
              {filtIn.map((r, i) => (
                <tr key={i}>
                  <td className="mono" style={{ fontSize: "0.8rem" }}>{r.date}</td>
                  <td style={{ fontWeight: "700", color: "var(--accent-gold)" }}>{r.refNo}</td>
                  <td style={{ fontWeight: "600" }}>{r.party}</td>
                  <td style={{ fontSize: "0.8rem", color: "var(--text-secondary)" }}>{r.description}</td>
                  <td><span className="badge badge-blue">{r.gstRate}%</span></td>
                  <td className="mono">₹{fmt(r.taxableAmt)}</td>
                  <td className="mono" style={{ color: "#93c5fd" }}>₹{fmt(r.cgst)}</td>
                  <td className="mono" style={{ color: "#93c5fd" }}>₹{fmt(r.sgst)}</td>
                  <td className="mono" style={{ fontWeight: "800", color: "#60a5fa" }}>₹{fmt(r.totalGST)}</td>
                </tr>
              ))}
              {filtIn.length > 0 && (
                <tr style={{ background: "rgba(96,165,250,0.08)", fontWeight: "800" }}>
                  <td colSpan={5} style={{ textAlign: "right", paddingRight: "12px" }}>TOTAL ITC CLAIMABLE</td>
                  <td className="mono">₹{fmt(filtIn.reduce((a, r) => a + r.taxableAmt, 0))}</td>
                  <td className="mono" style={{ color: "#93c5fd" }}>₹{fmt(sumIn / 2)}</td>
                  <td className="mono" style={{ color: "#93c5fd" }}>₹{fmt(sumIn / 2)}</td>
                  <td className="mono" style={{ color: "#60a5fa", fontSize: "1rem" }}>₹{fmt(sumIn)}</td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      )}

      {/* Rate-wise Breakup */}
      {activeTab === "ratewise" && (
        <div className="erp-table-container">
          <table className="erp-table">
            <thead>
              <tr>
                <th>GST Slab</th>
                <th>Taxable Sales (₹)</th>
                <th>Output GST (₹)</th>
                <th>Output CGST</th>
                <th>Output SGST</th>
                <th>Taxable Purchases (₹)</th>
                <th>Input ITC (₹)</th>
                <th>ITC CGST</th>
                <th>ITC SGST</th>
                <th>Net Payable (₹)</th>
              </tr>
            </thead>
            <tbody>
              {Object.keys(rateBreakup).sort((a, b) => parseFloat(a) - parseFloat(b)).map(k => {
                const rb = rateBreakup[k];
                const net = rb.outputGST - rb.inputGST;
                return (
                  <tr key={k}>
                    <td><span className="badge badge-gold" style={{ fontSize: "0.85rem", padding: "4px 10px" }}>{k} GST</span></td>
                    <td className="mono">₹{fmt(rb.outputTaxable)}</td>
                    <td className="mono" style={{ color: "#3fb950", fontWeight: "700" }}>₹{fmt(rb.outputGST)}</td>
                    <td className="mono" style={{ color: "#86efac" }}>₹{fmt(rb.outputGST / 2)}</td>
                    <td className="mono" style={{ color: "#86efac" }}>₹{fmt(rb.outputGST / 2)}</td>
                    <td className="mono">₹{fmt(rb.inputTaxable)}</td>
                    <td className="mono" style={{ color: "#60a5fa", fontWeight: "700" }}>₹{fmt(rb.inputGST)}</td>
                    <td className="mono" style={{ color: "#93c5fd" }}>₹{fmt(rb.inputGST / 2)}</td>
                    <td className="mono" style={{ color: "#93c5fd" }}>₹{fmt(rb.inputGST / 2)}</td>
                    <td className="mono" style={{ fontWeight: "800", color: net >= 0 ? "#f85149" : "#f59e0b" }}>
                      {net < 0 ? "−" : ""}₹{fmt(Math.abs(net))}
                    </td>
                  </tr>
                );
              })}
              {Object.keys(rateBreakup).length === 0 && <tr><td colSpan={10} style={{ textAlign: "center", padding: "30px", color: "var(--text-muted)" }}>No GST data available.</td></tr>}
            </tbody>
          </table>
        </div>
      )}

      {/* GST Rules Reference */}
      <div className="card" style={{ marginTop: "24px", padding: "16px 20px", background: "linear-gradient(135deg,#0a0e1a,#0d1117)", border: "1px solid #1e3a5f" }}>
        <div style={{ fontWeight: "800", fontSize: "0.85rem", color: "#60a5fa", marginBottom: "10px" }}>📘 GST Rules Applied (Garment / Textile Industry)</div>
        <div style={{ display: "grid", gridTemplateColumns: "repeat(3,1fr)", gap: "10px", fontSize: "0.78rem", color: "var(--text-secondary)" }}>
          {[
            ["5% GST", "Fabric (cotton, linen, polyester) under ₹1000/piece"],
            ["12% GST", "Readymade garments / shirts above ₹1000"],
            ["18% GST", "Packing material, cartons, accessories"],
            ["CGST + SGST", "For intra-state (within Gujarat/same state) transactions"],
            ["IGST", "For inter-state transactions (different state customers)"],
            ["ITC Rule", "ITC claimable only if supplier files GSTR-1 & you have tax invoice"]
          ].map(([title, desc]) => (
            <div key={title} style={{ background: "rgba(255,255,255,0.02)", borderRadius: "6px", padding: "8px 12px", borderLeft: "3px solid #1e40af" }}>
              <div style={{ fontWeight: "700", color: "#93c5fd", marginBottom: "3px" }}>{title}</div>
              <div>{desc}</div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};
