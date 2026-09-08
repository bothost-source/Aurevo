import "./AuthCard.css";

export default function AuthCard({ eyebrow, title, subtitle, children, footer }) {
  return (
    <div className="auth-page">
      <div className="auth-card glass">
        <div className="auth-card__brand">Aurevo</div>
        {eyebrow && <div className="auth-card__eyebrow">{eyebrow}</div>}
        <h1>{title}</h1>
        {subtitle && <p className="auth-card__subtitle">{subtitle}</p>}
        {children}
        {footer && <div className="auth-card__footer">{footer}</div>}
      </div>
    </div>
  );
}
