import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { api } from "../api/client";
import StockGauge from "../components/StockGauge";

function StatCard({ label, value, accent }) {
  return (
    <div className="card" style={{ padding: "18px 20px", flex: 1 }}>
      <div className="mono" style={{ fontSize: 11, color: "var(--text-muted)", textTransform: "uppercase", letterSpacing: "0.04em" }}>
        {label}
      </div>
      <div style={{ fontFamily: "var(--font-display)", fontSize: 30, fontWeight: 700, marginTop: 6, color: accent || "var(--ink)" }}>
        {value}
      </div>
    </div>
  );
}

export default function Dashboard() {
  const [products, setProducts] = useState([]);
  const [lowStock, setLowStock] = useState([]);
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function load() {
      const [productsRes, lowStockRes, ordersRes] = await Promise.all([
        api.get("/products/?page_size=1"),
        api.get("/products/low_stock/"),
        api.get("/orders/"),
      ]);
      setProducts(productsRes);
      setLowStock(lowStockRes.results || lowStockRes);
      setOrders((ordersRes.results || ordersRes).slice(0, 5));
      setLoading(false);
    }
    load();
  }, []);

  if (loading) return <p style={{ color: "var(--text-muted)" }}>Loading manifest...</p>;

  const totalOrders = orders.length;
  const pendingOrders = orders.filter((o) => o.status === "pending").length;

  return (
    <div>
      <header style={{ marginBottom: 28 }}>
        <div className="mono" style={{ fontSize: 12, color: "var(--text-muted)", marginBottom: 4 }}>
          {new Date().toLocaleDateString(undefined, { weekday: "long", year: "numeric", month: "long", day: "numeric" })}
        </div>
        <h2 style={{ fontSize: 26 }}>Dashboard</h2>
      </header>

      <div style={{ display: "flex", gap: 16, marginBottom: 32 }}>
        <StatCard label="Total Products" value={products.count ?? "—"} />
        <StatCard label="Low Stock Items" value={lowStock.length} accent={lowStock.length > 0 ? "var(--amber)" : undefined} />
        <StatCard label="Pending Orders" value={pendingOrders} accent={pendingOrders > 0 ? "var(--teal)" : undefined} />
      </div>

      <div style={{ display: "grid", gridTemplateColumns: "1.3fr 1fr", gap: 24 }}>
        <div className="card" style={{ padding: 20 }}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 14 }}>
            <h3 style={{ fontSize: 15 }}>Low Stock Alerts</h3>
            <Link to="/products" style={{ fontSize: 12, color: "var(--teal)", fontWeight: 600, textDecoration: "none" }}>
              View all products →
            </Link>
          </div>

          {lowStock.length === 0 ? (
            <p style={{ fontSize: 13, color: "var(--text-muted)" }}>All stock levels are healthy.</p>
          ) : (
            <div>
              {lowStock.map((p) => (
                <div
                  key={p.id}
                  style={{
                    display: "flex",
                    justifyContent: "space-between",
                    alignItems: "center",
                    padding: "10px 0",
                    borderBottom: "1px solid var(--paper-dim)",
                  }}
                >
                  <div>
                    <div style={{ fontSize: 13, fontWeight: 600 }}>{p.name}</div>
                    <div className="mono" style={{ fontSize: 11, color: "var(--text-muted)" }}>{p.sku}</div>
                  </div>
                  <StockGauge quantity={p.stock_quantity} threshold={p.low_stock_threshold} compact />
                </div>
              ))}
            </div>
          )}
        </div>

        <div className="card" style={{ padding: 20 }}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 14 }}>
            <h3 style={{ fontSize: 15 }}>Recent Orders</h3>
            <Link to="/orders" style={{ fontSize: 12, color: "var(--teal)", fontWeight: 600, textDecoration: "none" }}>
              View all →
            </Link>
          </div>

          {orders.length === 0 ? (
            <p style={{ fontSize: 13, color: "var(--text-muted)" }}>No orders yet.</p>
          ) : (
            orders.map((o) => (
              <div
                key={o.id}
                style={{
                  display: "flex",
                  justifyContent: "space-between",
                  padding: "10px 0",
                  borderBottom: "1px solid var(--paper-dim)",
                  fontSize: 13,
                }}
              >
                <div>
                  <span className="mono" style={{ color: "var(--text-muted)" }}>#{o.id}</span>{" "}
                  <span style={{ fontWeight: 600 }}>{o.customer_name}</span>
                </div>
                <span className={`tag ${o.status === "pending" ? "tag-amber" : "tag-teal"}`}>{o.status}</span>
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );
}
