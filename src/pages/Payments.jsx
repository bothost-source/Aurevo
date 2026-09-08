import { plans, mockPaymentHistory } from "../services/mockData.js";

export default function Payments() {
  return (
    <div className="page">
      <div className="page-header">
        <div>
          <h1>Plan & billing</h1>
          <p>Prices shown in your local currency at checkout via Stripe/Paystack — wire your real price IDs in before launch.</p>
        </div>
      </div>

      <div className="grid" style={{ gridTemplateColumns: "repeat(auto-fit,minmax(200px,1fr))" }}>
        {plans.map((p) => (
          <div key={p.id} className="glass" style={{ padding: 20 }}>
            <strong style={{ color: "var(--ink-000)", fontSize: "1.1rem" }}>{p.label}</strong>
            <p style={{ fontFamily: "var(--font-display)", fontSize: "1.6rem", margin: "10px 0", color: "var(--signal-400)" }}>{p.price}</p>
            <p style={{ color: "var(--ink-500)", fontSize: "0.8rem", margin: "0 0 16px" }}>{p.billing}</p>
            <button className="btn btn-primary" style={{ width: "100%" }}>Choose {p.label}</button>
          </div>
        ))}
      </div>

      <h2 className="section-title">Payment history</h2>
      <div className="glass" style={{ padding: 4 }}>
        <table style={{ width: "100%", borderCollapse: "collapse" }}>
          <thead>
            <tr style={{ textAlign: "left", color: "var(--ink-500)", fontSize: "0.78rem" }}>
              <th style={{ padding: 12 }}>Date</th>
              <th style={{ padding: 12 }}>Plan</th>
              <th style={{ padding: 12 }}>Amount</th>
              <th style={{ padding: 12 }}>Status</th>
            </tr>
          </thead>
          <tbody>
            {mockPaymentHistory.map((row) => (
              <tr key={row.id} style={{ borderTop: "1px solid var(--glass-border)" }}>
                <td style={{ padding: 12, fontSize: "0.85rem" }}>{row.date}</td>
                <td style={{ padding: 12, fontSize: "0.85rem" }}>{row.plan}</td>
                <td style={{ padding: 12, fontSize: "0.85rem" }}>{row.currency} {row.amount}</td>
                <td style={{ padding: 12, fontSize: "0.85rem", color: row.status === "confirmed" ? "var(--good-500)" : "var(--bad-500)" }}>
                  {row.status}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
