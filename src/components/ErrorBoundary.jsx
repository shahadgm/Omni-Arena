import React from 'react';
import { AlertCircle, RefreshCw, Trash2 } from 'lucide-react';

export class ErrorBoundary extends React.Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false, error: null, errorInfo: null };
  }

  static getDerivedStateFromError(error) {
    return { hasError: true, error };
  }

  componentDidCatch(error, errorInfo) {
    console.error('OmniArena ErrorBoundary caught an unhandled error:', error, errorInfo);
    this.setState({ errorInfo });
  }

  handleReload = () => {
    window.location.reload();
  };

  handleReset = () => {
    try {
      localStorage.clear();
      sessionStorage.clear();
    } catch (_e) {}
    window.location.href = '/';
  };

  render() {
    if (this.state.hasError) {
      const errorMsg = this.state.error?.message || String(this.state.error || 'Unknown application error');

      return (
        <div style={{
          minHeight: '100vh',
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          padding: '2rem 1.5rem',
          background: 'var(--bg, #0B0B12)',
          color: 'var(--text, #F4F4F8)',
          fontFamily: 'var(--font-main, system-ui, sans-serif)',
          boxSizing: 'border-box'
        }}>
          <div style={{
            maxWidth: '540px',
            width: '100%',
            background: 'var(--surface, #14141F)',
            border: '1px solid var(--border, #2A2A3C)',
            borderRadius: '16px',
            padding: '2.5rem 2rem',
            textAlign: 'center',
            boxShadow: '0 12px 36px rgba(0, 0, 0, 0.45)'
          }}>
            <div style={{
              width: '56px',
              height: '56px',
              borderRadius: '50%',
              background: 'rgba(239, 68, 68, 0.12)',
              border: '1px solid rgba(239, 68, 68, 0.3)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              margin: '0 auto 1.25rem',
              color: '#F87171'
            }}>
              <AlertCircle size={28} />
            </div>

            <h1 style={{ fontSize: '1.4rem', fontWeight: '700', marginBottom: '0.6rem', color: 'var(--text, #F4F4F8)' }}>
              Application Render Error
            </h1>

            <p style={{ color: 'var(--text-2, #C7C7D6)', fontSize: '0.9rem', lineHeight: '1.5', marginBottom: '1.25rem' }}>
              OmniArena encountered an unexpected issue while loading this view. You can reload the page or clear stored session data to recover.
            </p>

            <div style={{
              background: 'var(--surface-2, #1C1C2A)',
              border: '1px solid var(--border, #2A2A3C)',
              borderRadius: '8px',
              padding: '0.85rem 1rem',
              fontSize: '0.8rem',
              color: '#F87171',
              textAlign: 'left',
              fontFamily: 'monospace',
              marginBottom: '1.5rem',
              wordBreak: 'break-word',
              maxHeight: '140px',
              overflowY: 'auto'
            }}>
              {errorMsg}
            </div>

            <div style={{ display: 'flex', gap: '0.75rem', justifyContent: 'center', flexWrap: 'wrap' }}>
              <button
                type="button"
                onClick={this.handleReload}
                style={{
                  background: 'var(--primary, #4F46E5)',
                  color: '#fff',
                  border: 'none',
                  borderRadius: '8px',
                  padding: '0.65rem 1.25rem',
                  fontWeight: '600',
                  fontSize: '0.875rem',
                  cursor: 'pointer',
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: '0.4rem'
                }}
              >
                <RefreshCw size={15} /> Reload Page
              </button>

              <button
                type="button"
                onClick={this.handleReset}
                style={{
                  background: 'transparent',
                  color: 'var(--text, #F4F4F8)',
                  border: '1px solid var(--border, #2A2A3C)',
                  borderRadius: '8px',
                  padding: '0.65rem 1.25rem',
                  fontWeight: '600',
                  fontSize: '0.875rem',
                  cursor: 'pointer',
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: '0.4rem'
                }}
              >
                <Trash2 size={15} /> Clear Session &amp; Reset
              </button>
            </div>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}

export default ErrorBoundary;
