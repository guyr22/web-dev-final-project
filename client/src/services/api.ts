import axios, { AxiosError, InternalAxiosRequestConfig } from 'axios';
import { getAccessToken, getRefreshToken, setTokens, clearTokens } from '../context/AuthContext';

// ---------------------------------------------------------------------------
// Extend the Axios request config type to carry a _retry flag.
// This flag prevents us from retrying the request more than once.
// ---------------------------------------------------------------------------
interface RetryableRequestConfig extends InternalAxiosRequestConfig {
    _retry?: boolean;
}

const BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:3000';

const api = axios.create({
    baseURL: BASE_URL,
    headers: {
        'Content-Type': 'application/json',
    },
});

// ---------------------------------------------------------------------------
// REQUEST INTERCEPTOR
// Attach the stored access token as a Bearer token on every outgoing request.
// ---------------------------------------------------------------------------
api.interceptors.request.use(
    (config: InternalAxiosRequestConfig) => {
        const token = getAccessToken();
        if (token && config.headers) {
            config.headers['Authorization'] = `Bearer ${token}`;
        }
        return config;
    },
    (error) => Promise.reject(error)
);

// ---------------------------------------------------------------------------
// RESPONSE INTERCEPTOR
// On 401: try to refresh the access token, then transparently retry the
// original request. On refresh failure: clear tokens and redirect to /login.
// ---------------------------------------------------------------------------
api.interceptors.response.use(
    // Pass through successful responses unchanged
    (response) => response,

    async (error: AxiosError) => {
        const originalRequest = error.config as RetryableRequestConfig;

        // Only handle 401 errors that haven't already been retried
        if (error.response?.status === 401 && originalRequest && !originalRequest._retry) {
            originalRequest._retry = true; // guard against infinite loops

            const refreshToken = getRefreshToken();

            if (!refreshToken) {
                // No refresh token available — log the user out
                clearTokens();
                window.location.href = '/login';
                return Promise.reject(error);
            }

            try {
                // Call the refresh endpoint directly with a fresh axios instance
                // to avoid triggering this interceptor again.
                const { data } = await axios.post<{ accessToken: string }>(
                    `${BASE_URL}/auth/refresh`,
                    { refreshToken }
                );

                // Persist the new access token
                setTokens(data.accessToken, refreshToken);

                // Update the failed request's Authorization header and retry it
                if (originalRequest.headers) {
                    originalRequest.headers['Authorization'] = `Bearer ${data.accessToken}`;
                }
                return api(originalRequest);
            } catch {
                // Refresh failed — session is truly expired
                clearTokens();
                window.location.href = '/login';
                return Promise.reject(error);
            }
        }

        return Promise.reject(error);
    }
);

export default api;

