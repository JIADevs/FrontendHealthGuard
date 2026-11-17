---
name: api-integration
description: >
  Conecta el frontend Helu con el backend FastAPI mediante Axios + Zod + TanStack Query.
  Usar cuando se agregue un nuevo endpoint, se configure el cliente Axios (interceptors, auth headers,
  auto-refresh de tokens, delegación X-Patient-Context), se validen respuestas del servidor con Zod,
  se manejen errores HTTP del backend (401, 422, 403, 404), o se configure el QueryClient.
  Para el flujo de auth completo ver skill `backend-auth-flow`.
  Para mapeo de schemas Pydantic → Zod ver skill `backend-contract`.
---

# API Integration — Helu

## Estructura del package @helu/api

```
packages/api/src/
├── client.ts              ← instancia Axios con interceptors
├── queryClient.ts         ← configuración TanStack Query
├── errors.ts              ← tipos y manejo de errores
├── endpoints/
│   ├── appointments.api.ts
│   ├── medications.api.ts
│   ├── records.api.ts
│   └── files.api.ts
└── index.ts
```

## Cliente Axios con interceptors

```ts
// packages/api/src/client.ts
import axios, { type AxiosError, type AxiosInstance } from "axios";
import { env } from "@helu/config";
import { useAuthStore } from "@helu/stores";
import { ApiError, parseApiError } from "./errors";

export const apiClient: AxiosInstance = axios.create({
  baseURL:        env.API_URL,
  timeout:        15_000,
  headers: { "Content-Type": "application/json" },
});

// Request: adjunta token de auth + contexto de delegación
apiClient.interceptors.request.use((config) => {
  const { token, activePatientId } = useAuthStore.getState();
  if (token) config.headers.Authorization = `Bearer ${token}`;
  // Delegación: manager operando como paciente
  if (activePatientId) config.headers["X-Patient-Context"] = activePatientId;
  return config;
});

// Response: auto-refresh en 401, transforma errores en ApiError tipado
// Para la implementación completa de auto-refresh ver skill `backend-auth-flow`
apiClient.interceptors.response.use(
  (response) => response,
  (error: AxiosError) => {
    const apiError = parseApiError(error);
    // 401 sin refresh → limpiar sesión
    if (apiError.status === 401) {
      useAuthStore.getState().logout();
    }
    return Promise.reject(apiError);
  }
);
```

## Manejo de errores tipado (compatible con FastAPI)

```ts
// packages/api/src/errors.ts
import { z } from "zod";
import type { AxiosError } from "axios";

// Error simple del backend: { detail: "message" }
const SimpleErrorSchema = z.object({ detail: z.string() });

// Error de validación 422 de FastAPI: { detail: [{ loc, msg, type }] }
const ValidationErrorSchema = z.object({
  detail: z.array(z.object({
    loc: z.array(z.union([z.string(), z.number()])),
    msg: z.string(),
    type: z.string(),
  })),
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

  get isNotFound()     { return this.status === 404; }
  get isUnauthorized() { return this.status === 401; }
  get isForbidden()    { return this.status === 403; }
  get isValidation()   { return this.status === 422; }
  get isServerError()  { return this.status >= 500; }
  get isNetworkError() { return this.status === 0; }
}

export function parseApiError(error: AxiosError): ApiError {
  if (!error.response) {
    return new ApiError(0, "NETWORK_ERROR", "Sin conexión a internet");
  }
  const { status, data } = error.response;

  // 422 — extraer errores por campo para formularios
  if (status === 422) {
    const parsed = ValidationErrorSchema.safeParse(data);
    if (parsed.success) {
      const fieldErrors: Record<string, string> = {};
      parsed.data.detail.forEach((e) => {
        const field = e.loc[e.loc.length - 1];
        fieldErrors[String(field)] = e.msg;
      });
      return new ApiError(422, "VALIDATION_ERROR", "Error de validación", fieldErrors);
    }
  }

  // Otros errores con detail string
  const parsed = SimpleErrorSchema.safeParse(data);
  if (parsed.success) {
    return new ApiError(status, `HTTP_${status}`, parsed.data.detail);
  }
  return new ApiError(status, "UNKNOWN_ERROR", "Error inesperado del servidor");
}

export function isApiError(error: unknown): error is ApiError {
  return error instanceof ApiError;
}
```

