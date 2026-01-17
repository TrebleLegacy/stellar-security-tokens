/**
 * Sentry Error Monitoring for Frontend
 * 
 * Captures React errors, console.error calls, and unhandled promise rejections.
 * Set VITE_SENTRY_DSN in your environment to enable.
 */

import * as Sentry from '@sentry/react';

const SENTRY_DSN = import.meta.env.VITE_SENTRY_DSN;
const ENVIRONMENT = import.meta.env.MODE;
const RELEASE = import.meta.env.VITE_APP_VERSION || '1.0.0';

/**
 * Initialize Sentry for React
 * Call this in main.tsx before ReactDOM.createRoot()
 */
export function initSentry(): boolean {
    if (!SENTRY_DSN) {
        console.log('[Sentry] DSN not configured - error monitoring disabled');
        return false;
    }

    Sentry.init({
        dsn: SENTRY_DSN,
        environment: ENVIRONMENT,
        release: `stellar-security-tokens-frontend@${RELEASE}`,

        integrations: [
            // Capture console.error calls
            Sentry.captureConsoleIntegration({ levels: ['error'] }),
            // Track browser performance
            Sentry.browserTracingIntegration(),
        ],

        // Performance monitoring sample rate
        tracesSampleRate: ENVIRONMENT === 'production' ? 0.1 : 1.0,

        // Session replay for debugging (optional, uses more quota)
        replaysSessionSampleRate: 0,
        replaysOnErrorSampleRate: ENVIRONMENT === 'production' ? 0.1 : 0,

        // Don't send in development by default
        enabled: ENVIRONMENT === 'production',

        // Scrub sensitive data
        beforeSend(event) {
            // Remove tokens from URLs
            if (event.request?.url) {
                event.request.url = event.request.url.replace(/token=[^&]+/, 'token=[REDACTED]');
            }

            // Remove localStorage data that might contain tokens
            if (event.extra?.localStorage) {
                delete event.extra.localStorage;
            }

            return event;
        },

        // Ignore common non-actionable errors
        ignoreErrors: [
            // Network errors (usually user's connection issue)
            'Network request failed',
            'Failed to fetch',
            'Load failed',
            'NetworkError',
            // User aborted requests
            'AbortError',
            // Browser extensions causing issues
            /^chrome-extension:/,
            /^moz-extension:/,
            // Common benign errors
            'ResizeObserver loop limit exceeded',
            'ResizeObserver loop completed with undelivered notifications',
        ],

        // Filter out noisy URLs
        denyUrls: [
            // Chrome extensions
            /extensions\//i,
            /^chrome:\/\//i,
            // Firefox extensions
            /^moz-extension:\/\//i,
        ],
    });

    console.log(`[Sentry] Initialized for ${ENVIRONMENT} environment`);
    return true;
}

/**
 * Error Boundary wrapper component
 * Use this to wrap your app or specific sections
 */
export const SentryErrorBoundary = Sentry.ErrorBoundary;

/**
 * Capture an error manually
 */
export function captureError(error: Error, context?: Record<string, unknown>): void {
    if (!SENTRY_DSN) {
        console.error('[Error]', error.message, context);
        return;
    }

    Sentry.withScope((scope) => {
        if (context) {
            for (const [key, value] of Object.entries(context)) {
                scope.setExtra(key, value);
            }
        }
        Sentry.captureException(error);
    });
}

/**
 * Set user context for error reports
 */
export function setUser(user: { id?: string; email?: string; role?: string }): void {
    if (!SENTRY_DSN) return;
    Sentry.setUser(user);
}

/**
 * Clear user context (call on logout)
 */
export function clearUser(): void {
    if (!SENTRY_DSN) return;
    Sentry.setUser(null);
}

/**
 * Add a breadcrumb for debugging context
 */
export function addBreadcrumb(
    message: string,
    category = 'app',
    data?: Record<string, unknown>
): void {
    if (!SENTRY_DSN) return;

    Sentry.addBreadcrumb({
        message,
        category,
        data,
        level: 'info',
    });
}

export default {
    initSentry,
    SentryErrorBoundary,
    captureError,
    setUser,
    clearUser,
    addBreadcrumb,
};
