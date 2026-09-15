import React from 'react';
import ReactDOM from 'react-dom/client';
import App from './App';
import './index.css';
import { Provider } from 'react-redux';
import { store } from './store';

interface ErrorBoundaryProps {
  children: React.ReactNode;
}

interface ErrorBoundaryState {
  hasError: boolean;
  errorMessage: string;
}

class ErrorBoundary extends React.Component<ErrorBoundaryProps, ErrorBoundaryState> {
  constructor(props: ErrorBoundaryProps) {
    super(props);
    this.state = { hasError: false, errorMessage: '' };
  }

  static getDerivedStateFromError(error: any) {
    return { hasError: true, errorMessage: error?.message || String(error) };
  }

  componentDidCatch(error: any, errorInfo: any) {
    console.error("UI Crash caught by ErrorBoundary:", error, errorInfo);
  }

  render() {
    if (this.state.hasError) {
      return (
        <div style={{ padding: '30px', background: '#fff1f2', color: '#9f1239', fontFamily: 'sans-serif', margin: '20px', borderRadius: '8px', border: '1px solid #fecdd3' }}>
          <h2 style={{ margin: '0 0 10px 0' }}>Application Interface Error</h2>
          <p style={{ margin: '0 0 15px 0' }}>{this.state.errorMessage}</p>
          <button 
            onClick={() => window.location.reload()} 
            style={{ padding: '8px 16px', background: '#e11d48', color: '#fff', border: 'none', borderRadius: '4px', cursor: 'pointer', fontWeight: 600 }}
          >
            Reload Page
          </button>
        </div>
      );
    }
    return this.props.children;
  }
}

const rootElement = document.getElementById('root');
if (rootElement) {
  ReactDOM.createRoot(rootElement).render(
    <React.StrictMode>
      <ErrorBoundary>
        <Provider store={store}>
          <App />
        </Provider>
      </ErrorBoundary>
    </React.StrictMode>
  );
}
