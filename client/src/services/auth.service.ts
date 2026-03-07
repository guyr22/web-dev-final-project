import api from './api';
import { IAuthResponse } from '../types';

interface LoginPayload {
    email: string;
    password: string;
}

interface RegisterPayload {
    username: string;
    email: string;
    password: string;
}

const authService = {
    /**
     * Login with email + password.
     * Caller is responsible for storing the returned tokens.
     */
    async login(payload: LoginPayload): Promise<IAuthResponse> {
        const { data } = await api.post<IAuthResponse>('/auth/login', payload);
        return data;
    },

    /**
     * Register a new account.
     */
    async register(payload: RegisterPayload): Promise<IAuthResponse> {
        const { data } = await api.post<IAuthResponse>('/auth/register', payload);
        return data;
    },

    /**
     * Google OAuth login – send the Google ID token to the backend.
     */
    async googleLogin(idToken: string): Promise<IAuthResponse> {
        const { data } = await api.post<IAuthResponse>('/auth/google', { idToken });
        return data;
    },

    /**
     * Logout – invalidates the refresh token on the server.
     */
    async logout(refreshToken: string): Promise<void> {
        await api.post('/auth/logout', { refreshToken });
    },

    /**
     * Exchange a refresh token for a new access token.
     * NOTE: This is called directly by the Axios interceptor in api.ts
     * using a plain axios call (not the configured instance) to avoid
     * infinite retry loops.
     */
    async refreshToken(refreshToken: string): Promise<{ accessToken: string }> {
        const { data } = await api.post<{ accessToken: string }>('/auth/refresh', { refreshToken });
        return data;
    },
};

export default authService;
