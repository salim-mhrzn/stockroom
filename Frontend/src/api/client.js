// In production, set VITE_API_BASE_URL (e.g. in Vercel's environment
// variables) to your deployed backend's URL, like
// "https://your-backend.onrender.com/api". Falls back to local Django
// dev server when that variable isn't set, so `npm run dev` works with
// zero config out of the box.
const BASE_URL = import.meta.env.VITE_API_BASE_URL || "http://127.0.0.1:8000/api";

function getTokens() {
  const raw = localStorage.getItem("stockroom_tokens");
  return raw ? JSON.parse(raw) : null;
}

function setTokens(tokens) {
  localStorage.setItem("stockroom_tokens", JSON.stringify(tokens));
}

function clearTokens() {
  localStorage.removeItem("stockroom_tokens");
}

// Core request helper. Automatically attaches the JWT and retries once
// with a refreshed token if the access token has expired.
async function request(path, { method = "GET", body, auth = true, retry = true } = {}) {
  const headers = { "Content-Type": "application/json" };
  const tokens = getTokens();

  if (auth && tokens?.access) {
    headers["Authorization"] = `Bearer ${tokens.access}`;
  }

  const res = await fetch(`${BASE_URL}${path}`, {
    method,
    headers,
    body: body ? JSON.stringify(body) : undefined,
  });

  // Access token expired -- try to refresh once, then retry the request.
  if (res.status === 401 && auth && retry && tokens?.refresh) {
    const refreshed = await refreshAccessToken(tokens.refresh);
    if (refreshed) {
      return request(path, { method, body, auth, retry: false });
    }
    clearTokens();
    window.location.reload();
    return;
  }

  if (!res.ok) {
    let detail = `Request failed (${res.status})`;
    try {
      const data = await res.json();
      detail = extractErrorMessage(data) || detail;
    } catch {
      // response wasn't JSON; keep default message
    }
    throw new Error(detail);
  }

  if (res.status === 204) return null;
  return res.json();
}

function extractErrorMessage(data) {
  if (typeof data === "string") return data;
  if (data.detail) return data.detail;
  // DRF validation errors come back as {field: [messages]} or {items: [...]}
  const firstKey = Object.keys(data)[0];
  if (firstKey) {
    const val = data[firstKey];
    return Array.isArray(val) ? val.join(" ") : String(val);
  }
  return null;
}

async function refreshAccessToken(refresh) {
  try {
    const res = await fetch(`${BASE_URL}/auth/login/refresh/`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ refresh }),
    });
    if (!res.ok) return false;
    const data = await res.json();
    setTokens({ access: data.access, refresh });
    return true;
  } catch {
    return false;
  }
}

export const api = {
  get: (path) => request(path, { method: "GET" }),
  post: (path, body, opts = {}) => request(path, { method: "POST", body, ...opts }),
  patch: (path, body) => request(path, { method: "PATCH", body }),
  delete: (path) => request(path, { method: "DELETE" }),
};

export const auth = {
  async login(username, password) {
    const data = await request("/auth/login/", {
      method: "POST",
      body: { username, password },
      auth: false,
    });
    setTokens({ access: data.access, refresh: data.refresh });
    return this.me();
  },

  async register(payload) {
    await request("/auth/register/", { method: "POST", body: payload, auth: false });
    return this.login(payload.username, payload.password);
  },

  async me() {
    return request("/auth/me/");
  },

  logout() {
    clearTokens();
  },

  isLoggedIn() {
    return !!getTokens()?.access;
  },
};
