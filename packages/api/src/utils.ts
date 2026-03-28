import { isApiError } from "./errors";

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
