import axios, { type AxiosError, type InternalAxiosRequestConfig } from "axios";
import { env } from "@healthguard/config";
import { parseApiError } from "./errors";

export const apiClient = axios.create({
    baseURL: env.API_URL + "/api/v1",
    timeout: 15_000,
    headers: { "Content-Type": "application/json" },
});

// --- Request interceptor ---
apiClient.interceptors.request.use((config) => {
    // Import dynamically to avoid circular dependency
    // Auth store will be set up by the app at runtime
    if (typeof window !== "undefined") {
        const authData = localStorage.getItem("auth-store");
        if (authData) {
            try {
                const parsed = JSON.parse(authData);
                const token = parsed?.state?.token;
                const activePatientId = parsed?.state?.activePatientId;
                if (token) {
                    config.headers.Authorization = `Bearer ${token}`;
                }
                if (activePatientId) {
                    config.headers["X-Patient-Context"] = activePatientId;
                }
            } catch {
                // ignore parse errors
            }
        }
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
    (response) => response,
    async (error: AxiosError) => {
        const originalRequest = error.config as InternalAxiosRequestConfig & {
            _retry?: boolean;
        };

        if (error.response?.status === 401 && !originalRequest._retry) {
            // Try to refresh the token
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
                const authData = localStorage.getItem("auth-store");
                const refreshToken = authData
                    ? JSON.parse(authData)?.state?.refreshToken
                    : null;
                if (!refreshToken) throw new Error("No refresh token");

                const { data } = await axios.post(
                    `${env.API_URL}/api/v1/auth/refresh`,
                    { refresh_token: refreshToken }
                );

                const newToken = data.access_token as string;

                // Update localStorage directly (store will sync on next read)
                const current = JSON.parse(localStorage.getItem("auth-store") ?? "{}");
                current.state = {
                    ...current.state,
                    token: newToken,
                    refreshToken: data.refresh_token,
                };
                localStorage.setItem("auth-store", JSON.stringify(current));

                processQueue(null, newToken);
                originalRequest.headers.Authorization = `Bearer ${newToken}`;
                return apiClient(originalRequest);
            } catch (refreshError) {
                processQueue(refreshError, null);
                // Clear auth state
                localStorage.removeItem("auth-store");
                if (typeof window !== "undefined") {
                    window.location.href = "/login";
                }
                return Promise.reject(refreshError);
            } finally {
                isRefreshing = false;
            }
        }

        return Promise.reject(parseApiError(error));
    }
);
