import { useEffect, useState } from "react";
import { api } from "../api/client";
import { useAuth } from "../context/AuthContext";
import StockGauge from "../components/StockGauge";
import ProductFormModal from "../components/ProductFormModal";
import { formatMoney } from "../utils/format";

export default function Products() {
  const { isAdmin } = useAuth();
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [editing, setEditing] = useState(null); // null=closed, {}=new, {...}=edit
  const [error, setError] = useState(null);

  async function load() {
    setLoading(true);
    const res = await api.get("/products/?page_size=200");
    setProducts(res.results || res);
    setLoading(false);
  }

  useEffect(() => {
    load();
  }, []);

  async function handleDelete(product) {
    if (!confirm(`Delete "${product.name}"? This can't be undone.`)) return;
    try {
      await api.delete(`/products/${product.id}/`);
      load();
    } catch (err) {
      setError(err.message);
    }
  }

  const filtered = products.filter(
    (p) =>
      p.name.toLowerCase().includes(search.toLowerCase()) ||
      p.sku.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div>
      <header style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-end", marginBottom: 22 }}>
        <div>
          <div className="mono" style={{ fontSize: 12, color: "var(--text-muted)", marginBottom: 4 }}>
            {products.length} ITEMS ON RECORD
          </div>
          <h2 style={{ fontSize: 26 }}>Products</h2>
        </div>
        {isAdmin && (
          <button className="btn btn-primary" onClick={() => setEditing({})}>
            + New product
          </button>
        )}
      </header>

      {error && <div className="error-banner">{error}</div>}

      <input
        placeholder="Search by name or SKU..."
        value={search}
        onChange={(e) => setSearch(e.target.value)}
        style={{
          padding: "9px 12px", border: "1px solid var(--line)", borderRadius: 4,
          marginBottom: 16, width: 280, background: "white",
        }}
      />

      <div className="card" style={{ overflow: "hidden" }}>
        <table style={{ width: "100%", borderCollapse: "collapse", fontSize: 14 }}>
          <thead>
            <tr style={{ background: "var(--paper-dim)", textAlign: "left" }}>
              {["Product", "SKU", "Category", "Price", "Stock", isAdmin ? "Actions" : null]
                .filter(Boolean)
                .map((h) => (
                  <th key={h} style={{ padding: "10px 16px", fontSize: 11, textTransform: "uppercase", letterSpacing: "0.03em", color: "var(--text-muted)" }}>
                    {h}
                  </th>
                ))}
            </tr>
          </thead>
          <tbody>
            {loading ? (
              <tr><td colSpan={6} style={{ padding: 20, textAlign: "center", color: "var(--text-muted)" }}>Loading...</td></tr>
            ) : filtered.length === 0 ? (
              <tr><td colSpan={6} style={{ padding: 20, textAlign: "center", color: "var(--text-muted)" }}>No products match.</td></tr>
            ) : (
              filtered.map((p) => (
                <tr key={p.id} style={{ borderTop: "1px solid var(--paper-dim)" }}>
                  <td style={{ padding: "10px 16px", fontWeight: 600 }}>{p.name}</td>
                  <td style={{ padding: "10px 16px" }} className="mono">{p.sku}</td>
                  <td style={{ padding: "10px 16px", color: "var(--text-muted)" }}>{p.category || "—"}</td>
                  <td style={{ padding: "10px 16px" }} className="mono">{formatMoney(p.price)}</td>
                  <td style={{ padding: "10px 16px" }}>
                    <StockGauge quantity={p.stock_quantity} threshold={p.low_stock_threshold} />
                  </td>
                  {isAdmin && (
                    <td style={{ padding: "10px 16px", whiteSpace: "nowrap" }}>
                      <button onClick={() => setEditing(p)} className="btn btn-secondary" style={{ padding: "5px 10px", fontSize: 12, marginRight: 6 }}>
                        Edit
                      </button>
                      <button onClick={() => handleDelete(p)} className="btn btn-danger" style={{ padding: "5px 10px", fontSize: 12 }}>
                        Delete
                      </button>
                    </td>
                  )}
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {editing !== null && (
        <ProductFormModal
          product={editing.id ? editing : null}
          onClose={() => setEditing(null)}
          onSaved={() => { setEditing(null); load(); }}
        />
      )}
    </div>
  );
}
