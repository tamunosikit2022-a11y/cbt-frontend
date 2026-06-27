import { createContext, useContext, useState, useEffect, useCallback, useRef } from "react";
import API from "../utils/api";

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [student, setStudent] = useState(null);
  const [loading, setLoading] = useState(true);
  const pollRef = useRef(null);

  // Restore session from localStorage on mount
  useEffect(() => {
    const token = localStorage.getItem("token");
    const saved  = localStorage.getItem("student");
    if (token && saved) {
      try { setStudent(JSON.parse(saved)); }
      catch { localStorage.removeItem("student"); }
      // FIX BUG 8: Re-validate token silently — catches bans/downgrades
      API.get("/auth/profile").then(r => {
        localStorage.setItem("student", JSON.stringify(r.data));
        setStudent(r.data);
      }).catch(err => {
        if (err.response?.status === 401 || err.response?.status === 403) {
          localStorage.removeItem("token");
          localStorage.removeItem("student");
          setStudent(null);
        }
      });
    }
    setLoading(false);
  }, []);

  // LOGIN — sends { identifier, password } matching backend login route
  const login = useCallback(async (credentials) => {
    const res = await API.post("/auth/login", {
      identifier: credentials.identifier || credentials.email || credentials.phone,
      password:   credentials.password,
    });
    const { token, student } = res.data;
    localStorage.setItem("token",   token);
    localStorage.setItem("student", JSON.stringify(student));
    setStudent(student);
    return student;
  }, []);

  // REGISTER
  const register = useCallback(async (data) => {
    const res = await API.post("/auth/register", data);
    const { token, student } = res.data;
    localStorage.setItem("token",   token);
    localStorage.setItem("student", JSON.stringify(student));
    setStudent(student);
    return student;
  }, []);

  // LOGOUT — clears everything
  const logout = useCallback(() => {
    localStorage.removeItem("token");
    localStorage.removeItem("student");
    localStorage.removeItem("admin_token");
    setStudent(null);
  }, []);

  // REFRESH STUDENT — calls GET /auth/profile which is aliased to getMe
  const refreshStudent = useCallback(async () => {
    try {
      const res = await API.get("/auth/profile");
      const updated = res.data;
      localStorage.setItem("student", JSON.stringify(updated));
      setStudent(updated);
      return updated;
    } catch (err) {
      // Token expired — log out
      if (err.response?.status === 401) logout();
    }
  }, [logout]);

  // AUTO-POLL — silently check every 30s
  // Updates on premium flip OR token_balance change (catches WhatsApp token credits)
  useEffect(() => {
    const token = localStorage.getItem("token");
    if (!token || !student) return;

    pollRef.current = setInterval(async () => {
      if (document.visibilityState !== "visible") return;
      try {
        const res = await API.get("/auth/profile");
        const updated = res.data;
        const premiumChanged  = updated.is_premium    !== student?.is_premium;
        const tokensChanged   = updated.token_balance !== student?.token_balance;
        if (premiumChanged || tokensChanged) {
          localStorage.setItem("student", JSON.stringify(updated));
          setStudent(updated);
          if (premiumChanged && updated.is_premium) clearInterval(pollRef.current);
        }
      } catch {
        // Silently ignore network errors during background poll
      }
    }, 30000); // every 30 seconds

    return () => clearInterval(pollRef.current);
  }, [student?.is_premium, student?.id, student?.token_balance]);

  // Don't render until we know auth state
  if (loading) return (
    <div style={{ minHeight: "100vh", background: "var(--bg, #0A0F1E)", display: "flex", alignItems: "center", justifyContent: "center" }}>
      <div style={{
        width: 48, height: 48, borderRadius: 14,
        background: "linear-gradient(135deg,#7C5CFF,#5B8CFF)",
        display: "flex", alignItems: "center", justifyContent: "center", fontSize: 24,
      }}>🎓</div>
    </div>
  );

  return (
    <AuthContext.Provider value={{ student, login, register, logout, refreshStudent }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth must be used inside AuthProvider");
  return ctx;
}
