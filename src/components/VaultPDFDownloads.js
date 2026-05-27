/**
 * VaultPDFDownloads.js
 *
 * Drop-in component for KnowledgeVault.js.
 * Shows all PDFs the student can download, grouped by category,
 * with a download button that hits the secure route.
 *
 * Usage inside KnowledgeVault.js:
 *   import VaultPDFDownloads from "../../components/VaultPDFDownloads";
 *   // Add this wherever you want the Downloads tab/section:
 *   <VaultPDFDownloads />
 */

import React, { useState, useEffect, useCallback } from "react";
import API from "../utils/api";  // adjust path if needed

const CATEGORY_META = {
  assignments: { label: "Assignments",  emoji: "📋", color: "#6C63FF" },
  results:     { label: "Results",      emoji: "📊", color: "#10B981" },
  notes:       { label: "Notes",        emoji: "📝", color: "#F59E0B" },
  predictions: { label: "Predictions",  emoji: "🔮", color: "#8B5CF6" },
  formulas:    { label: "Formulas",     emoji: "⚗️",  color: "#EF4444" },
  general:     { label: "General",      emoji: "📁", color: "#6B7280" },
};

function humanSize(bytes) {
  if (!bytes) return "";
  const u = ["B","KB","MB","GB"];
  let i = 0, s = bytes;
  while (s >= 1024 && i < u.length - 1) { s /= 1024; i++; }
  return `${s.toFixed(1)} ${u[i]}`;
}

