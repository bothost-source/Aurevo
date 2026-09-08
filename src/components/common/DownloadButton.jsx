import { useEffect, useRef, useState } from "react";
import "./DownloadButton.css";

const STATES = { idle: "idle", downloading: "downloading", done: "done", error: "error" };

/**
 * A single reusable download control.
 * - idle: outlined ring with a down arrow
 * - downloading: the ring fills as a real progress arc (not decorative —
 *   `progress` should track actual bytes received) and can be cancelled
 * - done: settles into a check
 * `onStart` should return a promise and call onProgress(0..1) as bytes
 * arrive; this component never fabricates progress on its own.
 */
export default function DownloadButton({ label, onStart, onCancel, size = 44 }) {
  const [state, setState] = useState(STATES.idle);
  const [progress, setProgress] = useState(0);
  const cancelledRef = useRef(false);

  useEffect(() => {
    if (state === STATES.done) {
      const t = setTimeout(() => setState(STATES.idle), 2200);
      return () => clearTimeout(t);
    }
  }, [state]);

  async function handleClick() {
    if (state === STATES.downloading) {
      cancelledRef.current = true;
      onCancel?.();
      setState(STATES.idle);
      setProgress(0);
      return;
    }
    cancelledRef.current = false;
    setState(STATES.downloading);
    setProgress(0);
    try {
      await onStart?.((p) => {
        if (!cancelledRef.current) setProgress(p);
      });
      if (!cancelledRef.current) setState(STATES.done);
    } catch {
      if (!cancelledRef.current) setState(STATES.error);
    }
  }

  const circumference = 2 * Math.PI * 16;
  const dashoffset = circumference * (1 - progress);

  return (
    <button
      type="button"
      className={`dl-btn dl-btn--${state}`}
      style={{ "--size": `${size}px` }}
      onClick={handleClick}
      aria-label={
        state === STATES.downloading
          ? `Cancel download, ${Math.round(progress * 100)}% of ${label}`
          : state === STATES.done
          ? `${label} downloaded`
          : `Download ${label}`
      }
    >
      <svg viewBox="0 0 40 40" width={size} height={size} className="dl-btn__ring">
        <circle cx="20" cy="20" r="16" className="dl-btn__track" />
        <circle
          cx="20" cy="20" r="16"
          className="dl-btn__fill"
          strokeDasharray={circumference}
          strokeDashoffset={state === STATES.downloading ? dashoffset : state === STATES.done ? 0 : circumference}
        />
      </svg>
      <span className="dl-btn__glyph" aria-hidden="true">
        {state === STATES.idle && <ArrowDown />}
        {state === STATES.downloading && <Square />}
        {state === STATES.done && <Check />}
        {state === STATES.error && <Retry />}
      </span>
      {state === STATES.downloading && (
        <span className="dl-btn__pct">{Math.round(progress * 100)}%</span>
      )}
    </button>
  );
}

function ArrowDown() {
  return (
    <svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M12 4v12m0 0-5-5m5 5 5-5M5 20h14" />
    </svg>
  );
}
function Square() {
  return (
    <svg viewBox="0 0 24 24" width="12" height="12" fill="currentColor">
      <rect x="5" y="5" width="14" height="14" rx="2" />
    </svg>
  );
}
function Check() {
  return (
    <svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round">
      <path d="M5 12.5 10 17l9-11" />
    </svg>
  );
}
function Retry() {
  return (
    <svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M4 4v6h6M20 20v-6h-6M5 15a7 7 0 0 0 13 2M19 9A7 7 0 0 0 6 7" />
    </svg>
  );
}
