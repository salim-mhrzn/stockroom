import { useState } from "react";
import { api } from "../api/client";
import { formatMoney } from "../utils/format";

export default function OrderFormModal({ products, onClose, onSaved }) {
  const [customerName, setCustomerName] = useState("");
  const [customerEmail, setCustomerEmail] = useState("");
  const [items, setItems] = useState([{ product_id: "", quantity: 1 }]);
  const [error, setError] = useState(null);
  const [submitting, setSubmitting] = useState(false);

  function updateItem(index, field, value) {
    setItems((prev) => prev.map((it, i) => (i === index ? { ...it, [field]: value } : it)));
  }

  function addItem() {
    setItems((prev) => [...prev, { product_id: "", quantity: 1 }]);
  }

  function removeItem(index) {
    setItems((prev) => prev.filter((_, i) => i !== index));
  }

  const selectedTotal = items.reduce((sum, it) => {
    const product = products.find((p) => String(p.id) === String(it.product_id));
    return sum + (product ? Number(product.price) * Number(it.quantity || 0) : 0);
  }, 0);

  async function handleSubmit(e) {
    e.preventDefault();
    setSubmitting(true);
    setError(null);
    try {
      await api.post("/orders/", {
        customer_name: customerName,
        customer_email: customerEmail || undefined,
        items: items
          .filter((it) => it.product_id)
          .map((it) => ({ product_id: Number(it.product_id), quantity: Number(it.quantity) })),
      });
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
      <div className="card" style={{ width: 520, padding: 26, background: "var(--paper)", maxHeight: "85vh", overflowY: "auto" }} onClick={(e) => e.stopPropagation()}>
        <h3 style={{ fontSize: 17, marginBottom: 18 }}>New Order</h3>

        {error && <div className="error-banner">{error}</div>}

        <form onSubmit={handleSubmit}>
          <div style={{ display: "flex", gap: 12 }}>
            <div className="field" style={{ flex: 1 }}>
              <label>Customer name</label>
              <input required value={customerName} onChange={(e) => setCustomerName(e.target.value)} autoFocus />
            </div>
            <div className="field" style={{ flex: 1 }}>
              <label>Email (optional)</label>
              <input type="email" value={customerEmail} onChange={(e) => setCustomerEmail(e.target.value)} />
            </div>
          </div>

          <label style={{ fontSize: 12, fontWeight: 600, textTransform: "uppercase", letterSpacing: "0.03em", color: "var(--text-muted)" }}>
            Line items
          </label>

          <div style={{ marginTop: 8, marginBottom: 6 }}>
            {items.map((item, i) => {
              const product = products.find((p) => String(p.id) === String(item.product_id));
              const overLimit = product && Number(item.quantity) > product.stock_quantity;
              return (
                <div key={i} style={{ display: "flex", gap: 8, marginBottom: 8, alignItems: "flex-start" }}>
                  <select
                    required
                    value={item.product_id}
                    onChange={(e) => updateItem(i, "product_id", e.target.value)}
                    style={{ flex: 1, padding: "9px 11px", border: "1px solid var(--line)", borderRadius: 4, background: "white" }}
                  >
                    <option value="">Select product...</option>
                    {products.map((p) => (
                      <option key={p.id} value={p.id}>
                        {p.name} ({formatMoney(p.price)}, {p.stock_quantity} in stock)
                      </option>
                    ))}
                  </select>
                  <input
                    type="number"
                    min="1"
                    required
                    value={item.quantity}
                    onChange={(e) => updateItem(i, "quantity", e.target.value)}
                    style={{
                      width: 70, padding: "9px 11px",
                      border: `1px solid ${overLimit ? "var(--red)" : "var(--line)"}`,
                      borderRadius: 4, background: "white",
                    }}
                  />
                  {items.length > 1 && (
                    <button type="button" onClick={() => removeItem(i)} className="btn btn-secondary" style={{ padding: "8px 10px" }}>
                      ×
                    </button>
                  )}
                </div>
              );
            })}
          </div>

          <button type="button" onClick={addItem} className="btn btn-secondary" style={{ fontSize: 12, padding: "6px 12px", marginBottom: 18 }}>
            + Add line item
          </button>

          <div style={{ display: "flex", justifyContent: "space-between", padding: "10px 0", borderTop: "1px solid var(--line)", marginBottom: 16 }}>
            <span style={{ fontSize: 13, fontWeight: 600 }}>Estimated total</span>
            <span className="mono" style={{ fontSize: 15, fontWeight: 600 }}>{formatMoney(selectedTotal)}</span>
          </div>

          <div style={{ display: "flex", gap: 10 }}>
            <button type="submit" className="btn btn-primary" disabled={submitting}>
              {submitting ? "Placing order..." : "Place order"}
            </button>
            <button type="button" className="btn btn-secondary" onClick={onClose}>Cancel</button>
          </div>
        </form>
      </div>
    </div>
  );
}