## Endpoint con validación Zod

```ts
// packages/api/src/endpoints/appointments.api.ts
import { z } from "zod";
import { apiClient } from "../client";
import { AppointmentSchema, CreateAppointmentSchema } from "@helu/features/appointments";
import type { Appointment, CreateAppointment } from "@helu/features/appointments";

// Lista paginada
const AppointmentsResponseSchema = z.object({
  data:       z.array(AppointmentSchema),
  total:      z.number(),
  page:       z.number(),
  pageSize:   z.number(),
});

export async function getAppointments(filters?: { status?: string }) {
  const { data } = await apiClient.get("/appointments", { params: filters });
  // Zod valida que el backend devuelve lo esperado — falla ruidosamente en dev
  return AppointmentsResponseSchema.parse(data);
}

export async function getAppointmentById(id: string): Promise<Appointment> {
  const { data } = await apiClient.get(`/appointments/${id}`);
  return AppointmentSchema.parse(data);
}

export async function createAppointment(payload: CreateAppointment): Promise<Appointment> {
  const { data } = await apiClient.post("/appointments", payload);
  return AppointmentSchema.parse(data);
}

export async function cancelAppointment(id: string): Promise<Appointment> {
  const { data } = await apiClient.patch(`/appointments/${id}/cancel`);
  return AppointmentSchema.parse(data);
}
```

## Subida de archivos

```ts
// packages/api/src/endpoints/files.api.ts
import { z } from "zod";
import { apiClient } from "../client";

const UploadedFileSchema = z.object({
  id:       z.string().uuid(),
  url:      z.string().url(),
  name:     z.string(),
  mimeType: z.string(),
  size:     z.number(),
});

export type UploadedFile = z.infer<typeof UploadedFileSchema>;

export async function uploadMedicalFile(
  file: { uri: string; name: string; type: string },
  recordId: string
): Promise<UploadedFile> {
  const formData = new FormData();
  // React Native y web usan la misma API de FormData
  formData.append("file", { uri: file.uri, name: file.name, type: file.type } as unknown as Blob);
  formData.append("recordId", recordId);

  const { data } = await apiClient.post("/files/upload", formData, {
    headers: { "Content-Type": "multipart/form-data" },
  });
  return UploadedFileSchema.parse(data);
}
```

## QueryClient con configuración médica

```ts
// packages/api/src/queryClient.ts
import { QueryClient } from "@tanstack/react-query";
import { isApiError } from "./errors";

export const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime:          5 * 60 * 1000,  // 5 min
      gcTime:             30 * 60 * 1000, // 30 min en cache
      retry: (count, error) => {
        // No reintentar en errores del cliente (4xx) — incluye 422 validation
        if (isApiError(error) && error.status >= 400 && error.status < 500) return false;
        return count < 2;
      },
      refetchOnWindowFocus: false,
    },
    mutations: {
      onError: (error) => {
        if (isApiError(error)) {
          console.error(`[API Error] ${error.code}: ${error.message}`);
        }
      },
    },
  },
});
```

## Variables de entorno tipadas

```ts
// packages/config/src/env.ts
import { z } from "zod";

const envSchema = z.object({
  API_URL:     z.string().url(),
  APP_ENV:     z.enum(["development", "staging", "production"]),
});

// Falla en build si falta una variable — no en runtime
export const env = envSchema.parse({
  API_URL:    process.env.EXPO_PUBLIC_API_URL ?? process.env.NEXT_PUBLIC_API_URL,
  APP_ENV:    process.env.EXPO_PUBLIC_APP_ENV ?? process.env.NEXT_PUBLIC_APP_ENV ?? "development",
});
```

## Reglas del equipo

- **Nunca** poner lógica de negocio en archivos `.api.ts` — solo llamada + validación Zod
- **Siempre** validar respuestas con Zod aunque el backend sea "confiable"
- **Nunca** importar `apiClient` directamente en features o componentes — solo a través de funciones del endpoint
- Los errores 401 se manejan en el interceptor (auto-refresh) — no en cada hook
- Los errores 422 se parsean a `fieldErrors` para mostrar en formularios
- La delegación (`X-Patient-Context`) se inyecta automáticamente desde el interceptor
- Usar `isApiError()` en bloques catch para tipado correcto
- No reintentar requests en errores 4xx (incluye 422 validación)
