import React from "react";

export default class ErrorBoundary extends React.Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error) {
    return { hasError: true, error };
  }

  componentDidCatch(error, errorInfo) {
    console.error("ErrorBoundary caught:", error, errorInfo);
  }

  render() {
    if (this.state.hasError) {
      return (
        <div style={{ 
          padding: 20, 
          color: "#ff7675", 
          background: "#1a1a2e", 
          height: "100%", 
          display: "flex", 
          alignItems: "center", 
          justifyContent: "center", 
          textAlign: "center",
          flexDirection: "column"
        }}>
          <div style={{ fontSize: 18, fontWeight: 700, marginBottom: 8 }}>
            Something went wrong
          </div>
          <div style={{ fontSize: 12, color: "#8b9cbd", marginBottom: 16 }}>
            {this.props.fallback || "An error occurred in this component."}
          </div>
          {process.env.NODE_ENV === 'development' && (
            <div style={{ fontSize: 11, color: "#636e72", marginBottom: 12, maxWidth: 400, textAlign: "left" }}>
              <details style={{ cursor: "pointer" }}>
                <summary>Error details</summary>
                <pre style={{ background: "#0f0f1e", padding: 8, borderRadius: 4, overflow: "auto", maxHeight: 200 }}>
                  {this.state.error?.toString()}
                </pre>
              </details>
            </div>
          )}
          <button 
            onClick={() => window.location.reload()} 
            style={{ 
              background: "#6c63ff", 
              color: "#fff", 
              border: "none", 
              padding: "8px 12px", 
              borderRadius: 4, 
              cursor: "pointer",
              fontWeight: 600
            }}
          >
            Reload Page
          </button>
        </div>
      );
    }

    return this.props.children;
  }
}
