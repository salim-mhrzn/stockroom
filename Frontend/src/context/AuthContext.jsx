import { createContext, useContext, useEffect, useState } from "react";
import { auth as authApi } from "../api/client";

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    async function loadUser() {
      if (authApi.isLoggedIn()) {
        try {
          const me = await authApi.me();
          setUser(me);
        } catch {
          authApi.logout();
        }
      }
      setLoading(false);
    }
    loadUser();
  }, []);

  async function login(username, password) {
    setError(null);
    try {
      const me = await authApi.login(username, password);
      setUser(me);
      return true;
    } catch (err) {
      setError(err.message);
      return false;
    }
  }

  async function register(payload) {
    setError(null);
    try {
      const me = await authApi.register(payload);
      setUser(me);
      return true;
    } catch (err) {
      setError(err.message);
      return false;
    }
  }

  function logout() {
    authApi.logout();
    setUser(null);
  }

  const isAdmin = user?.role === "admin";

  return (
    <AuthContext.Provider value={{ user, loading, error, login, register, logout, isAdmin }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  return useContext(AuthContext);
}
