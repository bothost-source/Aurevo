import { useState, useRef, useEffect } from "react";
import { gsap } from "gsap";
import "./DownloadButton.css";

export default function DownloadButton({ 
  fileUrl, 
  fileName = "download",
  fileSize,
  onComplete,
  onError 
}) {
  const [state, setState] = useState("idle"); // idle, downloading, complete, error
  const [progress, setProgress] = useState(0);
  const [downloadSpeed, setDownloadSpeed] = useState(0);
  const ringRef = useRef(null);
  const parachuteRef = useRef(null);
  const progressBarRef = useRef(null);
  const checkmarkRef = useRef(null);
  const cancelRef = useRef(false);
  const animationRef = useRef(null);

  // Reset animation when idle
  useEffect(() => {
    if (state === "idle") {
      gsap.set(ringRef.current, { scale: 1, opacity: 1 });
      gsap.set(parachuteRef.current, { scale: 0, opacity: 0, y: -20 });
      gsap.set(progressBarRef.current, { scaleX: 0 });
      gsap.set(checkmarkRef.current, { scale: 0, opacity: 0 });
      setProgress(0);
      setDownloadSpeed(0);
    }
  }, [state]);

  const startDownload = async () => {
    if (state !== "idle") return;
    
    setState("downloading");
    cancelRef.current = false;

    // Animate: ring shrinks, parachute appears
    const tl = gsap.timeline();
    
    tl.to(ringRef.current, {
      scale: 0,
      opacity: 0,
      duration: 0.3,
      ease: "power2.in"
    })
    .to(parachuteRef.current, {
      scale: 1,
      opacity: 1,
      y: 0,
      duration: 0.5,
      ease: "back.out(1.7)"
    }, "-=0.1")
    .to(progressBarRef.current, {
      scaleX: 0,
      duration: 0
    });

    try {
      // Real download with progress tracking
      const response = await fetch(fileUrl);
      
      if (!response.ok) throw new Error("Download failed");
      
      const contentLength = response.headers.get("content-length");
      const total = parseInt(contentLength, 10) || 0;
      const reader = response.body.getReader();
      const chunks = [];
      let received = 0;
      let startTime = Date.now();
      let lastTime = startTime;
      let lastReceived = 0;

      while (true) {
        if (cancelRef.current) {
          reader.cancel();
          setState("idle");
          return;
        }

        const { done, value } = await reader.read();
        
        if (done) break;
        
        chunks.push(value);
        received += value.length;
        
        // Calculate progress
        const currentProgress = total ? (received / total) * 100 : 0;
        setProgress(Math.min(currentProgress, 100));
        
        // Calculate speed
        const now = Date.now();
        const timeDiff = (now - lastTime) / 1000;
        if (timeDiff > 0.5) {
          const speed = (received - lastReceived) / timeDiff / 1024; // KB/s
          setDownloadSpeed(speed);
          lastTime = now;
          lastReceived = received;
        }
        
        // Animate progress bar
        gsap.to(progressBarRef.current, {
          scaleX: currentProgress / 100,
          duration: 0.3,
          ease: "power2.out"
        });
      }

      // Create blob and trigger download
      const blob = new Blob(chunks);
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = fileName;
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      document.body.removeChild(a);

      // Complete animation
      setProgress(100);
      gsap.to(progressBarRef.current, {
        scaleX: 1,
        duration: 0.3,
        ease: "power2.out"
      });
      
      await gsap.to(parachuteRef.current, {
        scale: 0,
        opacity: 0,
        y: 20,
        duration: 0.3,
        ease: "power2.in"
      });
      
      await gsap.to(checkmarkRef.current, {
        scale: 1,
        opacity: 1,
        duration: 0.5,
        ease: "back.out(2)"
      });

      setState("complete");
      onComplete?.();

      // Reset after delay
      setTimeout(() => {
        setState("idle");
      }, 3000);

    } catch (err) {
      console.error("Download error:", err);
      setState("error");
      onError?.(err);
      
      // Error animation
      gsap.to(parachuteRef.current, {
        x: 10,
        duration: 0.1,
        repeat: 3,
        yoyo: true,
        ease: "power2.inOut"
      });
      
      setTimeout(() => {
        setState("idle");
      }, 2000);
    }
  };

  const cancelDownload = () => {
    cancelRef.current = true;
    animationRef.current?.kill();
  };

  const formatSize = (bytes) => {
    if (!bytes) return "";
    const kb = bytes / 1024;
    if (kb < 1024) return `${kb.toFixed(1)} KB`;
    const mb = kb / 1024;
    return `${mb.toFixed(1)} MB`;
  };

  return (
    <div className={`download-button ${state}`}>
      <button 
        className="download-trigger"
        onClick={startDownload}
        disabled={state === "downloading"}
        aria-label={state === "downloading" ? "Downloading..." : "Download"}
      >
        {/* Ring State */}
        <svg 
          ref={ringRef}
          className="download-ring" 
          viewBox="0 0 100 100"
        >
          <circle 
            cx="50" 
            cy="50" 
            r="45" 
            fill="none" 
            stroke="currentColor" 
            strokeWidth="4"
            strokeDasharray="283"
            strokeDashoffset="0"
            strokeLinecap="round"
          />
          <path 
            d="M 35 50 L 50 65 L 65 50 M 50 65 L 50 30" 
            fill="none" 
            stroke="currentColor" 
            strokeWidth="4"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
        </svg>

        {/* Parachute State */}
        <svg 
          ref={parachuteRef}
          className="download-parachute" 
          viewBox="0 0 100 100"
        >
          {/* Canopy */}
          <path 
            d="M 20 40 Q 50 10 80 40 L 75 45 Q 50 20 25 45 Z" 
            fill="currentColor"
            opacity="0.9"
          />
          {/* Lines */}
          <line x1="30" y1="42" x2="50" y2="70" stroke="currentColor" strokeWidth="2" />
          <line x1="70" y1="42" x2="50" y2="70" stroke="currentColor" strokeWidth="2" />
          <line x1="50" y1="25" x2="50" y2="70" stroke="currentColor" strokeWidth="2" />
          {/* Payload */}
          <rect x="42" y="70" width="16" height="12" rx="2" fill="currentColor" />
        </svg>

        {/* Checkmark State */}
        <svg 
          ref={checkmarkRef}
          className="download-checkmark" 
          viewBox="0 0 100 100"
        >
          <circle 
            cx="50" 
            cy="50" 
            r="45" 
            fill="none" 
            stroke="currentColor" 
            strokeWidth="4"
            opacity="0.3"
          />
          <path 
            d="M 30 52 L 45 67 L 72 35" 
            fill="none" 
            stroke="currentColor" 
            strokeWidth="6"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
        </svg>
      </button>

      {/* Progress Bar */}
      <div className="download-progress-container">
        <div className="download-info">
          <span className="download-filename">{fileName}</span>
          {fileSize && <span className="download-filesize">{formatSize(fileSize)}</span>}
        </div>
        
        <div className="download-progress-track">
          <div 
            ref={progressBarRef}
            className="download-progress-fill"
            style={{ transform: `scaleX(${progress / 100})` }}
          />
        </div>
        
        <div className="download-status">
          {state === "downloading" && (
            <>
              <span className="download-percent">{Math.round(progress)}%</span>
              {downloadSpeed > 0 && (
                <span className="download-speed">{downloadSpeed.toFixed(0)} KB/s</span>
              )}
              <button 
                className="download-cancel"
                onClick={cancelDownload}
                aria-label="Cancel download"
              >
                Cancel
              </button>
            </>
          )}
          {state === "complete" && (
            <span className="download-complete-text">Complete</span>
          )}
          {state === "error" && (
            <span className="download-error-text">Failed</span>
          )}
        </div>
      </div>
    </div>
  );
}
