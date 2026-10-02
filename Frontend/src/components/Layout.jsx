import { NavLink, Outlet } from "react-router-dom";
import { useAuth } from "../context/AuthContext";

const NAV_ITEMS = [
  { to: "/", label: "Dashboard", end: true },
  { to: "/products", label: "Products" },
  { to: "/suppliers", label: "Suppliers" },
  { to: "/orders", label: "Orders" },
];

export default function Layout() {
  const { user, logout, isAdmin } = useAuth();

  return (
    <div style={{ display: "flex", minHeight: "100vh" }}>
      <aside
        style={{
          width: 220,
          background: "var(--gunmetal)",
          color: "var(--paper)",
          display: "flex",
          flexDirection: "column",
          flexShrink: 0,
        }}
      >
        <div style={{ padding: "22px 20px 18px", borderBottom: "1px solid var(--gunmetal-light)" }}>
          <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
            <div
              style={{
                width: 10,
                height: 10,
                borderRadius: 2,
                background: "var(--amber)",
              }}
            />
            <h1 style={{ fontSize: 18, fontWeight: 700, color: "var(--paper)" }}>Stockroom</h1>
          </div>
          <div className="mono" style={{ fontSize: 11, color: "#8A928C", marginTop: 4 }}>
            INVENTORY & ORDERS
          </div>
        </div>

        <nav style={{ padding: "14px 10px", flex: 1 }}>
          {NAV_ITEMS.map((item) => (
            <NavLink
              key={item.to}
              to={item.to}
              end={item.end}
              style={({ isActive }) => ({
                display: "block",
                padding: "9px 12px",
                borderRadius: 4,
                marginBottom: 2,
                fontSize: 14,
                fontWeight: 500,
                textDecoration: "none",
                color: isActive ? "var(--gunmetal)" : "#C9CFC9",
                background: isActive ? "var(--amber)" : "transparent",
              })}
            >
              {item.label}
            </NavLink>
          ))}
        </nav>

        <div style={{ padding: "16px 20px", borderTop: "1px solid var(--gunmetal-light)" }}>
          <div style={{ fontSize: 13, fontWeight: 600, color: "var(--paper)" }}>{user?.username}</div>
          <div className="mono" style={{ fontSize: 11, color: isAdmin ? "var(--amber)" : "#8A928C" }}>
            {user?.role?.toUpperCase()}
          </div>
          <button
            onClick={logout}
            className="btn btn-secondary"
            style={{
              marginTop: 12,
              width: "100%",
              borderColor: "var(--gunmetal-light)",
              color: "var(--paper)",
              fontSize: 13,
            }}
          >
            Log out
          </button>
        </div>
      </aside>

      <main style={{ flex: 1, padding: "32px 40px", maxWidth: 1100 }}>
        <Outlet />
      </main>
    </div>
  );
}
