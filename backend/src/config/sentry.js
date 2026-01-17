/**
 * Sentry Error Monitoring Configuration
 * 
 * Sentry captures errors, exceptions, and performance data in production.
 * Set SENTRY_DSN in your environment to enable.
 * 
 * Free tier: 5k errors/month, 10k performance transactions
 * Get your DSN at: https://sentry.io
 */

import * as Sentry from '@sentry/node';

// Check if Sentry is enabled
const SENTRY_DSN = process.env.SENTRY_DSN;
const ENVIRONMENT = process.env.NODE_ENV || 'development';
const RELEASE = process.env.npm_package_version || '1.0.0';

/**
 * Initialize Sentry error monitoring
 * Call this at the very start of your application, before other imports
 */
export function initSentry() {
    if (!SENTRY_DSN) {
        console.log('[Sentry] DSN not configured - error monitoring disabled');
        return false;
    }

    Sentry.init({
        dsn: SENTRY_DSN,
        environment: ENVIRONMENT,
        release: `stellar-security-tokens@${RELEASE}`,

        // Performance monitoring sample rate (1.0 = 100%)
        // Reduce in production if you have high traffic
        tracesSampleRate: ENVIRONMENT === 'production' ? 0.1 : 1.0,

        // Don't send errors in test environment
        enabled: ENVIRONMENT !== 'test',

        // Scrub sensitive data
        beforeSend(event) {
            // Remove sensitive headers
            if (event.request?.headers) {
                delete event.request.headers['authorization'];
                delete event.request.headers['cookie'];
            }

            // Remove sensitive body data
            if (event.request?.data) {
                const data = typeof event.request.data === 'string'
                    ? JSON.parse(event.request.data)
                    : event.request.data;

                // Redact sensitive fields
                const sensitiveFields = ['password', 'secret', 'token', 'key', 'private'];
                for (const field of sensitiveFields) {
                    if (data[field]) {
                        data[field] = '[REDACTED]';
                    }
                }
                event.request.data = JSON.stringify(data);
            }

            return event;
        },

        // Ignore certain errors
        ignoreErrors: [
            // Ignore network errors that are usually client-side issues
            'Network request failed',
            'Failed to fetch',
            // Ignore expected errors
            'Invalid or expired token',
            'Access token required',
        ],
    });

    console.log(`[Sentry] Initialized for ${ENVIRONMENT} environment`);
    return true;
}

/**
 * Express error handler middleware for Sentry
 * Add this AFTER all routes but BEFORE your custom error handler
 */
export const sentryErrorHandler = Sentry.Handlers.errorHandler({
    shouldHandleError(error) {
        // Report all 4xx and 5xx errors
        return error.status >= 400 || !error.status;
    },
});

/**
 * Express request handler middleware for Sentry
 * Add this BEFORE all routes
 */
export const sentryRequestHandler = Sentry.Handlers.requestHandler({
    // Include user info in error reports
    user: ['id', 'email', 'role'],
});

/**
 * Capture an error manually
 */
export function captureError(error, context = {}) {
    if (!SENTRY_DSN) {
        console.error('[Error]', error.message, context);
        return;
    }

    Sentry.withScope((scope) => {
        // Add extra context
        for (const [key, value] of Object.entries(context)) {
            scope.setExtra(key, value);
        }
        Sentry.captureException(error);
    });
}

/**
 * Capture a message (for non-exception events)
 */
export function captureMessage(message, level = 'info', context = {}) {
    if (!SENTRY_DSN) {
        console.log(`[${level.toUpperCase()}]`, message, context);
        return;
    }

    Sentry.withScope((scope) => {
        scope.setLevel(level);
        for (const [key, value] of Object.entries(context)) {
            scope.setExtra(key, value);
        }
        Sentry.captureMessage(message);
    });
}

/**
 * Set user context for error reports
 */
export function setUser(user) {
    if (!SENTRY_DSN) return;

    Sentry.setUser({
        id: user.id?.toString(),
        email: user.email,
        role: user.role,
    });
}

/**
 * Clear user context (call on logout)
 */
export function clearUser() {
    if (!SENTRY_DSN) return;
    Sentry.setUser(null);
}

/**
 * Add breadcrumb for debugging context
 */
export function addBreadcrumb(message, category = 'app', data = {}) {
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
    sentryErrorHandler,
    sentryRequestHandler,
    captureError,
    captureMessage,
    setUser,
    clearUser,
    addBreadcrumb,
};
