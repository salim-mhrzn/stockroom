import { useState } from "react";
import { api } from "../api/client";

const EMPTY = { name: "", contact_email: "", contact_phone: "", address: "" };

export default function SupplierFormModal({ supplier, onClose, onSaved }) {
  const isEdit = !!supplier;
  const [form, setForm] = useState(supplier || EMPTY);
  const [error, setError] = useState(null);
  const [submitting, setSubmitting] = useState(false);

  function update(field, value) {
    setForm((f) => ({ ...f, [field]: value }));
  }

  async function handleSubmit(e) {
    e.preventDefault();
    setSubmitting(true);
    setError(null);
    try {
      if (isEdit) {
        await api.patch(`/suppliers/${supplier.id}/`, form);
      } else {
        await api.post("/suppliers/", form);
      }
      onSaved();
    } catch (err) {
      setError(err.message);
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div
      style={{ position: "fixed", inset: 0, background: "rgba(23,27,25,0.5)", display: "flex", alignItems: "center", justifyContent: "center", zIndex: 100 }}
      onClick={onClose}
    >
      <div className="card" style={{ width: 400, padding: 26, background: "var(--paper)" }} onClick={(e) => e.stopPropagation()}>
        <h3 style={{ fontSize: 17, marginBottom: 18 }}>{isEdit ? "Edit Supplier" : "New Supplier"}</h3>

        {error && <div className="error-banner">{error}</div>}

        <form onSubmit={handleSubmit}>
          <div className="field">
            <label>Name</label>
            <input required value={form.name} onChange={(e) => update("name", e.target.value)} autoFocus />
          </div>
          <div className="field">
            <label>Contact email</label>
            <input type="email" value={form.contact_email || ""} onChange={(e) => update("contact_email", e.target.value)} />
          </div>
          <div className="field">
            <label>Contact phone</label>
            <input value={form.contact_phone || ""} onChange={(e) => update("contact_phone", e.target.value)} />
          </div>
          <div className="field">
            <label>Address</label>
            <input value={form.address || ""} onChange={(e) => update("address", e.target.value)} />
          </div>

          <div style={{ display: "flex", gap: 10, marginTop: 6 }}>
            <button type="submit" className="btn btn-primary" disabled={submitting}>
              {submitting ? "Saving..." : isEdit ? "Save changes" : "Create supplier"}
            </button>
            <button type="button" className="btn btn-secondary" onClick={onClose}>Cancel</button>
          </div>
        </form>
      </div>
    </div>
  );
}
