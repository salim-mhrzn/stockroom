import { useEffect, useState } from "react";
import { api } from "../api/client";
import { useAuth } from "../context/AuthContext";
import SupplierFormModal from "../components/SupplierFormModal";

export default function Suppliers() {
  const { isAdmin } = useAuth();
  const [suppliers, setSuppliers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [editing, setEditing] = useState(null);
  const [error, setError] = useState(null);

  async function load() {
    setLoading(true);
    const res = await api.get("/suppliers/?page_size=200");
    setSuppliers(res.results || res);
    setLoading(false);
  }

  useEffect(() => { load(); }, []);

  async function handleDelete(s) {
    if (!confirm(`Delete "${s.name}"?`)) return;
    try {
      await api.delete(`/suppliers/${s.id}/`);
      load();
    } catch (err) {
      setError(err.message);
    }
  }

  return (
    <div>
      <header style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-end", marginBottom: 22 }}>
        <div>
          <div className="mono" style={{ fontSize: 12, color: "var(--text-muted)", marginBottom: 4 }}>
            {suppliers.length} ON RECORD
          </div>
          <h2 style={{ fontSize: 26 }}>Suppliers</h2>
        </div>
        {isAdmin && (
          <button className="btn btn-primary" onClick={() => setEditing({})}>+ New supplier</button>
        )}
      </header>

      {error && <div className="error-banner">{error}</div>}

      <div className="card" style={{ overflow: "hidden" }}>
        <table style={{ width: "100%", borderCollapse: "collapse", fontSize: 14 }}>
          <thead>
            <tr style={{ background: "var(--paper-dim)", textAlign: "left" }}>
              {["Name", "Email", "Phone", "Address", isAdmin ? "Actions" : null].filter(Boolean).map((h) => (
                <th key={h} style={{ padding: "10px 16px", fontSize: 11, textTransform: "uppercase", letterSpacing: "0.03em", color: "var(--text-muted)" }}>
                  {h}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {loading ? (
              <tr><td colSpan={5} style={{ padding: 20, textAlign: "center", color: "var(--text-muted)" }}>Loading...</td></tr>
            ) : suppliers.length === 0 ? (
              <tr><td colSpan={5} style={{ padding: 20, textAlign: "center", color: "var(--text-muted)" }}>No suppliers yet.</td></tr>
            ) : (
              suppliers.map((s) => (
                <tr key={s.id} style={{ borderTop: "1px solid var(--paper-dim)" }}>
                  <td style={{ padding: "10px 16px", fontWeight: 600 }}>{s.name}</td>
                  <td style={{ padding: "10px 16px", color: "var(--text-muted)" }}>{s.contact_email || "—"}</td>
                  <td style={{ padding: "10px 16px", color: "var(--text-muted)" }}>{s.contact_phone || "—"}</td>
                  <td style={{ padding: "10px 16px", color: "var(--text-muted)" }}>{s.address || "—"}</td>
                  {isAdmin && (
                    <td style={{ padding: "10px 16px", whiteSpace: "nowrap" }}>
                      <button onClick={() => setEditing(s)} className="btn btn-secondary" style={{ padding: "5px 10px", fontSize: 12, marginRight: 6 }}>Edit</button>
                      <button onClick={() => handleDelete(s)} className="btn btn-danger" style={{ padding: "5px 10px", fontSize: 12 }}>Delete</button>
                    </td>
                  )}
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {editing !== null && (
        <SupplierFormModal
          supplier={editing.id ? editing : null}
          onClose={() => setEditing(null)}
          onSaved={() => { setEditing(null); load(); }}
        />
      )}
    </div>
  );
}
