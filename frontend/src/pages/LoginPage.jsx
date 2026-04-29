import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { apiUrl } from "../api.js";

export function LoginPage() {
  const [mode, setMode] = useState("login");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [message, setMessage] = useState("");
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  const submit = async () => {
    setLoading(true);
    setMessage("");
    try {
      const res = await fetch(`${apiUrl}/auth/${mode}`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, password })
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.message || "Auth failed");
      localStorage.setItem("token", data.token);
      navigate("/app");
    } catch (err) {
      setMessage(err instanceof Error ? err.message : "Something went wrong");
    } finally {
      setLoading(false);
    }
  };

  const sendMagicLink = async () => {
    setLoading(true);
    setMessage("");
    try {
      const res = await fetch(`${apiUrl}/auth/magic-link`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email })
      });
      const data = await res.json();
      setMessage(data.message || "Magic link flow completed");
    } finally {
      setLoading(false);
    }
  };

  return (
    <main className="container">
      <div className="card" style={{ maxWidth: 520, margin: "40px auto" }}>
        <h1 style={{ marginTop: 0 }}>ConfigPilot Runtime</h1>
        <p style={{ color: "var(--muted)" }}>Config-driven app generation with dynamic schema, APIs, localization, and CSV import.</p>
        <div style={{ display: "flex", gap: 8, marginBottom: 12 }}>
          <button className={mode === "login" ? "primary" : "secondary"} onClick={() => setMode("login")}>Login</button>
          <button className={mode === "signup" ? "primary" : "secondary"} onClick={() => setMode("signup")}>Sign up</button>
        </div>
        <label>Email<input value={email} onChange={(e) => setEmail(e.target.value)} /></label>
        <label>Password<input type="password" value={password} onChange={(e) => setPassword(e.target.value)} /></label>
        <div style={{ display: "flex", gap: 8, marginTop: 12 }}>
          <button className="primary" onClick={submit} disabled={loading}>{loading ? "Please wait..." : mode === "login" ? "Login" : "Create account"}</button>
          <button className="secondary" onClick={sendMagicLink} disabled={loading}>Magic link (mock)</button>
        </div>
        {message && <p className="error">{message}</p>}
      </div>
    </main>
  );
}
