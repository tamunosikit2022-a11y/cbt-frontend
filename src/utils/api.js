/**
 * API Utility — src/utils/api.js
 * Axios instance that automatically:
 *  - Points to your Render backend
 *  - Attaches JWT token to every request
 *  - Logs out automatically on token expiry
 */
import axios from "axios";

const API = axios.create({
  baseURL: process.env.REACT_APP_API_URL || "http://localhost:3000/api",
  timeout: 15000,
});

// Attach token to every request automatically
API.interceptors.request.use((config) => {
  const token = localStorage.getItem("token");
  if (token) config.headers.Authorization = `Bearer ${token}`;
  return config;
});

// Handle expired tokens globally
API.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      // Don't redirect on auth routes themselves
      const url = error.config?.url || "";
      const isAuthRoute = url.includes("/auth/login") ||
                          url.includes("/auth/register") ||
                          url.includes("/auth/forgot") ||
                          url.includes("/auth/reset") ||
                          url.includes("/auth/verify");

      if (!isAuthRoute) {
        localStorage.removeItem("token");
        localStorage.removeItem("student");
        window.location.href = "/login";
      }
    }
    return Promise.reject(error);
  }
);

export default API;
