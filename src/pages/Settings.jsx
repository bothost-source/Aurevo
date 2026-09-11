import { useState, useEffect } from "react";
import { useAuth } from "../context/AuthContext.jsx";
import { getUserProfile, saveProfile } from "../services/api.js";
import "./Settings.css";

export default function Settings() {
  const { user } = useAuth();
  const [quality, setQuality] = useState("auto");
  const [autoplay, setAutoplay] = useState(true);
  const [subtitles, setSubtitles] = useState(false);
  const [downloadWifiOnly, setDownloadWifiOnly] = useState(true);
  const [profile, setProfile] = useState(null);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);

  useEffect(() => {
    loadProfile();
  }, []);

  async function loadProfile() {
    try {
      const data = await getUserProfile();
      setProfile(data);
    } catch (err) {
      console.error("Failed to load profile:", err);
    }
  }

  async function handleSave() {
    setSaving(true);
    try {
      await saveProfile({
        streamingQuality: quality,
        autoplay,
        subtitles,
        downloadWifiOnly,
      });
      setSaved(true);
      setTimeout(() => setSaved(false), 3000);
    } catch (err) {
      console.error("Failed to save settings:", err);
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="page">
      <div className="page-header">
        <div>
          <h1>Settings</h1>
          <p>Playback, download, and account preferences.</p>
        </div>
      </div>

      <div className="settings-container">
        {/* Playback Settings */}
        <section className="settings-section">
          <h2 className="settings-section-title">Playback</h2>
          
          <div className="setting-item">
            <div className="setting-info">
              <label htmlFor="quality">Streaming quality</label>
              <p className="setting-desc">Higher quality uses more data</p>
            </div>
            <select 
              id="quality" 
              value={quality} 
              onChange={(e) => setQuality(e.target.value)}
              className="setting-select"
            >
              <option value="auto">Auto (recommended)</option>
              <option value="data-saver">Data saver</option>
              <option value="standard">Standard</option>
              <option value="high">High (HD)</option>
              <option value="ultra">Ultra (4K) — Premium</option>
            </select>
          </div>

          <div className="setting-item">
            <div className="setting-info">
              <label htmlFor="autoplay">Autoplay next episode</label>
              <p className="setting-desc">Automatically play next episode in series</p>
            </div>
            <label className="toggle">
              <input 
                type="checkbox" 
                id="autoplay"
                checked={autoplay}
                onChange={(e) => setAutoplay(e.target.checked)}
              />
              <span className="toggle-slider" />
            </label>
          </div>

          <div className="setting-item">
            <div className="setting-info">
              <label htmlFor="subtitles">Subtitles by default</label>
              <p className="setting-desc">Show subtitles when available</p>
            </div>
            <label className="toggle">
              <input 
                type="checkbox" 
                id="subtitles"
                checked={subtitles}
                onChange={(e) => setSubtitles(e.target.checked)}
              />
              <span className="toggle-slider" />
            </label>
          </div>
        </section>

        {/* Download Settings */}
        <section className="settings-section">
          <h2 className="settings-section-title">Downloads</h2>
          
          <div className="setting-item">
            <div className="setting-info">
              <label htmlFor="wifi-only">Download on Wi-Fi only</label>
              <p className="setting-desc">Prevent downloads on mobile data</p>
            </div>
            <label className="toggle">
              <input 
                type="checkbox" 
                id="wifi-only"
                checked={downloadWifiOnly}
                onChange={(e) => setDownloadWifiOnly(e.target.checked)}
              />
              <span className="toggle-slider" />
            </label>
          </div>
        </section>

        {/* Account Info */}
        {profile && (
          <section className="settings-section">
            <h2 className="settings-section-title">Account</h2>
            
            <div className="setting-item">
              <div className="setting-info">
                <label>Email</label>
                <p className="setting-desc">{user?.email}</p>
              </div>
            </div>

            <div className="setting-item">
              <div className="setting-info">
                <label>Username</label>
                <p className="setting-desc">{profile.username || "Not set"}</p>
              </div>
            </div>

            <div className="setting-item">
              <div className="setting-info">
                <label>Country</label>
                <p className="setting-desc">{profile.country || "Not set"}</p>
              </div>
            </div>

            <div className="setting-item">
              <div className="setting-info">
                <label>Language</label>
                <p className="setting-desc">{profile.language || "Not set"}</p>
              </div>
            </div>
          </section>
        )}

        {/* Save Button */}
        <div className="settings-actions">
          <button 
            className="btn btn-primary"
            onClick={handleSave}
            disabled={saving}
          >
            {saving ? "Saving..." : saved ? "Saved!" : "Save Changes"}
          </button>
        </div>
      </div>
    </div>
  );
}
