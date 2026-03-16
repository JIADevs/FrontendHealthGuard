export { apiClient } from "./client";
export { ApiError, isApiError, parseApiError } from "./errors";
export * from "./schemas";
export * from "./endpoints";

// NOTE: Some consumers (e.g. legacy code or generated clients) may attempt to
// configure auth providers via `setApiAuthProviders`. The current implementation
// uses `apiClient` interceptors and `localStorage`, so we provide a no-op
// compatibility shim to avoid runtime crashes.
export function setApiAuthProviders(_: unknown): void {
  // no-op
}
