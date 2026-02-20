/**
 * Centralized auth storage utility for multi-session support.
 * 
 * SECURITY: Access tokens are stored IN MEMORY (not localStorage) to prevent XSS theft.
 * User data (non-sensitive) remains in localStorage for persistence across page reloads.
 * Refresh tokens are in httpOnly cookies (managed by the browser, invisible to JS).
 * 
 * On page reload, the access token is lost — the app calls /api/auth/refresh
 * to get a new one using the httpOnly cookie.
 */

export type UserType = 'admin' | 'company' | 'investor';

interface StorageKeys {
    user: string;
}

// In-memory token store (NOT persisted — that's the point)
const tokenStore = new Map<UserType, string>();

const STORAGE_KEYS: Record<UserType, StorageKeys> = {
    admin: { user: 'admin_user' },
    company: { user: 'company_user' },
    investor: { user: 'investor_user' },
};

// Legacy keys to clean up
const LEGACY_KEYS = ['token', 'user', 'userType', 'admin', 'admin_token', 'company_token', 'investor_token'];

/**
 * Detect user type from current URL path.
 * Falls back to 'investor' for unrecognized paths.
 */
export function detectUserType(): UserType {
    const path = window.location.pathname;
    if (path.startsWith('/admin')) return 'admin';
    if (path.startsWith('/company')) return 'company';
    return 'investor';
}

/**
 * Get the storage keys for a given user type.
 */
function getKeys(userType?: UserType): StorageKeys {
    const type = userType ?? detectUserType();
    return STORAGE_KEYS[type];
}

/**
 * Clean up any legacy token keys from localStorage.
 * Called once on module load.
 */
function cleanupLegacyKeys(): void {
    LEGACY_KEYS.forEach(key => localStorage.removeItem(key));
}

// Run cleanup once on module load
cleanupLegacyKeys();

export const authStorage = {
    /**
     * Get the access token from in-memory store.
     * Returns null if not present (e.g., after page reload — caller should refresh).
     */
    getToken(userType?: UserType): string | null {
        const type = userType ?? detectUserType();
        return tokenStore.get(type) || null;
    },

    /**
     * Set the access token in memory only (NOT localStorage).
     */
    setToken(token: string, userType?: UserType): void {
        const type = userType ?? detectUserType();
        tokenStore.set(type, token);
    },

    /**
     * Get the user object from localStorage.
     */
    getUser<T = unknown>(userType?: UserType): T | null {
        const keys = getKeys(userType);
        const userStr = localStorage.getItem(keys.user);
        if (!userStr) return null;
        try {
            return JSON.parse(userStr) as T;
        } catch {
            return null;
        }
    },

    /**
     * Set the user object in localStorage (non-sensitive data only).
     */
    setUser(user: object, userType?: UserType): void {
        const keys = getKeys(userType);
        localStorage.setItem(keys.user, JSON.stringify(user));
    },

    /**
     * Clear auth data for the specified user type.
     */
    clear(userType?: UserType): void {
        const type = userType ?? detectUserType();
        tokenStore.delete(type);
        const keys = getKeys(type);
        localStorage.removeItem(keys.user);
    },

    /**
     * Clear auth data for all user types.
     */
    clearAll(): void {
        tokenStore.clear();
        Object.values(STORAGE_KEYS).forEach(keys => {
            localStorage.removeItem(keys.user);
        });
    },

    /**
     * Check if a user has an in-memory token OR user data in storage.
     * Note: After page reload, token is gone but user data persists.
     * The caller should attempt a refresh if hasUser but no token.
     */
    isAuthenticated(userType?: UserType): boolean {
        return !!this.getToken(userType);
    },

    /**
     * Check if user data exists (survives page reload).
     */
    hasUser(userType?: UserType): boolean {
        return !!this.getUser(userType);
    },
};

export default authStorage;
