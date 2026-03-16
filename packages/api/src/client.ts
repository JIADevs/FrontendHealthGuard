import axios, { type AxiosError, type InternalAxiosRequestConfig } from "axios";
import { env } from "@healthguard/config";
import { parseApiError } from "./errors";

// --- Dependency Injection for Auth ---
let _tokenProvider: (() => string | null) | null = null;
let _refreshTokenProvider: (() => string | null) | null = null;
let _patientProvider: (() => string | null) | null = null;
let _setAuth: ((token: string, refreshToken: string) => void) | null = null;
let _clearAuth: (() => void) | null = null;

export const setApiAuthProviders = (providers: {
    getToken: () => string | null;
    getRefreshToken: () => string | null;
    getPatientContext: () => string | null;
    setAuth: (token: string, refreshToken: string) => void;
    clearAuth: () => void;
}) => {
    _tokenProvider = providers.getToken;
    _refreshTokenProvider = providers.getRefreshToken;
    _patientProvider = providers.getPatientContext;
    _setAuth = providers.setAuth;
    _clearAuth = providers.clearAuth;
};

// Fallback logic for web apps that haven't injected providers
function getWebToken() {
    if (typeof window === "undefined") return null;
    try {
        const item = localStorage.getItem("auth-store");
        if (!item) return null;
        return JSON.parse(item)?.state?.token || null;
    } catch { return null; }
}

function getWebPatient() {
    if (typeof window === "undefined") return null;
    try {
        const item = localStorage.getItem("auth-store");
        if (!item) return null;
        return JSON.parse(item)?.state?.activePatientId || null;
    } catch { return null; }
}

function getWebRefreshToken() {
    if (typeof window === "undefined") return null;
    try {
        const item = localStorage.getItem("auth-store");
        if (!item) return null;
        return JSON.parse(item)?.state?.refreshToken || null;
    } catch { return null; }
}

function camelize(str: string): string {
    return str.replace(/_([a-z0-9])/g, (_, c) => c.toUpperCase());
}

function camelizeKeys(obj: unknown): unknown {
    if (Array.isArray(obj)) return obj.map(camelizeKeys);
    if (obj !== null && typeof obj === "object") {
        return Object.fromEntries(
            Object.entries(obj as Record<string, unknown>).map(([k, v]) => [
                camelize(k),
                camelizeKeys(v),
            ])
        );
    }
    return obj;
}

export const apiClient = axios.create({
    baseURL: env.API_URL + "/api/v1",
    timeout: 15_000,
    headers: { "Content-Type": "application/json" },
});

// --- Request interceptor ---
apiClient.interceptors.request.use((config) => {
    const token = _tokenProvider ? _tokenProvider() : getWebToken();
    const patientContext = _patientProvider ? _patientProvider() : getWebPatient();
    
    if (token) {
        config.headers.Authorization = `Bearer ${token}`;
    }
    if (patientContext) {
        config.headers["X-Patient-Context"] = patientContext;
    }
    return config;
});

// --- Response interceptor ---
let isRefreshing = false;
let failedQueue: Array<{
    resolve: (token: string) => void;
    reject: (error: unknown) => void;
}> = [];

const processQueue = (error: unknown, token: string | null = null) => {
    failedQueue.forEach((p) => (error ? p.reject(error) : p.resolve(token!)));
    failedQueue = [];
};

apiClient.interceptors.response.use(
    (response) => {
        response.data = camelizeKeys(response.data);
        return response;
    },
    async (error: AxiosError) => {
        const originalRequest = error.config as InternalAxiosRequestConfig & {
            _retry?: boolean;
        };

        if (error.response?.status === 401 && !originalRequest._retry) {
            if (isRefreshing) {
                return new Promise((resolve, reject) => {
                    failedQueue.push({ resolve, reject });
                }).then((token) => {
                    originalRequest.headers.Authorization = `Bearer ${token}`;
                    return apiClient(originalRequest);
                });
            }

            originalRequest._retry = true;
            isRefreshing = true;

            try {
                const refreshToken = _refreshTokenProvider ? _refreshTokenProvider() : getWebRefreshToken();
                if (!refreshToken) throw new Error("No refresh token");

                const { data } = await axios.post(
                    `${env.API_URL}/api/v1/auth/refresh`,
                    { refresh_token: refreshToken }
                );

                const newToken = data.access_token as string;
                
                if (_setAuth) {
                    _setAuth(newToken, data.refresh_token);
                } else if (typeof window !== "undefined") {
                    try {
                        const current = JSON.parse(localStorage.getItem("auth-store") ?? "{}");
                        current.state = {
                            ...current.state,
                            token: newToken,
                            refreshToken: data.refresh_token,
                        };
                        localStorage.setItem("auth-store", JSON.stringify(current));
                    } catch { /* ignore */ }
                }

                processQueue(null, newToken);
                originalRequest.headers.Authorization = `Bearer ${newToken}`;
                return apiClient(originalRequest);
            } catch (refreshError) {
                processQueue(refreshError, null);
                
                if (_clearAuth) {
                    _clearAuth();
                } else if (typeof window !== "undefined") {
                    try {
                        localStorage.removeItem("auth-store");
                        window.location.href = "/login";
                    } catch { /* ignore */ }
                }
                
                return Promise.reject(refreshError);
            } finally {
                isRefreshing = false;
            }
        }

        return Promise.reject(parseApiError(error));
    }
);

