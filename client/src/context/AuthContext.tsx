import { createContext, useContext, useState, ReactNode } from 'react';
import { IUser } from '../types';

// ---------------------------------------------------------------------------
// Token storage helpers (localStorage)
// ---------------------------------------------------------------------------
const ACCESS_TOKEN_KEY = 'accessToken';
const REFRESH_TOKEN_KEY = 'refreshToken';

export const getAccessToken = (): string | null =>
    localStorage.getItem(ACCESS_TOKEN_KEY);

export const getRefreshToken = (): string | null =>
    localStorage.getItem(REFRESH_TOKEN_KEY);

export const setTokens = (accessToken: string, refreshToken: string): void => {
    localStorage.setItem(ACCESS_TOKEN_KEY, accessToken);
    localStorage.setItem(REFRESH_TOKEN_KEY, refreshToken);
};

export const clearTokens = (): void => {
    localStorage.removeItem(ACCESS_TOKEN_KEY);
    localStorage.removeItem(REFRESH_TOKEN_KEY);
    localStorage.removeItem('user');
};

// ---------------------------------------------------------------------------
// Context types
// ---------------------------------------------------------------------------
interface AuthContextValue {
    user: IUser | null;
    setUser: (user: IUser | null) => void;
    isAuthenticated: boolean;
    logout: () => void;
}

const AuthContext = createContext<AuthContextValue | undefined>(undefined);

// ---------------------------------------------------------------------------
// Provider
// ---------------------------------------------------------------------------
export function AuthProvider({ children }: { children: ReactNode }) {
    const [user, setUserState] = useState<IUser | null>(() => {
        const stored = localStorage.getItem('user');
        return stored ? JSON.parse(stored) : null;
    });

    const setUser = (u: IUser | null) => {
        setUserState(u);
        if (u) {
            localStorage.setItem('user', JSON.stringify(u));
        } else {
            localStorage.removeItem('user');
        }
    };

    const logout = () => {
        clearTokens();
        setUser(null);
    };

    return (
        <AuthContext.Provider value={{ user, setUser, isAuthenticated: !!user, logout }}>
            {children}
        </AuthContext.Provider>
    );
}

// ---------------------------------------------------------------------------
// Hook
// ---------------------------------------------------------------------------
export function useAuth(): AuthContextValue {
    const ctx = useContext(AuthContext);
    if (!ctx) throw new Error('useAuth must be used inside <AuthProvider>');
    return ctx;
}

export default AuthContext;
