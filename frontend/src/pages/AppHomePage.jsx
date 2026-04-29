import { Link, useNavigate } from "react-router-dom";
import { useEffect, useState } from "react";
import { apiUrl, withAuth } from "../api.js";

export function AppHomePage() {
  const [config, setConfig] = useState(null);
  const [error, setError] = useState("");
  const [language, setLanguage] = useState("en");
  const navigate = useNavigate();

  useEffect(() => {
    const token = localStorage.getItem("token");
    if (!token) return navigate("/");

    fetch(`${apiUrl}/api/meta`, { headers: withAuth(token) })
      .then(async (res) => {
        const data = await res.json();
        if (!res.ok) throw new Error(data.message || "Failed to load");
        setConfig(data);
        setLanguage(data.app.defaultLanguage || "en");
        document.documentElement.style.setProperty("--primary", data.app.theme.primary || "#0f766e");
        document.documentElement.style.setProperty("--secondary", data.app.theme.secondary || "#f97316");
      })
      .catch((err) => setError(err.message));
  }, [navigate]);

  if (error) return <main className="container"><p className="error">{error}</p></main>;
  if (!config) return <main className="container"><p>Loading runtime configuration...</p></main>;

  return (
    <main className="container">
      <div className="card" style={{ marginBottom: 14 }}>
        <h1 style={{ marginTop: 0 }}>{config.app.name}</h1>
        <p style={{ color: "var(--muted)" }}>Choose an entity to open generated UI.</p>
        <div style={{ display: "flex", gap: 8, alignItems: "center" }}>
          <span>Language</span>
          <select value={language} onChange={(e) => setLanguage(e.target.value)}>
            {config.app.languages.map((lang) => <option key={lang}>{lang}</option>)}
          </select>
        </div>
        {config.warnings.length > 0 && <p style={{ color: "#b45309" }}>Runtime warnings: {config.warnings.join(" | ")}</p>}
      </div>

      <div className="grid two">
        {config.entities.map((entity) => (
          <Link key={entity.name} to={`/app/${entity.name}?lang=${language}`} className="card">
            <h3 style={{ marginTop: 0 }}>{entity.label}</h3>
            <p style={{ color: "var(--muted)", marginBottom: 0 }}>{entity.fields.length} fields, dynamic CRUD enabled</p>
          </Link>
        ))}
      </div>
    </main>
  );
}
