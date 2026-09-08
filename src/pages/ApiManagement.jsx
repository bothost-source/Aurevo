import { useState } from "react";

const mockKeys = [
  { id: "key_1", label: "Production", createdAt: "2026-05-02", tier: "Free", usedToday: 6, limitPerDay: 10 },
];

export default function ApiManagement() {
  const [keys, setKeys] = useState(mockKeys);

  function generateKey() {
    // Replace with a real call to your backend, which should generate and
    // store the key server-side — never mint API credentials in the browser.
    setKeys((k) => [
      ...k,
      { id: `key_${k.length + 1}`, label: `Key ${k.length + 1}`, createdAt: new Date().toISOString().slice(0, 10), tier: "Free", usedToday: 0, limitPerDay: 10 },
    ]);
  }

  return (
    <div className="page">
      <div className="page-header">
        <div>
          <h1>Developer API</h1>
          <p>Free tier: 10 requests a day per category. Paid tier: unlimited, billed with your Aurevo plan.</p>
        </div>
        <button className="btn btn-primary" onClick={generateKey}>Generate new key</button>
      </div>

      <div className="glass" style={{ padding: 4 }}>
        <table style={{ width: "100%", borderCollapse: "collapse" }}>
          <thead>
            <tr style={{ textAlign: "left", color: "var(--ink-500)", fontSize: "0.78rem" }}>
              <th style={{ padding: 12 }}>Label</th>
              <th style={{ padding: 12 }}>Created</th>
              <th style={{ padding: 12 }}>Tier</th>
              <th style={{ padding: 12 }}>Today's usage</th>
            </tr>
          </thead>
          <tbody>
            {keys.map((k) => (
              <tr key={k.id} style={{ borderTop: "1px solid var(--glass-border)" }}>
                <td style={{ padding: 12, fontSize: "0.85rem" }}>{k.label}</td>
                <td style={{ padding: 12, fontSize: "0.85rem" }}>{k.createdAt}</td>
                <td style={{ padding: 12, fontSize: "0.85rem" }}>{k.tier}</td>
                <td style={{ padding: 12, fontSize: "0.85rem" }}>{k.usedToday}/{k.limitPerDay}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
