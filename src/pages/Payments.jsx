import { useEffect, useState } from "react";
import { PLANS } from "../services/plans.js";
import {
  startCardCheckout,
  getUsdtPaymentDetails,
  confirmUsdtPayment,
  submitUsdtProof,
  fetchPaymentHistory,
} from "../services/paymentsClient.js";
import { useAuth } from "../context/AuthContext.jsx";

const AFRICAN_COUNTRY_CODES = ["NG", "GH", "KE", "ZA"];

export default function Payments() {
  const { user } = useAuth();
  const [selectedPlan, setSelectedPlan] = useState(PLANS[2].id);
  const [method, setMethod] = useState("card");
  const [history, setHistory] = useState([]);
  const [historyLoaded, setHistoryLoaded] = useState(false);

  const isAfrican = AFRICAN_COUNTRY_CODES.includes(user?.country);

  useEffect(() => {
    fetchPaymentHistory().then((rows) => {
      setHistory(rows);
      setHistoryLoaded(true);
    });
  }, []);

  return (
    <div className="page">
      <div className="page-header">
        <div>
          <h1>Plan &amp; billing</h1>
          <p>Choose a plan, then pay by card or USDT. {isAfrican && "Nigerian, Ghanaian, Kenyan and South African users can also pay by bank transfer or USSD in the card checkout."}</p>
        </div>
      </div>

      <h2 className="section-title">1. Choose a plan</h2>
      <div className="grid" style={{ gridTemplateColumns: "repeat(auto-fit,minmax(200px,1fr))" }}>
        {PLANS.map((p) => (
          <button
            key={p.id}
            onClick={() => setSelectedPlan(p.id)}
            className="glass"
            style={{
              padding: 20, textAlign: "left", cursor: "pointer",
              border: selectedPlan === p.id ? "1px solid var(--aurora-400)" : undefined,
              boxShadow: selectedPlan === p.id ? "0 0 0 3px var(--aurora-glow)" : undefined,
            }}
          >
            <strong style={{ color: "var(--ink-000)", fontSize: "1.1rem" }}>{p.label}</strong>
            <p style={{ fontFamily: "var(--font-display)", fontSize: "1.6rem", margin: "10px 0", color: "var(--signal-400)" }}>
              ${p.amount.toFixed(2)}
            </p>
            <p style={{ color: "var(--ink-500)", fontSize: "0.8rem", margin: 0 }}>{p.billing}</p>
          </button>
        ))}
      </div>

      <h2 className="section-title">2. Choose how to pay</h2>
      <div className="grid" style={{ gridTemplateColumns: "repeat(auto-fit,minmax(200px,1fr))" }}>
        <PaymentMethodOption id="card" selected={method === "card"} onSelect={setMethod} title="Card"
          desc={isAfrican ? "Visa, Mastercard, Verve — plus bank transfer, USSD" : "Visa, Mastercard"} />
        <PaymentMethodOption id="usdt" selected={method === "usdt"} onSelect={setMethod} title="USDT" desc="Pay with crypto (TRC20)" />
      </div>

      <div style={{ marginTop: 24 }}>
        {method === "card" ? (
          <CardCheckout planId={selectedPlan} user={user} />
        ) : (
          <UsdtCheckout planId={selectedPlan} user={user} onConfirmed={() => fetchPaymentHistory().then(setHistory)} />
        )}
      </div>

      <h2 className="section-title">Payment history</h2>
      <div className="glass" style={{ padding: 20 }}>
        {!historyLoaded && <p className="helper-text">Loading…</p>}
        {historyLoaded && history.length === 0 && <p className="helper-text">No payments yet.</p>}
        {history.length > 0 && (
          <table style={{ width: "100%", borderCollapse: "collapse" }}>
            <thead>
              <tr style={{ textAlign: "left", color: "var(--ink-500)", fontSize: "0.78rem" }}>
                <th style={{ padding: 12 }}>Date</th><th style={{ padding: 12 }}>Plan</th>
                <th style={{ padding: 12 }}>Amount</th><th style={{ padding: 12 }}>Status</th>
              </tr>
            </thead>
            <tbody>
              {history.map((row) => (
                <tr key={row.id} style={{ borderTop: "1px solid var(--glass-border)" }}>
                  <td style={{ padding: 12, fontSize: "0.85rem" }}>{row.date}</td>
                  <td style={{ padding: 12, fontSize: "0.85rem" }}>{row.plan}</td>
                  <td style={{ padding: 12, fontSize: "0.85rem" }}>{row.currency} {row.amount}</td>
                  <td style={{ padding: 12, fontSize: "0.85rem" }}>{row.status}</td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </div>
  );
}

function CardCheckout({ planId, user }) {
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState(null);

  async function handlePay() {
    if (!user) return setError("Sign in first to subscribe.");
    setSubmitting(true);
    setError(null);
    try {
      const { checkoutUrl } = await startCardCheckout({ planId });
      window.location.href = checkoutUrl;
    } catch (e) {
      setError(e.message);
      setSubmitting(false);
    }
  }

  return (
    <div className="glass" style={{ padding: 20 }}>
      {error && <p className="error-text" style={{ marginBottom: 12 }}>{error}</p>}
      <button className="btn btn-primary" onClick={handlePay} disabled={submitting}>
        {submitting ? "Redirecting…" : "Continue to card payment"}
      </button>
    </div>
  );
}

function UsdtCheckout({ planId, user, onConfirmed }) {
  const [details, setDetails] = useState(null);
  const [txid, setTxid] = useState("");
  const [status, setStatus] = useState("idle"); // idle | loading | verifying | confirmed | error
  const [error, setError] = useState(null);
  const [showProofForm, setShowProofForm] = useState(false);
  const [note, setNote] = useState("");

  useEffect(() => {
    if (!user) return;
    setStatus("loading");
    getUsdtPaymentDetails({ planId })
      .then((d) => { setDetails(d); setStatus("idle"); })
      .catch((e) => { setError(e.message); setStatus("error"); });
  }, [planId, user]);

  async function handleConfirm() {
    setStatus("verifying");
    setError(null);
    try {
      await confirmUsdtPayment({ planId, txid: txid.trim() });
      setStatus("confirmed");
      onConfirmed?.();
    } catch (e) {
      setError(e.message);
      setStatus("idle");
    }
  }

  async function handleProofSubmit() {
    setStatus("verifying");
    try {
      await submitUsdtProof({ planId, note });
      setStatus("pending_review");
    } catch (e) {
      setError(e.message);
      setStatus("idle");
    }
  }

  if (!user) return <p className="helper-text">Sign in first to see the payment address.</p>;
  if (status === "loading") return <p className="helper-text">Loading payment details…</p>;
  if (status === "confirmed") return <p className="success-text">Payment confirmed on-chain. Thank you!</p>;
  if (status === "pending_review") return <p className="helper-text">Submitted for manual review — you'll be confirmed once checked by hand.</p>;

  return (
    <div className="glass" style={{ padding: 20 }}>
      {details && (
        <>
          <p style={{ color: "var(--ink-300)", fontSize: "0.85rem" }}>
            Send exactly <strong style={{ color: "var(--signal-400)" }}>{details.amount} USDT</strong> on the{" "}
            <strong>{details.network}</strong> network to:
          </p>
          <code style={{ display: "block", padding: 12, background: "rgba(0,0,0,0.3)", borderRadius: 8, wordBreak: "break-all", margin: "10px 0" }}>
            {details.address}
          </code>
          <p className="helper-text">Double-check the network is TRC20 — sending on the wrong network can lose the funds permanently, that's a blockchain-wide limitation, not something we can undo.</p>

          <div className="field" style={{ marginTop: 16 }}>
            <label htmlFor="txid">Transaction ID (after you've sent it)</label>
            <input id="txid" value={txid} onChange={(e) => setTxid(e.target.value)} placeholder="Paste your transaction hash" />
          </div>
          {error && <p className="error-text">{error}</p>}
          <button className="btn btn-primary" onClick={handleConfirm} disabled={!txid.trim() || status === "verifying"}>
            {status === "verifying" ? "Checking the blockchain…" : "Verify payment"}
          </button>

          <div style={{ marginTop: 16 }}>
            {!showProofForm ? (
              <button className="btn btn-ghost" onClick={() => setShowProofForm(true)}>
                Can't find a transaction ID? Submit for manual review instead
              </button>
            ) : (
              <div className="field">
                <label htmlFor="note">Describe your payment (wallet used, approx. time sent)</label>
                <input id="note" value={note} onChange={(e) => setNote(e.target.value)} />
                <button className="btn btn-ghost" style={{ marginTop: 8 }} onClick={handleProofSubmit} disabled={status === "verifying"}>
                  Submit for manual review
                </button>
              </div>
            )}
          </div>
        </>
      )}
    </div>
  );
}

function PaymentMethodOption({ id, selected, onSelect, title, desc }) {
  return (
    <button
      onClick={() => onSelect(id)}
      className="glass"
      style={{
        padding: 20, textAlign: "left", cursor: "pointer",
        border: selected ? "1px solid var(--aurora-400)" : undefined,
        boxShadow: selected ? "0 0 0 3px var(--aurora-glow)" : undefined,
      }}
    >
      <strong style={{ color: "var(--ink-000)" }}>{title}</strong>
      <p style={{ color: "var(--ink-300)", fontSize: "0.82rem", margin: "6px 0 0" }}>{desc}</p>
    </button>
  );
}
