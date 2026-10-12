import { z } from "zod";
import type { AxiosError } from "axios";

declare const __DEV__: boolean;

const SimpleErrorSchema = z.object({ detail: z.string() });

const ValidationErrorSchema = z.object({
    detail: z.array(
        z.object({
            loc: z.array(z.union([z.string(), z.number()])),
            msg: z.string(),
            type: z.string(),
        })
    ),
});

export class ApiError extends Error {
    constructor(
        public readonly status: number,
        public readonly code: string,
        message: string,
        public readonly fieldErrors?: Record<string, string>
    ) {
        super(message);
        this.name = "ApiError";
    }

    get isNotFound() {
        return this.status === 404;
    }
    get isUnauthorized() {
        return this.status === 401;
    }
    get isForbidden() {
        return this.status === 403;
    }
    get isConflict() {
        return this.status === 409;
    }
    get isValidation() {
        return this.status === 422;
    }
    get isServerError() {
        return this.status >= 500;
    }
    get isNetworkError() {
        return this.status === 0;
    }
}

export function parseApiError(error: AxiosError): ApiError {
    if (!error.response) {
        const code = error.code ?? "NETWORK_ERROR";
        const base = "Sin conexión a internet";
        const detail =
            typeof __DEV__ !== "undefined" && __DEV__
                ? ` (${code}: ${error.message})`
                : "";
        return new ApiError(0, code, `${base}${detail}`);
    }

    const { status, data } = error.response;

    if (status === 422) {
        const parsed = ValidationErrorSchema.safeParse(data);
        if (parsed.success) {
            const fieldErrors: Record<string, string> = {};
            parsed.data.detail.forEach((e) => {
                const field = e.loc[e.loc.length - 1];
                fieldErrors[String(field)] = e.msg;
            });
            return new ApiError(
                422,
                "VALIDATION_ERROR",
                "Error de validación",
                fieldErrors
            );
        }
    }

    const parsed = SimpleErrorSchema.safeParse(data);
    if (parsed.success) {
        return new ApiError(status, `HTTP_${status}`, parsed.data.detail);
    }

    return new ApiError(status, "UNKNOWN_ERROR", "Error inesperado del servidor");
}

export function isApiError(error: unknown): error is ApiError {
    return error instanceof ApiError;
}
