import { Component } from "react";

export default class ErrorBoundary extends Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error) {
    return { hasError: true, error };
  }

  componentDidCatch(error, info) {
    // eslint-disable-next-line no-console
    console.error("App crashed:", error, info);
  }

  handleReload = () => {
    this.setState({ hasError: false, error: null });
    window.location.href = "/";
  };

  render() {
    if (this.state.hasError) {
      return (
        <div style={{
          minHeight: "100vh", display: "flex", flexDirection: "column",
          alignItems: "center", justifyContent: "center", gap: 16, padding: 24,
          textAlign: "center", background: "var(--bg, #0A0F1E)", color: "var(--text, #F1F5F9)",
          fontFamily: "'Plus Jakarta Sans', sans-serif",
        }}>
          <div style={{ fontSize: 48 }}>⚠️</div>
          <h2 style={{ margin: 0 }}>Something went wrong</h2>
          <p style={{ color: "var(--text-muted, #8B99C7)", maxWidth: 420 }}>
            This page hit an unexpected error. Try reloading — if the problem
            continues, please contact support.
          </p>
          {this.state.error?.message && (
            <pre style={{
              maxWidth: 480, overflow: "auto", fontSize: 12, padding: 12,
              background: "rgba(255,255,255,0.05)", borderRadius: 8,
              color: "#e17055", whiteSpace: "pre-wrap",
            }}>
              {this.state.error.message}
            </pre>
          )}
          <button
            onClick={this.handleReload}
            style={{
              padding: "12px 28px", background: "linear-gradient(135deg,#7C5CFF,#5B8CFF)",
              color: "#fff", border: "none", borderRadius: 10, fontWeight: 800,
              fontSize: 15, cursor: "pointer",
            }}
          >
            Go to Home
          </button>
        </div>
      );
    }
    return this.props.children;
  }
}
