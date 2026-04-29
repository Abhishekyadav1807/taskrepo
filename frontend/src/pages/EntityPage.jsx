import { useEffect, useMemo, useState } from "react";
import { useNavigate, useParams, useSearchParams } from "react-router-dom";
import { apiUrl, withAuth } from "../api.js";

const fieldInput = (type) => {
  if (type === "number") return "number";
  if (type === "date") return "date";
  return "text";
};

export function EntityPage() {
  const { entity: entityName } = useParams();
  const [searchParams] = useSearchParams();
  const [config, setConfig] = useState(null);
  const [rows, setRows] = useState([]);
  const [form, setForm] = useState({});
  const [csv, setCsv] = useState("");
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(true);
  const lang = searchParams.get("lang") || "en";
  const token = localStorage.getItem("token");
  const navigate = useNavigate();

  const entity = useMemo(() => {
    if (!config) return null;
    return config.entities.find((entry) => entry.name === entityName) || null;
  }, [config, entityName]);

  const load = async () => {
    if (!token || !entityName) return;
    setLoading(true);
    setError("");
    try {
      const [metaRes, rowsRes] = await Promise.all([
        fetch(`${apiUrl}/api/meta`, { headers: withAuth(token) }),
        fetch(`${apiUrl}/api/${entityName}`, { headers: withAuth(token) })
      ]);
      const meta = await metaRes.json();
      const rowsData = await rowsRes.json();
      if (!metaRes.ok) throw new Error(meta.message || "Failed to load config");
      if (!rowsRes.ok) throw new Error(rowsData.message || "Failed to load rows");
      setConfig(meta);
      setRows(rowsData);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Unknown error");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (!token) return navigate("/");
    if (!entityName) return;
    load();
  }, [entityName]);

  const create = async () => {
    if (!token || !entity) return;
    setMessage("");
    const payload = Object.fromEntries(Object.entries(form).filter(([, v]) => v !== ""));
    const res = await fetch(`${apiUrl}/api/${entity.name}`, {
      method: "POST",
      headers: withAuth(token),
      body: JSON.stringify(payload)
    });
    const data = await res.json();
    if (!res.ok) {
      setError(data.message || "Create failed");
      return;
    }
    setForm({});
    setMessage("Record created");
    load();
  };

  const remove = async (id) => {
    if (!token || !entity) return;
    const res = await fetch(`${apiUrl}/api/${entity.name}/${id}`, {
      method: "DELETE",
      headers: withAuth(token)
    });
    if (!res.ok) {
      const data = await res.json();
      setError(data.message || "Delete failed");
      return;
    }
    load();
  };

  const importCsv = async () => {
    if (!token || !entity) return;
    const res = await fetch(`${apiUrl}/api/${entity.name}/import/csv`, {
      method: "POST",
      headers: withAuth(token),
      body: JSON.stringify({ csv })
    });
    const data = await res.json();
    if (!res.ok) {
      setError(data.message || "Import failed");
      return;
    }
    setMessage(`Imported ${data.inserted} rows${data.errors?.length ? ` | ${data.errors.join(" ")}` : ""}`);
    load();
  };

  if (loading) return <main className="container"><p>Loading entity runtime...</p></main>;
  if (error) return <main className="container"><p className="error">{error}</p></main>;
  if (!entity) return <main className="container"><p className="error">Unknown entity from configuration.</p></main>;

  return (
    <main className="container">
      <div className="card" style={{ marginBottom: 14 }}>
        <h2 style={{ marginTop: 0 }}>{entity.label}</h2>
        <p style={{ color: "var(--muted)" }}>Dynamic form/table rendered from JSON config. Unknown field types safely fallback to text.</p>
      </div>

      <div className="grid two">
        <section className="card">
          <h3 style={{ marginTop: 0 }}>Create record</h3>
          {entity.ui.form.map((fieldName) => {
            const field = entity.fields.find((f) => f.name === fieldName);
            if (!field) return null;
            const label = field.label[lang] || field.label.en || field.name;

            if (field.type === "enum") {
              return (
                <label key={field.name}>{label}
                  <select value={String(form[field.name] ?? "")} onChange={(e) => setForm((s) => ({ ...s, [field.name]: e.target.value }))}>
                    <option value="">Select</option>
                    {(field.options || []).map((opt) => <option key={opt} value={opt}>{opt}</option>)}
                  </select>
                </label>
              );
            }

            if (field.type === "boolean") {
              return (
                <label key={field.name} style={{ display: "block", marginTop: 10 }}>
                  <input type="checkbox" checked={Boolean(form[field.name])} onChange={(e) => setForm((s) => ({ ...s, [field.name]: e.target.checked }))} style={{ width: 16, marginRight: 8 }} />
                  {label}
                </label>
              );
            }

            return (
              <label key={field.name}>{label}
                <input type={fieldInput(field.type)} required={field.required} value={String(form[field.name] ?? "")} onChange={(e) => setForm((s) => ({ ...s, [field.name]: e.target.value }))} />
              </label>
            );
          })}
          <button className="primary" onClick={create} style={{ marginTop: 12 }}>Create</button>
        </section>

        <section className="card">
          <h3 style={{ marginTop: 0 }}>CSV import</h3>
          <p style={{ color: "var(--muted)", marginTop: 0 }}>Paste CSV with header row (comma-separated).</p>
          <textarea rows={8} value={csv} onChange={(e) => setCsv(e.target.value)} placeholder="title,status,budget" />
          <button className="secondary" style={{ marginTop: 12 }} onClick={importCsv}>Import CSV</button>
        </section>
      </div>

      <section className="card" style={{ marginTop: 16 }}>
        <h3 style={{ marginTop: 0 }}>Records</h3>
        {rows.length === 0 ? <p>No records yet.</p> : (
          <table>
            <thead><tr><th>ID</th>{entity.ui.list.map((col) => <th key={col}>{col}</th>)}<th>Actions</th></tr></thead>
            <tbody>
              {rows.map((row) => (
                <tr key={String(row.id)}>
                  <td>{String(row.id)}</td>
                  {entity.ui.list.map((col) => <td key={col}>{String(row[col] ?? "-")}</td>)}
                  <td><button className="secondary" onClick={() => remove(Number(row.id))}>Delete</button></td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </section>

      {!!message && <p style={{ color: "#166534" }}>{message}</p>}
    </main>
  );
}
