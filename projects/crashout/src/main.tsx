import { Component, type ErrorInfo, type ReactNode } from 'react';
import { createRoot } from 'react-dom/client';
import './index.css';
import App from './App.tsx';
import { trackVisit } from './analytics/logger.ts';

// Funnel step 1 — fire-and-forget, never blocks render.
trackVisit();

// One uncaught throw should not leave user #1 staring at a white tab. Catch it,
// log it, and offer a reload — a duel is one render away from recoverable.
class ErrorBoundary extends Component<{ children: ReactNode }, { crashed: boolean }> {
  state = { crashed: false };

  static getDerivedStateFromError() {
    return { crashed: true };
  }

  componentDidCatch(error: Error, info: ErrorInfo) {
    console.error('CRASHOUT crashed:', error, info.componentStack);
  }

  render() {
    if (this.state.crashed) {
      return (
        <div className="fatal">
          <h1>CRASH<span>OUT</span></h1>
          <p>The arena hit a wall. Reload to run it back.</p>
          <button onClick={() => location.reload()}>RELOAD ↻</button>
        </div>
      );
    }
    return this.props.children;
  }
}

// No StrictMode: the duel runs a single requestAnimationFrame loop and emits
// analytics; double-invoking effects in dev would double-count both.
createRoot(document.getElementById('root')!).render(
  <ErrorBoundary>
    <App />
  </ErrorBoundary>,
);
