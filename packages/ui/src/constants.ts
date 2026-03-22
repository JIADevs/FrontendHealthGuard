/**
 * Constantes compartidas entre web y mobile.
 */

// ─── Upload ───────────────────────────────────────────────────────────────────

export const UPLOAD_MAX_FILE_SIZE_MB    = 25;
export const UPLOAD_MAX_FILE_SIZE_BYTES = UPLOAD_MAX_FILE_SIZE_MB * 1024 * 1024;

// ─── Retry ────────────────────────────────────────────────────────────────────

/** Número máximo de reintentos para llamadas de red fallidas. */
export const RETRY_MAX_ATTEMPTS  = 3;

/** Delay base en ms para backoff exponencial entre reintentos. */
export const RETRY_BASE_DELAY_MS = 800;
