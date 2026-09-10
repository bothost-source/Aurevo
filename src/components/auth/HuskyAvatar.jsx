import { useEffect, useRef, useState } from "react";
import "./HuskyAvatar.css";

export default function HuskyAvatar({ focusedField, showPassword, hasText }) {
  const huskyRef = useRef(null);
  const eyesRef = useRef(null);
  const [isPeeking, setIsPeeking] = useState(false);

  // Eye tracking effect
  useEffect(() => {
    if (!eyesRef.current) return;
    
    const handleMouseMove = (e) => {
      if (focusedField === 'password' && !showPassword) return;
      
      const eyes = eyesRef.current.querySelectorAll('.pupil');
      eyes.forEach(eye => {
        const rect = eye.getBoundingClientRect();
        const x = rect.left + rect.width / 2;
        const y = rect.top + rect.height / 2;
        const rad = Math.atan2(e.clientX - x, e.clientY - y);
        const rot = (rad * (180 / Math.PI) * -1) + 180;
        eye.style.transform = `rotate(${rot}deg)`;
      });
    };

    window.addEventListener('mousemove', handleMouseMove);
    return () => window.removeEventListener('mousemove', handleMouseMove);
  }, [focusedField, showPassword]);

  // Determine husky state
  const isCoveringEyes = focusedField === 'password' && !showPassword;
  const isWatching = focusedField && !isCoveringEyes;

  return (
    <div 
      ref={huskyRef}
      className={`husky-avatar ${isCoveringEyes ? 'covering' : ''} ${isWatching ? 'watching' : ''} ${showPassword ? 'peeking' : ''}`}
    >
      <svg viewBox="0 0 200 200" className="husky-svg">
        {/* Ears */}
        <path className="ear left" d="M 40 60 L 20 20 L 70 40 Z" fill="#4a5568" />
        <path className="ear right" d="M 160 60 L 180 20 L 130 40 Z" fill="#4a5568" />
        
        {/* Head */}
        <ellipse cx="100" cy="110" rx="70" ry="60" fill="#e2e8f0" />
        
        {/* Face mask */}
        <path 
          d="M 60 90 Q 100 70 140 90 Q 140 130 100 140 Q 60 130 60 90" 
          fill="#4a5568"
          className="face-mask"
        />
        
        {/* Eyes */}
        <g ref={eyesRef} className="eyes">
          <g className="eye left">
            <circle cx="75" cy="105" r="12" fill="white" />
            <circle className="pupil" cx="75" cy="105" r="6" fill="#1a202c" />
            <circle cx="77" cy="103" r="2" fill="white" opacity="0.8" />
          </g>
          <g className="eye right">
            <circle cx="125" cy="105" r="12" fill="white" />
            <circle className="pupil" cx="125" cy="105" r="6" fill="#1a202c" />
            <circle cx="127" cy="103" r="2" fill="white" opacity="0.8" />
          </g>
        </g>

        {/* Paws - covering eyes */}
        <g className="paws">
          <ellipse 
            className="paw left" 
            cx="75" 
            cy="105" 
            rx="18" 
            ry="22" 
            fill="#e2e8f0"
            stroke="#cbd5e0"
            strokeWidth="2"
          />
          <ellipse 
            className="paw right" 
            cx="125" 
            cy="105" 
            rx="18" 
            ry="22" 
            fill="#e2e8f0"
            stroke="#cbd5e0"
            strokeWidth="2"
          />
          {/* Paw pads */}
          <circle className="pad" cx="75" cy="100" r="4" fill="#4a5568" />
          <circle className="pad" cx="70" cy="108" r="3" fill="#4a5568" />
          <circle className="pad" cx="80" cy="108" r="3" fill="#4a5568" />
          <circle className="pad" cx="125" cy="100" r="4" fill="#4a5568" />
          <circle className="pad" cx="120" cy="108" r="3" fill="#4a5568" />
          <circle className="pad" cx="130" cy="108" r="3" fill="#4a5568" />
        </g>

        {/* Nose */}
        <ellipse cx="100" cy="125" rx="8" ry="6" fill="#1a202c" />
        
        {/* Mouth */}
        <path 
          d="M 90 135 Q 100 140 110 135" 
          stroke="#4a5568" 
          strokeWidth="2" 
          fill="none"
          strokeLinecap="round"
        />
        
        {/* Blush */}
        <ellipse cx="60" cy="120" rx="8" ry="5" fill="#feb2b2" opacity="0.6" />
        <ellipse cx="140" cy="120" rx="8" ry="5" fill="#feb2b2" opacity="0.6" />
      </svg>

      {/* Peeking eyes when show password is toggled */}
      {showPassword && focusedField === 'password' && (
        <div className="peek-indicator">
          👀
        </div>
      )}
    </div>
  );
}
