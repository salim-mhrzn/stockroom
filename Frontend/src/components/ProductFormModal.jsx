import { useState } from "react";
import { api } from "../api/client";

const EMPTY = {
  name: "", sku: "", category: "", price: "", stock_quantity: "0",
  low_stock_threshold: "10", description: "",
};

export default function ProductFormModal({ product, onClose, onSaved }) {
  const isEdit = !!product;
  const [form, setForm] = useState(
    product
      ? {
          name: product.name, sku: product.sku, category: product.category || "",
          price: product.price, stock_quantity: String(product.stock_quantity),
          low_stock_threshold: String(product.low_stock_threshold), description: product.description || "",
        }
      : EMPTY
  );
  const [error, setError] = useState(null);
  const [submitting, setSubmitting] = useState(false);

  function update(field, value) {
    setForm((f) => ({ ...f, [field]: value }));
  }

  async function handleSubmit(e) {
    e.preventDefault();
    setSubmitting(true);
    setError(null);
    const payload = {
      ...form,
      price: parseFloat(form.price),
      stock_quantity: parseInt(form.stock_quantity, 10),
      low_stock_threshold: parseInt(form.low_stock_threshold, 10),
    };
    try {
      if (isEdit) {
        await api.patch(`/products/${product.id}/`, payload);
      } else {
        await api.post("/products/", payload);
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
      style={{
        position: "fixed", inset: 0, background: "rgba(23,27,25,0.5)",
        display: "flex", alignItems: "center", justifyContent: "center", zIndex: 100,
      }}
      onClick={onClose}
    >
      <div
        className="card"
        style={{ width: 440, padding: 26, background: "var(--paper)" }}
        onClick={(e) => e.stopPropagation()}
      >
        <h3 style={{ fontSize: 17, marginBottom: 18 }}>{isEdit ? "Edit Product" : "New Product"}</h3>

        {error && <div className="error-banner">{error}</div>}

        <form onSubmit={handleSubmit}>
          <div className="field">
            <label>Name</label>
            <input required value={form.name} onChange={(e) => update("name", e.target.value)} autoFocus />
          </div>

          <div style={{ display: "flex", gap: 12 }}>
            <div className="field" style={{ flex: 1 }}>
              <label>SKU</label>
              <input required value={form.sku} onChange={(e) => update("sku", e.target.value)} />
            </div>
            <div className="field" style={{ flex: 1 }}>
              <label>Category</label>
              <input value={form.category} onChange={(e) => update("category", e.target.value)} />
            </div>
          </div>

          <div style={{ display: "flex", gap: 12 }}>
            <div className="field" style={{ flex: 1 }}>
              <label>Price</label>
              <input required type="number" step="0.01" min="0" value={form.price} onChange={(e) => update("price", e.target.value)} />
            </div>
            <div className="field" style={{ flex: 1 }}>
              <label>Stock qty</label>
              <input required type="number" min="0" value={form.stock_quantity} onChange={(e) => update("stock_quantity", e.target.value)} />
            </div>
            <div className="field" style={{ flex: 1 }}>
              <label>Low-stock at</label>
              <input required type="number" min="0" value={form.low_stock_threshold} onChange={(e) => update("low_stock_threshold", e.target.value)} />
            </div>
          </div>

          <div className="field">
            <label>Description</label>
            <textarea rows={2} value={form.description} onChange={(e) => update("description", e.target.value)} />
          </div>

          <div style={{ display: "flex", gap: 10, marginTop: 6 }}>
            <button type="submit" className="btn btn-primary" disabled={submitting}>
              {submitting ? "Saving..." : isEdit ? "Save changes" : "Create product"}
            </button>
            <button type="button" className="btn btn-secondary" onClick={onClose}>
              Cancel
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
