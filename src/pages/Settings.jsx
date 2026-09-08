import { useState } from "react";

export default function Settings() {
  const [quality, setQuality] = useState("auto");
  return (
    <div className="page">
      <div className="page-header">
        <div>
          <h1>Settings</h1>
          <p>Playback and app preferences.</p>
        </div>
      </div>

      <div className="field" style={{ maxWidth: 320 }}>
        <label htmlFor="quality">Streaming quality</label>
        <select id="quality" value={quality} onChange={(e) => setQuality(e.target.value)}>
          <option value="auto">Auto</option>
          <option value="standard">Standard (free tier)</option>
          <option value="high">High</option>
          <option value="ultra">Ultra (paid tiers)</option>
        </select>
      </div>
    </div>
  );
}
