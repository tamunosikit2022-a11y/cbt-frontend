import { createContext, useContext, useState, useEffect, useCallback } from "react";
import API from "../utils/api";

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [student, setStudent] = useState(null);
  const [loading, setLoading] = useState(true);

  // Restore session from localStorage on mount
  useEffect(() => {
    const token = localStorage.getItem("token");
    const saved  = localStorage.getItem("student");
    if (token && saved) {
      try { setStudent(JSON.parse(saved)); }
      catch { localStorage.removeItem("student"); }
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

  // Don't render until we know auth state
  if (loading) return <div style={{ minHeight: "100vh", background: "#0B1020" }} />;

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
