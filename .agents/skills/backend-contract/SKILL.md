---
name: backend-contract
description: >
  Define cómo mapear los schemas Pydantic del backend FastAPI a Zod en el frontend Helu.
  Usar cuando se cree un nuevo archivo .api.ts, se traduzca un schema del backend a Zod,
  se implemente paginación, se manejen errores HTTP del backend (422, 401, 403, 404),
  se necesite la referencia de endpoints disponibles, o cuando haya dudas sobre aliases
  camelCase/snake_case entre frontend y backend.
---

# Backend Contract — Helu

## Principio: Pydantic → Zod

El backend define schemas en **Pydantic v2**. El frontend los replica en **Zod**.
Ambos deben ser idénticos en campos y tipos.

### Tabla de mapeo Pydantic → Zod

| Pydantic | Zod | Notas |
|---|---|---|
| `str` | `z.string()` | |
| `int` | `z.number().int()` | |
| `float` | `z.number()` | |
| `bool` | `z.boolean()` | |
| `UUID4` / `uuid.UUID` | `z.string().uuid()` | UUID como string en JSON |
| `datetime` | `z.string().datetime()` | ISO 8601 string |
| `date` | `z.string()` | `YYYY-MM-DD` |
| `time` | `z.string()` | `HH:mm:ss` |
| `Optional[T]` | `z.T().nullable()` o `.optional()` | `null` si el backend puede retornarlo |
| `List[T]` | `z.array(z.T())` | |
| `Literal["A", "B"]` | `z.enum(["A", "B"])` | |
| `Field(alias="camelCase")` | Usar `camelCase` como key en Zod | El API responde en camelCase |
| `ConfigDict(from_attributes=True)` | N/A | Solo relevante en backend |

---

## Ejemplo completo: Appointment

### Backend (Pydantic)

```python
class AppointmentBase(BaseModel):
    date: date
    time: time
    specialty: str = Field(..., max_length=100)
    doctor: str = Field(..., max_length=150)
    location: str = Field(..., max_length=200)
    type: Literal["APPOINTMENT", "EXAM"]
    status: Literal["PENDING", "COMPLETED", "CANCELLED", "RESCHEDULED"] = "PENDING"
    tags: List[str] = []
    reminder_offsets: List[int] = Field(default=[], alias="reminderOffsets")
    treatment_id: Optional[uuid.UUID] = Field(None, alias="treatmentId")
```

### Frontend (Zod)

```ts
// packages/features/src/appointments/schemas/appointment.schema.ts
import { z } from "zod";

export const AppointmentSchema = z.object({
  id: z.string().uuid(),
  userId: z.string().uuid(),
  createdBy: z.string().uuid().nullable(),
  date: z.string(),        // "2026-04-15"
  time: z.string(),        // "10:30:00"
  specialty: z.string(),
  doctor: z.string(),
  location: z.string(),
  type: z.enum(["APPOINTMENT", "EXAM"]),
  status: z.enum(["PENDING", "COMPLETED", "CANCELLED", "RESCHEDULED"]),
  tags: z.array(z.string()),
  reminderOffsets: z.array(z.number()),
  treatmentId: z.string().uuid().nullable(),
  createdAt: z.string().datetime().nullable(),
});

export const CreateAppointmentSchema = AppointmentSchema.omit({
  id: true, userId: true, createdBy: true, createdAt: true,
});

export type Appointment = z.infer<typeof AppointmentSchema>;
export type CreateAppointment = z.infer<typeof CreateAppointmentSchema>;
```

---

## Paginación estándar

El backend siempre responde listas paginadas con este formato:

```json
{
  "items": [...],
  "total": 42,
  "page": 1,
  "limit": 20,
  "totalPages": 3
}
```

### Schema Zod genérico reutilizable

```ts
// packages/api/src/schemas/pagination.schema.ts
import { z, type ZodType } from "zod";

export function createPageSchema<T extends ZodType>(itemSchema: T) {
  return z.object({
    items: z.array(itemSchema),
    total: z.number(),
    page: z.number(),
    limit: z.number(),
    totalPages: z.number(),
  });
}

// Uso:
const AppointmentPageSchema = createPageSchema(AppointmentSchema);
type AppointmentPage = z.infer<typeof AppointmentPageSchema>;
```

### Hook de paginación

```ts
// packages/features/src/shared/hooks/usePaginatedQuery.ts
import { useQuery, keepPreviousData } from "@tanstack/react-query";

export function usePaginatedQuery<T>({
  queryKey,
  queryFn,
  page,
}: {
  queryKey: readonly unknown[];
  queryFn: (page: number) => Promise<T>;
  page: number;
}) {
  return useQuery({
    queryKey: [...queryKey, page],
    queryFn: () => queryFn(page),
    placeholderData: keepPreviousData,  // mantiene datos anteriores mientras carga nueva página
  });
}
```

---

## Errores del backend

### Formato de errores FastAPI

```json
// 422 — Validation Error
{
  "detail": [
    {
      "loc": ["body", "email"],
      "msg": "value is not a valid email address",
      "type": "value_error"
    }
  ]
}

// 401, 403, 404 — Simple
{
  "detail": "Appointment not found"
}
```

