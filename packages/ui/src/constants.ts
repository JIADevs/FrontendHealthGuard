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

// ─── Pagination ───────────────────────────────────────────────────────────────

/** Items por página en listas/tablas (web grid: 3×4). */
export const PAGE_SIZE_GRID = 12;

/** Items por página en listas verticales (mobile list, web tables). */
export const PAGE_SIZE_LIST = 20;
