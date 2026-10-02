import { useEffect, useState, Fragment } from "react";
import { api } from "../api/client";
import OrderFormModal from "../components/OrderFormModal";
import { formatMoney } from "../utils/format";

// "completed" is for an instant walk-in sale (paid and done at the counter).
// "shipped"/"delivered" are for delivery-style orders that leave the shop
// and arrive later. Both paths end at "cancelled" if needed.
const STATUS_FLOW = ["pending", "completed", "shipped", "delivered", "cancelled"];

export default function Orders() {
  const [orders, setOrders] = useState([]);
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [creating, setCreating] = useState(false);
  const [expanded, setExpanded] = useState(null);
  const [error, setError] = useState(null);

  async function load() {
    setLoading(true);
    const [ordersRes, productsRes] = await Promise.all([
      api.get("/orders/?page_size=200"),
      api.get("/products/?page_size=200"),
    ]);
    setOrders(ordersRes.results || ordersRes);
    setProducts(productsRes.results || productsRes);
    setLoading(false);
  }

  useEffect(() => { load(); }, []);

  async function updateStatus(order, status) {
    try {
      await api.patch(`/orders/${order.id}/`, { status });
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
            {orders.length} ORDERS LOGGED
          </div>
          <h2 style={{ fontSize: 26 }}>Orders</h2>
        </div>
        <button className="btn btn-primary" onClick={() => setCreating(true)}>+ New order</button>
      </header>

      {error && <div className="error-banner">{error}</div>}

      <div className="card" style={{ overflow: "hidden" }}>
        <table style={{ width: "100%", borderCollapse: "collapse", fontSize: 14 }}>
          <thead>
            <tr style={{ background: "var(--paper-dim)", textAlign: "left" }}>
              {["Order", "Customer", "Total", "Status", "Placed", ""].map((h) => (
                <th key={h} style={{ padding: "10px 16px", fontSize: 11, textTransform: "uppercase", letterSpacing: "0.03em", color: "var(--text-muted)" }}>
                  {h}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {loading ? (
              <tr><td colSpan={6} style={{ padding: 20, textAlign: "center", color: "var(--text-muted)" }}>Loading...</td></tr>
            ) : orders.length === 0 ? (
              <tr><td colSpan={6} style={{ padding: 20, textAlign: "center", color: "var(--text-muted)" }}>No orders yet.</td></tr>
            ) : (
              orders.map((o) => (
                <Fragment key={o.id}>
                  <tr
                    style={{ borderTop: "1px solid var(--paper-dim)", cursor: "pointer" }}
                    onClick={() => setExpanded(expanded === o.id ? null : o.id)}
                  >
                    <td className="mono" style={{ padding: "10px 16px" }}>#{o.id}</td>
                    <td style={{ padding: "10px 16px", fontWeight: 600 }}>{o.customer_name}</td>
                    <td className="mono" style={{ padding: "10px 16px" }}>{formatMoney(o.total_amount)}</td>
                    <td style={{ padding: "10px 16px" }}>
                      <span className={`tag ${o.status === "pending" ? "tag-amber" : o.status === "cancelled" ? "" : "tag-teal"}`}>
                        {o.status}
                      </span>
                    </td>
                    <td style={{ padding: "10px 16px", color: "var(--text-muted)", fontSize: 13 }}>
                      {new Date(o.created_at).toLocaleDateString()}
                    </td>
                    <td style={{ padding: "10px 16px", color: "var(--text-muted)", fontSize: 12 }}>
                      {expanded === o.id ? "▲ hide" : "▼ details"}
                    </td>
                  </tr>
                  {expanded === o.id && (
                    <tr style={{ background: "var(--paper-dim)" }}>
                      <td colSpan={6} style={{ padding: "14px 16px" }}>
                        <div style={{ marginBottom: 10 }}>
                          {o.items.map((item) => (
                            <div key={item.id} style={{ display: "flex", justifyContent: "space-between", fontSize: 13, padding: "4px 0" }}>
                              <span>{item.product_name} × {item.quantity}</span>
                              <span className="mono">{formatMoney(Number(item.unit_price) * item.quantity)}</span>
                            </div>
                          ))}
                        </div>
                        <div style={{ display: "flex", gap: 8 }}>
                          {STATUS_FLOW.map((s) => (
                            <button
                              key={s}
                              onClick={(e) => { e.stopPropagation(); updateStatus(o, s); }}
                              className="btn btn-secondary"
                              style={{
                                padding: "5px 10px", fontSize: 12,
                                borderColor: o.status === s ? "var(--ink)" : "var(--line)",
                                fontWeight: o.status === s ? 700 : 500,
                              }}
                              disabled={o.status === s}
                            >
                              {s}
                            </button>
                          ))}
                        </div>
                      </td>
                    </tr>
                  )}
                </Fragment>
              ))
            )}
          </tbody>
        </table>
      </div>

      {creating && (
        <OrderFormModal
          products={products}
          onClose={() => setCreating(false)}
          onSaved={() => { setCreating(false); load(); }}
        />
      )}
    </div>
  );
}