### Errores tipados en el frontend

```ts
// packages/api/src/errors.ts
import type { AxiosError } from "axios";
import { z } from "zod";

// Error simple del backend
const SimpleErrorSchema = z.object({
  detail: z.string(),
});

// Error de validación 422
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

  get isNotFound() { return this.status === 404; }
  get isUnauthorized() { return this.status === 401; }
  get isForbidden() { return this.status === 403; }
  get isValidation() { return this.status === 422; }
  get isServerError() { return this.status >= 500; }
}

export function parseApiError(error: AxiosError): ApiError {
  if (!error.response) {
    return new ApiError(0, "NETWORK_ERROR", "Sin conexión a internet");
  }

  const { status, data } = error.response;

  // 422 — extraer errores por campo
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

  // Otros errores
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

---

## Referencia de endpoints del backend

### Auth
| Método | Ruta | Body | Response |
|---|---|---|---|
| POST | `/auth/signup` | `{ email, password }` | `{ message, user }` |
| POST | `/auth/login` | `{ email, password }` | `Token` |
| POST | `/auth/refresh` | `{ refresh_token }` | `Token` |

### Users
| Método | Ruta | Response |
|---|---|---|
| GET | `/users/me` | `UserProfile` |
| PUT | `/users/me` | `UserProfile` |
| POST | `/users/me/delegations` | `UserDelegation` |
| GET | `/users/me/dependents` | `List[DependentDelegation]` |
| GET | `/users/me/managers` | `List[ManagerDelegation]` |

### Appointments
| Método | Ruta | Response |
|---|---|---|
| POST | `/appointments/` | `Appointment` (201) |
| GET | `/appointments/?page=&limit=&startDate=&endDate=&searchQuery=` | `AppointmentPage` |
| GET | `/appointments/{id}` | `Appointment` |
| PUT | `/appointments/{id}` | `Appointment` |
| DELETE | `/appointments/{id}` | 204 |
| PATCH | `/appointments/{id}/status` | `Appointment` |

### Medications
| Método | Ruta | Response |
|---|---|---|
| POST | `/medications/` | `Medication` (201) |
| GET | `/medications/` | `MedicationPage` |
| GET | `/medications/{id}` | `Medication` |
| PUT | `/medications/{id}` | `Medication` |
| DELETE | `/medications/{id}` | 204 |
| POST | `/medications/{id}/intake` | `MedicationIntake` |

### Documents
| Método | Ruta | Response |
|---|---|---|
| POST | `/documents/` | `Document` (201) |
| GET | `/documents/` | `DocumentPage` |
| GET | `/documents/{id}` | `Document` |
| PUT | `/documents/{id}` | `Document` |
| DELETE | `/documents/{id}` | 204 |
| GET | `/documents/catalog/types` | `List[DocumentTypeOut]` |
| GET | `/documents/tags/categories` | `List[TagCategoryOut]` |
| POST | `/documents/{id}/share` | `{ shareUrl, qrCodeUrl, expiresAt }` |

### Backpacks
| Método | Ruta | Response |
|---|---|---|
| POST | `/backpacks/` | `Backpack` (201) |
| GET | `/backpacks/` | `BackpackPage` |
| GET | `/backpacks/{id}` | `Backpack` |
| PUT | `/backpacks/{id}` | `Backpack` |
| DELETE | `/backpacks/{id}` | 204 |
| POST | `/backpacks/{id}/documents` | `Backpack` |
| DELETE | `/backpacks/{id}/documents/{docId}` | 204 |
| POST | `/backpacks/{id}/share` | `{ shareUrl, qrCodeUrl, expiresAt }` |

### Notifications
| Método | Ruta | Response |
|---|---|---|
| GET | `/notifications/` | `NotificationPage` |
| PATCH | `/notifications/{id}` | `Notification` |
| POST | `/notifications/device-token` | `DeviceToken` (201) |

### Files
| Método | Ruta | Response |
|---|---|---|
| POST | `/files/upload` | `{ fileUrl }` (multipart) |
| GET | `/files/{path}/signed-url` | `{ url, expiresAt }` |

### Calendar
| Método | Ruta | Response |
|---|---|---|
| GET | `/calendar/?startDate=&endDate=` | `List[CalendarEvent]` |

### Other: Symptoms, Daily Check-Ins, Treatments, Jobs
> Mismo patrón CRUD paginado. Consultar `openapi.yaml` para detalles.

---

## Reglas del equipo

- **Siempre** validar responses con Zod — incluso si "confías" en el backend
- **Nunca** definir tipos TypeScript manuales si hay schema Zod — usar `z.infer<typeof Schema>`
- Los aliases del backend (`reminderOffsets`, `treatmentId`) se usan como keys en Zod — el frontend siempre trabaja en camelCase
- Usar `createPageSchema()` para todas las respuestas paginadas — no repetir el patrón
- Los errores 422 se parsean a `fieldErrors` para mostrar en formularios
- El `openapi.yaml` (128KB) en la raíz del backend es la fuente de verdad ante dudas
