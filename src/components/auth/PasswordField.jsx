import { useId, useMemo, useState } from "react";
import "./PasswordField.css";

/** Rough entropy-based strength estimate — no external library, no fake numbers. */
function scorePassword(pw) {
  if (!pw) return { tier: 0, label: "", bits: 0 };
  let pool = 0;
  if (/[a-z]/.test(pw)) pool += 26;
  if (/[A-Z]/.test(pw)) pool += 26;
  if (/[0-9]/.test(pw)) pool += 10;
  if (/[^a-zA-Z0-9]/.test(pw)) pool += 32;
  const bits = Math.round(pw.length * Math.log2(Math.max(pool, 1)));
  let tier = 0;
  let label = "Too weak";
  if (bits >= 70) { tier = 4; label = "Strong"; }
  else if (bits >= 50) { tier = 3; label = "Good"; }
  else if (bits >= 35) { tier = 2; label = "Fair"; }
  else if (bits >= 20) { tier = 1; label = "Weak"; }
  return { tier, label, bits };
}

export default function PasswordField({ label = "Password", value, onChange, showStrength = false, autoComplete = "current-password" }) {
  const [visible, setVisible] = useState(false);
  const id = useId();
  const strength = useMemo(() => (showStrength ? scorePassword(value) : null), [value, showStrength]);

  return (
    <div className="field password-field">
      <label htmlFor={id}>{label}</label>
      <div className="password-field__control">
        <input
          id={id}
          type={visible ? "text" : "password"}
          value={value}
          onChange={(e) => onChange(e.target.value)}
          autoComplete={autoComplete}
        />
        <button
          type="button"
          className="password-field__toggle"
          onClick={() => setVisible((v) => !v)}
          aria-label={visible ? "Hide password" : "Show password"}
          aria-pressed={visible}
        >
          {visible ? <EyeOff /> : <Eye />}
        </button>
      </div>

      {showStrength && value && (
        <div className="password-field__strength" aria-live="polite">
          <div className="password-field__bars">
            {[1, 2, 3, 4].map((n) => (
              <span key={n} className={n <= strength.tier ? `is-filled tier-${strength.tier}` : ""} />
            ))}
          </div>
          <span className="password-field__label">{strength.label}</span>
        </div>
      )}
    </div>
  );
}

function Eye() {
  return (
    <svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
      <path d="M2 12s3.5-7 10-7 10 7 10 7-3.5 7-10 7-10-7-10-7z" />
      <circle cx="12" cy="12" r="3" />
    </svg>
  );
}
function EyeOff() {
  return (
    <svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
      <path d="M3 3l18 18M10.6 10.6a3 3 0 0 0 4.24 4.24M6.6 6.7C4.5 8 3 12 3 12s3.5 7 10 7c1.6 0 3-.35 4.24-.94M17.3 17.3C19.4 16 21 12 21 12s-1.3-2.6-3.6-4.4" />
    </svg>
  );
}
