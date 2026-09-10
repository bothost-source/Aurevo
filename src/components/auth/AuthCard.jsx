import { useEffect, useRef, useState } from "react";
import { gsap } from "gsap";
import "./AuthCard.css";

export default function AuthCard({ eyebrow, title, subtitle, children, footer }) {
  const cardRef = useRef(null);
  const lampRef = useRef(null);
  const lightRef = useRef(null);
  const smileyRef = useRef(null);
  const [isLampOn, setIsLampOn] = useState(false);

  useEffect(() => {
    // Entrance animation
    const tl = gsap.timeline({ defaults: { ease: "power3.out" } });
    
    tl.fromTo(cardRef.current, 
      { opacity: 0, y: 50, scale: 0.95 },
      { opacity: 1, y: 0, scale: 1, duration: 0.8 }
    )
    .fromTo(lampRef.current,
      { y: -100, opacity: 0 },
      { y: 0, opacity: 1, duration: 0.6, ease: "bounce.out" },
      "-=0.4"
    )
    .fromTo(smileyRef.current,
      { scale: 0, opacity: 0 },
      { scale: 1, opacity: 1, duration: 0.5, ease: "back.out(1.7)" },
      "-=0.2"
    );

    // Lamp swing animation
    gsap.to(lampRef.current, {
      rotation: 3,
      transformOrigin: "top center",
      duration: 2,
      ease: "sine.inOut",
      yoyo: true,
      repeat: -1
    });
  }, []);

  const toggleLamp = () => {
    setIsLampOn(!isLampOn);
    
    if (!isLampOn) {
      // Turn on lamp
      gsap.to(lightRef.current, {
        opacity: 1,
        duration: 0.3
      });
      gsap.to(smileyRef.current, {
        filter: "brightness(1.2) drop-shadow(0 0 20px rgba(74, 222, 128, 0.5))",
        duration: 0.3
      });
    } else {
      // Turn off lamp
      gsap.to(lightRef.current, {
        opacity: 0,
        duration: 0.3
      });
      gsap.to(smileyRef.current, {
        filter: "brightness(0.7)",
        duration: 0.3
      });
    }
  };

  return (
    <div className="auth-page">
      <div className="auth-background" />
      
      <div className="auth-card glass" ref={cardRef}>
        {/* Hanging Lamp */}
        <div className="lamp-container" ref={lampRef}>
          <div className="lamp-cord" onClick={toggleLamp} />
          <div className="lamp-shade">
            <svg viewBox="0 0 100 60" className="lamp-svg">
              <path 
                d="M 10 60 L 30 10 L 70 10 L 90 60 Z" 
                fill="url(#lampGradient)"
                stroke="#374151"
                strokeWidth="2"
              />
              <defs>
                <linearGradient id="lampGradient" x1="0%" y1="0%" x2="100%" y2="0%">
                  <stop offset="0%" stopColor="#4b5563" />
                  <stop offset="50%" stopColor="#6b7280" />
                  <stop offset="100%" stopColor="#4b5563" />
                </linearGradient>
              </defs>
              <ellipse cx="50" cy="60" rx="40" ry="5" fill="#374151" />
            </svg>
            <div className="lamp-light" ref={lightRef} />
          </div>
        </div>

        {/* Glowing Smiley */}
        <div className="auth-smiley" ref={smileyRef}>
          <svg viewBox="0 0 100 100" className="smiley-svg">
            <circle cx="50" cy="50" r="35" fill="none" stroke="#4ade80" strokeWidth="3" />
            <circle cx="38" cy="42" r="5" fill="#4ade80" />
            <circle cx="62" cy="42" r="5" fill="#4ade80" />
            <path 
              d="M 35 58 Q 50 68 65 58" 
              stroke="#4ade80" 
              strokeWidth="3" 
              fill="none"
              strokeLinecap="round"
            />
            {/* Headphones */}
            <path 
              d="M 20 45 Q 20 25 50 25 Q 80 25 80 45" 
              stroke="#4ade80" 
              strokeWidth="4" 
              fill="none"
            />
            <rect x="15" y="42" width="8" height="16" rx="4" fill="#4ade80" />
            <rect x="77" y="42" width="8" height="16" rx="4" fill="#4ade80" />
          </svg>
        </div>

        <div className="auth-card__brand">Aurevo</div>
        {eyebrow && <div className="auth-card__eyebrow">{eyebrow}</div>}
        <h1>{title}</h1>
        {subtitle && <p className="auth-card__subtitle">{subtitle}</p>}
        
        <div className="auth-card__content">
          {children}
        </div>
        
        {footer && <div className="auth-card__footer">{footer}</div>}
      </div>
    </div>
  );
}
