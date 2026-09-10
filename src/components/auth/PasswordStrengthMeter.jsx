import { useMemo } from "react";
import "./PasswordStrengthMeter.css";

export default function PasswordStrengthMeter({ password }) {
  const analysis = useMemo(() => {
    if (!password) return { tier: 0, bits: 0, label: "No lock at all", crackTime: "The door is standing open", color: "#718096" };

    // Calculate entropy
    let poolSize = 0;
    if (/[a-z]/.test(password)) poolSize += 26;
    if (/[A-Z]/.test(password)) poolSize += 26;
    if (/[0-9]/.test(password)) poolSize += 10;
    if (/[^a-zA-Z0-9]/.test(password)) poolSize += 32;
    
    const bits = Math.round(password.length * Math.log2(poolSize || 1));
    
    // Determine tier
    let tier, label, crackTime, color;
    if (bits < 30) {
      tier = 1;
      label = "A bent paperclip";
      crackTime = "Cracked instantly";
      color = "#e53e3e";
    } else if (bits < 50) {
      tier = 2;
      label = "A padlock";
      crackTime = "Cracked in 2 seconds";
      color = "#dd6b20";
    } else if (bits < 70) {
      tier = 3;
      label = "A deadbolt";
      crackTime = "Cracked in 5 days";
      color = "#d69e2e";
    } else {
      tier = 4;
      label = "A bank vault";
      crackTime = "Cracked in 3 thousand years";
      color = "#38a169";
    }

    return { tier, bits, label, crackTime, color };
  }, [password]);

  return (
    <div className="password-strength-meter">
      <div className="meter-visual">
        {/* Lock icon that upgrades */}
        <div className={`lock-icon tier-${analysis.tier}`}>
          {analysis.tier === 0 && (
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M12 2v4M8 6h8M6 10h12v12H6z" opacity="0.3" />
            </svg>
          )}
          {analysis.tier === 1 && (
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M14 6l-8.5 8.5a2.12 2.12 0 0 0 3 3L17 9" />
              <path d="M9 15l-3 3" />
              <path d="M15 9l3-3" />
            </svg>
          )}
          {analysis.tier === 2 && (
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <rect x="3" y="11" width="18" height="11" rx="2" ry="2" />
              <path d="M7 11V7a5 5 0 0 1 10 0v4" />
            </svg>
          )}
          {analysis.tier === 3 && (
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <rect x="3" y="11" width="18" height="11" rx="2" ry="2" />
              <path d="M7 11V7a5 5 0 0 1 10 0v4" />
              <circle cx="12" cy="16" r="2" />
              <path d="M12 18v2" />
            </svg>
          )}
          {analysis.tier === 4 && (
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <circle cx="12" cy="12" r="10" />
              <circle cx="12" cy="12" r="4" />
              <path d="M12 2v4M12 18v4M2 12h4M18 12h4" />
            </svg>
          )}
        </div>

        {/* Progress segments */}
        <div className="meter-segments">
          {[1, 2, 3, 4].map((i) => (
            <div 
              key={i}
              className={`segment ${i <= analysis.tier ? 'active' : ''}`}
              style={{ backgroundColor: i <= analysis.tier ? analysis.color : '#2d3748' }}
            />
          ))}
        </div>
      </div>

      <div className="meter-text">
        <div className="meter-label" style={{ color: analysis.color }}>
          {analysis.label}
        </div>
        <div className="meter-details">
          {analysis.crackTime}. {analysis.bits} bits of entropy
        </div>
      </div>
    </div>
  );
}
