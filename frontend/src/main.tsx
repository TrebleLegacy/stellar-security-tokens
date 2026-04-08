import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import './index.css';
import App from './App.tsx';
import { initSentry, SentryErrorBoundary } from './lib/sentry';

// Initialize Sentry error monitoring (must be before render)
initSentry();

// Force dark mode
document.documentElement.classList.add('dark');

/**
 * Detects whether an error was caused by browser translation (Google Translate,
 * Edge Translate, etc.) mutating the DOM in a way that breaks React's fiber
 * reconciliation. These errors look like:
 *   NotFoundError: Failed to execute 'insertBefore' on 'Node': The node before
 *   which the new node is to be inserted is not a child of this node.
 *
 * When detected, we silently reload — on reload the meta[name=google] notranslate
 * tag prevents Chrome from auto-translating again, so the crash won't repeat.
 */
function isTranslationCrash(error: unknown): boolean {
  if (!(error instanceof Error)) return false;
  return (
    error.name === 'NotFoundError' &&
    (error.message.includes('insertBefore') || error.message.includes('removeChild'))
  );
}

// Fallback UI for error boundary
const ErrorFallback = ({ error }: { error?: unknown }) => {
  if (isTranslationCrash(error)) {
    // Silently recover — the notranslate meta tag will prevent re-translation on reload
    window.location.reload();
    return null;
  }

  return (
    <div className="min-h-screen bg-slate-950 flex items-center justify-center p-4">
      <div className="text-center">
        <h1 className="text-2xl font-bold text-white mb-4">Something went wrong</h1>
        <p className="text-slate-400 mb-6">
          We've been notified and are looking into it.
        </p>
        <button
          onClick={() => {
            localStorage.clear();
            sessionStorage.clear();
            window.location.href = '/';
          }}
          className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
        >
          Go to Home
        </button>
      </div>
    </div>
  );
};

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <SentryErrorBoundary fallback={({ error }) => <ErrorFallback error={error} />}>
      <App />
    </SentryErrorBoundary>
  </StrictMode>
);
