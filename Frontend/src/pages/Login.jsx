import { useState } from "react";
import { useAuth } from "../context/AuthContext";

export default function Login() {
  const { login, register, error } = useAuth();
  const [mode, setMode] = useState("login"); // "login" | "register"
  const [form, setForm] = useState({ username: "", email: "", password: "" });
  const [submitting, setSubmitting] = useState(false);

  function update(field, value) {
    setForm((f) => ({ ...f, [field]: value }));
  }

  async function handleSubmit(e) {
    e.preventDefault();
    setSubmitting(true);
    if (mode === "login") {
      await login(form.username, form.password);
    } else {
      await register({ username: form.username, email: form.email, password: form.password, role: "staff" });
    }
    setSubmitting(false);
  }

  return (
    <div
      style={{
        minHeight: "100vh",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        background: "var(--gunmetal)",
      }}
    >
      <div style={{ width: 380 }}>
        <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 28, justifyContent: "center" }}>
          <div style={{ width: 12, height: 12, borderRadius: 2, background: "var(--amber)" }} />
          <h1 style={{ fontSize: 24, fontWeight: 700, color: "var(--paper)" }}>Stockroom</h1>
        </div>

        <div className="card" style={{ padding: 28, background: "var(--paper)" }}>
          <h2 style={{ fontSize: 18, marginBottom: 4 }}>
            {mode === "login" ? "Sign in" : "Create an account"}
          </h2>
          <p style={{ fontSize: 13, color: "var(--text-muted)", marginBottom: 20 }}>
            {mode === "login"
              ? "Enter your credentials to access the manifest."
              : "New staff accounts default to read-only access."}
          </p>

          {error && <div className="error-banner">{error}</div>}

          <form onSubmit={handleSubmit}>
            <div className="field">
              <label>Username</label>
              <input
                required
                value={form.username}
                onChange={(e) => update("username", e.target.value)}
                autoFocus
              />
            </div>

            {mode === "register" && (
              <div className="field">
                <label>Email</label>
                <input
                  type="email"
                  required
                  value={form.email}
                  onChange={(e) => update("email", e.target.value)}
                />
              </div>
            )}

            <div className="field">
              <label>Password</label>
              <input
                type="password"
                required
                minLength={8}
                value={form.password}
                onChange={(e) => update("password", e.target.value)}
              />
            </div>

            <button type="submit" className="btn btn-primary" disabled={submitting} style={{ width: "100%", marginTop: 6 }}>
              {submitting ? "Please wait..." : mode === "login" ? "Sign in" : "Create account"}
            </button>
          </form>

          <button
            onClick={() => setMode(mode === "login" ? "register" : "login")}
            style={{ background: "none", border: "none", fontSize: 13, color: "var(--text-muted)", marginTop: 16, width: "100%", textAlign: "center" }}
          >
            {mode === "login" ? "Need an account? Register" : "Already have an account? Sign in"}
          </button>
        </div>
      </div>
    </div>
  );
}