function PDFCard({ pdf, onDownload, downloading }) {
  const meta = CATEGORY_META[pdf.category] || CATEGORY_META.general;

  const rarityColor = {
    legendary: "#F59E0B",
    epic:      "#8B5CF6",
    rare:      "#6C63FF",
    common:    "#10B981",
  };

  return (
    <div style={{
      background: "linear-gradient(135deg, #111827 0%, #1a2236 100%)",
      border: `1px solid ${meta.color}30`,
      borderRadius: 14,
      padding: 18,
      display: "flex",
      alignItems: "flex-start",
      gap: 14,
      transition: "transform 0.15s, box-shadow 0.15s",
    }}
      onMouseEnter={e => {
        e.currentTarget.style.transform = "translateY(-2px)";
        e.currentTarget.style.boxShadow = `0 8px 24px ${meta.color}20`;
      }}
      onMouseLeave={e => {
        e.currentTarget.style.transform = "translateY(0)";
        e.currentTarget.style.boxShadow = "none";
      }}
    >
      {/* Icon */}
      <div style={{
        width: 46, height: 46, borderRadius: 10, flexShrink: 0,
        background: `${meta.color}20`,
        display: "flex", alignItems: "center", justifyContent: "center",
        fontSize: 22,
      }}>
        📄
      </div>

      {/* Info */}
      <div style={{ flex: 1, minWidth: 0 }}>
        <div style={{ fontWeight: 700, color: "#E5E7EB", fontSize: 14, marginBottom: 3 }}>
          {pdf.title}
        </div>
        {pdf.description && (
          <div style={{ color: "#6B7280", fontSize: 12, marginBottom: 7,
            whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>
            {pdf.description}
          </div>
        )}
        <div style={{ display: "flex", gap: 8, flexWrap: "wrap", alignItems: "center" }}>
          <span style={{
            background: `${meta.color}20`, color: meta.color,
            borderRadius: 6, padding: "2px 8px", fontSize: 11, fontWeight: 600,
          }}>
            {meta.emoji} {meta.label}
          </span>
          {pdf.subject && (
            <span style={{ color: "#9CA3AF", fontSize: 11 }}>• {pdf.subject}</span>
          )}
          {pdf.pages && (
            <span style={{ color: "#9CA3AF", fontSize: 11 }}>• {pdf.pages}p</span>
          )}
          {pdf.file_size_bytes && (
            <span style={{ color: "#9CA3AF", fontSize: 11 }}>• {humanSize(pdf.file_size_bytes)}</span>
          )}
        </div>
      </div>

      {/* Download Button */}
      <button
        disabled={downloading === pdf.id}
        onClick={() => onDownload(pdf)}
        style={{
          flexShrink: 0,
          background: downloading === pdf.id
            ? "#374151"
            : `linear-gradient(135deg, ${meta.color}, ${meta.color}bb)`,
          border: "none", borderRadius: 9, padding: "9px 16px",
          color: "#fff", fontWeight: 700, fontSize: 13,
          cursor: downloading === pdf.id ? "not-allowed" : "pointer",
          display: "flex", alignItems: "center", gap: 6,
          whiteSpace: "nowrap",
        }}
      >
        {downloading === pdf.id ? (
          <><span style={{ fontSize: 14 }}>⏳</span> Downloading...</>
        ) : (
          <><span style={{ fontSize: 14 }}>⬇️</span> Download</>
        )}
      </button>
    </div>
  );
}

export default function VaultPDFDownloads() {
  const [pdfs,         setPdfs]         = useState([]);
  const [loading,      setLoading]      = useState(true);
  const [error,        setError]        = useState("");
  const [downloading,  setDownloading]  = useState(null);  // pdf id being downloaded
  const [activeFilter, setActiveFilter] = useState("all");
  const [search,       setSearch]       = useState("");
  const [toast,        setToast]        = useState("");

  const showToast = (msg) => {
    setToast(msg);
    setTimeout(() => setToast(""), 3000);
  };

  const fetchPdfs = useCallback(async () => {
    setLoading(true);
    setError("");
    try {
      const params = new URLSearchParams();
      if (activeFilter !== "all") params.set("category", activeFilter);
      const res = await API.get(`/vault/pdfs?${params}`);
      setPdfs(res.data.pdfs || []);
    } catch (err) {
      setError(err.response?.data?.error || "Failed to load PDFs.");
    }
    setLoading(false);
  }, [activeFilter]);

  useEffect(() => { fetchPdfs(); }, [fetchPdfs]);

  const handleDownload = async (pdf) => {
    setDownloading(pdf.id);
    try {
      const token = localStorage.getItem("token");
      const apiBase = process.env.REACT_APP_API_URL || "http://localhost:3000/api";

      const res = await fetch(`${apiBase}/vault/pdfs/${pdf.id}/download`, {
        headers: { Authorization: `Bearer ${token}` },
      });

      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        if (res.status === 403 && data.vault_item_id) {
          showToast(`🔐 Unlock "${pdf.title}" in the vault first!`);
        } else {
          showToast(`❌ ${data.error || "Download failed."}`);
        }
        return;
      }

      // Trigger browser download
      const blob = await res.blob();
      const url  = URL.createObjectURL(blob);
      const a    = document.createElement("a");
      a.href     = url;
      a.download = pdf.file_name || `${pdf.title}.pdf`;
      document.body.appendChild(a);
      a.click();
      a.remove();
      URL.revokeObjectURL(url);
      showToast(`✅ Downloading "${pdf.title}"...`);
    } catch (err) {
      showToast("❌ Download failed. Please try again.");
    } finally {
      setDownloading(null);
    }
  };

  const filtered = pdfs.filter(p => {
    if (search) {
      const q = search.toLowerCase();
      return (
        p.title.toLowerCase().includes(q) ||
        (p.description || "").toLowerCase().includes(q) ||
        (p.subject || "").toLowerCase().includes(q)
      );
    }
    return true;
  });

  // Group by category for display
  const grouped = {};
  filtered.forEach(pdf => {
    if (!grouped[pdf.category]) grouped[pdf.category] = [];
    grouped[pdf.category].push(pdf);
  });

  const s = {
    container: {
      padding: "0 0 40px",
      fontFamily: "'Inter', sans-serif",
    },
    header: {
      marginBottom: 20,
    },
    title: {
      fontSize: 20, fontWeight: 800, color: "#E5E7EB", margin: 0, marginBottom: 4,
    },
    subtitle: {
      color: "#6B7280", fontSize: 13,
    },
    filterRow: {
      display: "flex", gap: 8, flexWrap: "wrap", marginBottom: 16, alignItems: "center",
    },
    filterBtn: (active, color) => ({
      background: active ? `${color}20` : "#1f2937",
      border: `1px solid ${active ? color + "60" : "#374151"}`,
      color: active ? color : "#9CA3AF",
      borderRadius: 8, padding: "6px 14px",
      cursor: "pointer", fontSize: 13, fontWeight: active ? 700 : 400,
    }),
    searchInput: {
      flex: 1, minWidth: 180, maxWidth: 300,
      background: "#111827", border: "1px solid #374151",
      borderRadius: 8, padding: "8px 12px",
      color: "#fff", fontSize: 13, outline: "none",
    },
    groupTitle: {
      color: "#9CA3AF", fontSize: 12, fontWeight: 700, textTransform: "uppercase",
      letterSpacing: 1, marginBottom: 10, marginTop: 20,
      display: "flex", alignItems: "center", gap: 8,
    },
    grid: {
      display: "grid",
      gridTemplateColumns: "repeat(auto-fill, minmax(360px, 1fr))",
      gap: 12,
    },
    emptyState: {
      textAlign: "center", padding: "50px 20px",
      color: "#4B5563",
    },
    toast: {
      position: "fixed", bottom: 24, left: "50%",
      transform: "translateX(-50%)",
      background: "#1f2937", border: "1px solid #374151",
      borderRadius: 10, padding: "12px 20px",
      color: "#E5E7EB", fontSize: 14, fontWeight: 600,
      zIndex: 9999, boxShadow: "0 4px 24px rgba(0,0,0,0.4)",
      transition: "opacity 0.3s",
    },
  };

  return (
    <div style={s.container}>
      {toast && <div style={s.toast}>{toast}</div>}

      <div style={s.header}>
        <h3 style={s.title}>📥 My Downloads</h3>
        <div style={s.subtitle}>PDFs available to you — click to download instantly</div>
      </div>

      {/* Filters */}
      <div style={s.filterRow}>
        <button
          style={s.filterBtn(activeFilter === "all", "#6C63FF")}
          onClick={() => setActiveFilter("all")}
        >
          🗂️ All
        </button>
        {Object.entries(CATEGORY_META).map(([key, meta]) => (
          <button
            key={key}
            style={s.filterBtn(activeFilter === key, meta.color)}
            onClick={() => setActiveFilter(key)}
          >
            {meta.emoji} {meta.label}
          </button>
        ))}
        <input
          style={s.searchInput}
          placeholder="🔍 Search PDFs..."
          value={search}
          onChange={e => setSearch(e.target.value)}
        />
      </div>

      {/* Content */}
      {loading ? (
        <div style={s.emptyState}>
          <div style={{ fontSize: 36, marginBottom: 10 }}>⏳</div>
          Loading your PDFs...
        </div>
      ) : error ? (
        <div style={{ ...s.emptyState, color: "#EF4444" }}>
          <div style={{ fontSize: 36, marginBottom: 10 }}>❌</div>
          {error}
        </div>
      ) : filtered.length === 0 ? (
        <div style={s.emptyState}>
          <div style={{ fontSize: 48, marginBottom: 12 }}>📭</div>
          <div style={{ fontSize: 16, color: "#6B7280", marginBottom: 6 }}>No PDFs available yet</div>
          <div style={{ fontSize: 13, color: "#4B5563" }}>
            Unlock items in the Knowledge Vault to access their PDFs
          </div>
        </div>
      ) : activeFilter === "all" ? (
        // Group by category
        Object.entries(grouped).map(([cat, items]) => {
          const meta = CATEGORY_META[cat] || CATEGORY_META.general;
          return (
            <div key={cat}>
              <div style={s.groupTitle}>
                <span>{meta.emoji}</span>
                <span style={{ color: meta.color }}>{meta.label}</span>
                <span style={{ color: "#4B5563", fontWeight: 400 }}>({items.length})</span>
              </div>
              <div style={s.grid}>
                {items.map(pdf => (
                  <PDFCard
                    key={pdf.id}
                    pdf={pdf}
                    onDownload={handleDownload}
                    downloading={downloading}
                  />
                ))}
              </div>
            </div>
          );
        })
      ) : (
        <div style={s.grid}>
          {filtered.map(pdf => (
            <PDFCard
              key={pdf.id}
              pdf={pdf}
              onDownload={handleDownload}
              downloading={downloading}
            />
          ))}
        </div>
      )}
    </div>
  );
}
