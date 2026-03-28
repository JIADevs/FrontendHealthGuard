import { isApiError } from "./errors";

// ─── Upload / Retry defaults ──────────────────────────────────────────────────
// These are API-behavior constants (server limits & network retry policy).

export const UPLOAD_MAX_FILE_SIZE_MB    = 25;
export const UPLOAD_MAX_FILE_SIZE_BYTES = UPLOAD_MAX_FILE_SIZE_MB * 1024 * 1024;

/** Número máximo de reintentos para llamadas de red fallidas. */
export const RETRY_MAX_ATTEMPTS  = 3;

/** Delay base en ms para backoff exponencial entre reintentos. */
export const RETRY_BASE_DELAY_MS = 800;

function delay(ms: number) {
    return new Promise((r) => setTimeout(r, ms));
}

export interface RetryOptions {
    maxAttempts: number;
    baseDelayMs: number;
    /** Return false to stop retrying immediately (non-retriable error). Default: true for network errors. */
    isRetryable?: (err: unknown) => boolean;
}

/**
 * Retries an async function with exponential backoff.
 * Throws the last error if all attempts fail.
 */
export async function retryAsync<T>(
    fn: () => Promise<T>,
    options: RetryOptions,
): Promise<T> {
    const { maxAttempts, baseDelayMs, isRetryable } = options;
    let lastErr: unknown;

    for (let attempt = 1; attempt <= maxAttempts; attempt++) {
        try {
            return await fn();
        } catch (err) {
            lastErr = err;
            const shouldRetry = isRetryable
                ? isRetryable(err)
                : isApiError(err)
                    ? err.isNetworkError
                    : !(err instanceof SyntaxError || err instanceof TypeError);
            if (!shouldRetry || attempt >= maxAttempts) break;
            await delay(baseDelayMs * Math.pow(2, attempt - 1));
        }
    }

    throw lastErr;
}
