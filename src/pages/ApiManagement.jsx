import { useState, useEffect } from "react";
import { useAuth } from "../context/AuthContext.jsx";
import "./ApiManagement.css";

const API_BASE = process.env.REACT_APP_API_URL || "https://aurevo-stream.onrender.com";

export default function ApiManagement() {
  const { user } = useAuth();
  const [keys, setKeys] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [generating, setGenerating] = useState(false);
  const [newKey, setNewKey] = useState(null);
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    if (user) {
      fetchKeys();
    }
  }, [user]);

  async function fetchKeys() {
    setLoading(true);
    try {
      const token = await user.getIdToken();
      const res = await fetch(`${API_BASE}/api/v1/developer/keys`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      if (!res.ok) throw new Error("Failed to fetch keys");
      const data = await res.json();
      setKeys(data.keys || []);
    } catch (err) {
      console.error("Failed to fetch API keys:", err);
      setError("Failed to load API keys");
    } finally {
      setLoading(false);
    }
  }

  async function generateKey() {
    setGenerating(true);
    setError(null);
    setNewKey(null);
    
    try {
      const token = await user.getIdToken();
      const res = await fetch(`${API_BASE}/api/v1/developer/keys`, {
        method: "POST",
        headers: { 
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json"
        },
        body: JSON.stringify({ 
          label: `Key ${keys.length + 1}`,
          tier: "free"
        })
      });
      
      if (!res.ok) throw new Error("Failed to generate key");
      
      const data = await res.json();
      setNewKey(data.key);
      await fetchKeys();
    } catch (err) {
      console.error("Failed to generate key:", err);
      setError("Failed to generate API key");
    } finally {
      setGenerating(false);
    }
  }

  async function revokeKey(keyId) {
    if (!confirm("Are you sure you want to revoke this API key?")) return;
    
    try {
      const token = await user.getIdToken();
      const res = await fetch(`${API_BASE}/api/v1/developer/keys/${keyId}`, {
        method: "DELETE",
        headers: { Authorization: `Bearer ${token}` }
      });
      
      if (!res.ok) throw new Error("Failed to revoke key");
      await fetchKeys();
    } catch (err) {
      console.error("Failed to revoke key:", err);
      setError("Failed to revoke API key");
    }
  }

  function copyToClipboard(text) {
    navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  }

  if (!user) {
    return (
      <div className="page">
        <div className="page-header">
          <div>
            <h1>Developer API</h1>
            <p>Sign in to manage your API keys.</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="page">
      <div className="page-header">
        <div>
          <h1>Developer API</h1>
          <p>Build with Aurevo's movie and music data. Free tier: 100 requests/day.</p>
        </div>
        <button 
          className="btn btn-primary" 
          onClick={generateKey}
          disabled={generating}
        >
          {generating ? "Generating..." : "Generate new key"}
        </button>
      </div>

      {error && (
        <div className="api-error">
          <p>{error}</p>
          <button onClick={() => setError(null)}>Dismiss</button>
        </div>
      )}

      {/* New Key Display */}
      {newKey && (
        <div className="new-key-banner">
          <div className="new-key-content">
            <h3>Your new API key</h3>
            <p className="new-key-warning">Save this key now - you won't be able to see it again!</p>
            <div className="new-key-display">
              <code>{newKey.key}</code>
              <button 
                className="copy-btn"
                onClick={() => copyToClipboard(newKey.key)}
              >
                {copied ? "Copied!" : "Copy"}
              </button>
            </div>
          </div>
          <button className="new-key-dismiss" onClick={() => setNewKey(null)}>×</button>
        </div>
      )}

      {/* API Keys Table */}
      <div className="api-keys-container">
        {loading ? (
          <div className="loading-container">
            <div className="loading-spinner" />
            <p>Loading your API keys...</p>
          </div>
        ) : keys.length === 0 ? (
          <div className="no-keys">
            <p>You don't have any API keys yet.</p>
            <p className="no-keys-hint">Generate a key to start building with Aurevo's data.</p>
          </div>
        ) : (
          <table className="api-keys-table">
            <thead>
              <tr>
                <th>Label</th>
                <th>API Key</th>
                <th>Created</th>
                <th>Tier</th>
                <th>Today's Usage</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {keys.map((key) => (
                <tr key={key.id}>
                  <td>{key.label}</td>
                  <td>
                    <code className="key-preview">{key.preview || key.key?.slice(0, 20) + "..."}</code>
                  </td>
                  <td>{new Date(key.createdAt).toLocaleDateString()}</td>
                  <td>
                    <span className={`tier-badge ${key.tier}`}>{key.tier}</span>
                  </td>
                  <td>
                    <div className="usage-display">
                      <span>{key.usedToday || 0}/{key.limitPerDay || 100}</span>
                      <div className="usage-bar">
                        <div 
                          className="usage-fill" 
                          style={{ width: `${Math.min(((key.usedToday || 0) / (key.limitPerDay || 100)) * 100, 100)}%` }}
                        />
                      </div>
                    </div>
                  </td>
                  <td>
                    <button 
                      className="btn-revoke"
                      onClick={() => revokeKey(key.id)}
                    >
                      Revoke
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>

      {/* API Documentation */}
      <div className="api-docs">
        <h2>Quick Start</h2>
        <p>Use your API key to access Aurevo's data:</p>
        
        <div className="code-block">
          <div className="code-header">
            <span>Example Request</span>
            <button 
              className="copy-btn"
              onClick={() => copyToClipboard(`curl -H "Authorization: Bearer YOUR_API_KEY" \\
  ${API_BASE}/api/v1/movies/popular`)}
            >
              Copy
            </button>
          </div>
          <pre>{`curl -H "Authorization: Bearer YOUR_API_KEY" \\
  ${API_BASE}/api/v1/movies/popular`}</pre>
        </div>

        <h3>Available Endpoints</h3>
        <ul className="endpoints-list">
          <li>
            <code>GET /api/v1/movies/popular</code>
            <span>Get trending movies</span>
          </li>
          <li>
            <code>GET /api/v1/movies/search?q={"{query}"}</code>
            <span>Search movies</span>
          </li>
          <li>
            <code>GET /api/v1/movies/{'{id}'}</code>
            <span>Get movie details</span>
          </li>
          <li>
            <code>GET /api/v1/music-videos/search?q={"{query}"}</code>
            <span>Search music videos</span>
          </li>
        </ul>

        <h3>Rate Limits</h3>
        <table className="rate-limits">
          <thead>
            <tr>
              <th>Tier</th>
              <th>Daily Limit</th>
              <th>Monthly Price</th>
            </tr>
          </thead>
          <tbody>
            <tr>
              <td>Free</td>
              <td>100 requests</td>
              <td>$0</td>
            </tr>
            <tr>
              <td>Pro</td>
              <td>10,000 requests</td>
              <td>$9.99</td>
            </tr>
            <tr>
              <td>Enterprise</td>
              <td>Unlimited</td>
              <td>Contact us</td>
            </tr>
          </tbody>
        </table>
      </div>
    </div>
  );
}
