---
name: feature-module
description: >
  Crea o expande un módulo de negocio médico en packages/features para la app Helu.
  Usar cuando se implemente funcionalidad de citas, medicamentos, registros médicos, dashboard,
  síntomas, diagnósticos o perfil del paciente. También cuando se cree un hook de negocio,
  se agregue un schema Zod de dominio, o se construya un formulario médico complejo.
  Define la estructura canónica de feature: schema → hook de datos → hook de UI → componente.
---

# Feature Module — Helu

## Estructura de un feature

```
packages/features/src/[feature-name]/
├── schemas/
│   └── [feature].schema.ts     ← tipos Zod + TypeScript inferidos
├── hooks/
│   ├── use[Feature]Query.ts    ← TanStack Query (lectura)
│   ├── use[Feature]Mutation.ts ← TanStack Query (escritura)
│   └── use[Feature]Form.ts     ← React Hook Form + Zod
├── components/
│   └── [Feature]Form.tsx       ← formulario del feature
└── index.ts                    ← exports públicos
```

## Paso 1 — Schema Zod (fuente de verdad de tipos)

```ts
// packages/features/src/appointments/schemas/appointment.schema.ts
import { z } from "zod";

// Schema base (lo que devuelve el servidor)
export const AppointmentSchema = z.object({
  id:          z.string().uuid(),
  patientId:   z.string().uuid(),
  doctorName:  z.string(),
  specialty:   z.string(),
  date:        z.string().datetime(),
  status:      z.enum(["pending", "confirmed", "cancelled", "completed"]),
  notes:       z.string().optional(),
  location:    z.string().optional(),
  createdAt:   z.string().datetime(),
});

// Schema para crear (sin campos generados por el servidor)
export const CreateAppointmentSchema = AppointmentSchema.omit({
  id: true, patientId: true, createdAt: true, status: true,
}).extend({
  date: z.string().datetime({ message: "Fecha inválida" }),
  doctorName: z.string().min(2, "Ingresá el nombre del médico"),
});

// Schema para actualizar (todo opcional excepto id)
export const UpdateAppointmentSchema = CreateAppointmentSchema.partial();

// Tipos inferidos — nunca definir types manuales si hay schema
export type Appointment = z.infer<typeof AppointmentSchema>;
export type CreateAppointment = z.infer<typeof CreateAppointmentSchema>;
export type UpdateAppointment = z.infer<typeof UpdateAppointmentSchema>;
```

## Paso 2 — Hook de lectura (TanStack Query)

```ts
// packages/features/src/appointments/hooks/useAppointmentsQuery.ts
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { getAppointments, getAppointmentById } from "@helu/api";
import type { Appointment } from "../schemas/appointment.schema";

// Keys centralizadas — evita typos y facilita invalidación
export const appointmentKeys = {
  all:    ()         => ["appointments"]            as const,
  lists:  ()         => [...appointmentKeys.all(), "list"]  as const,
  list:   (f: object) => [...appointmentKeys.lists(), f]    as const,
  detail: (id: string) => [...appointmentKeys.all(), id]    as const,
};

export function useAppointments(filters?: { status?: string }) {
  return useQuery({
    queryKey:  appointmentKeys.list(filters ?? {}),
    queryFn:   () => getAppointments(filters),
    staleTime: 5 * 60 * 1000,  // 5 min — datos médicos no cambian tan seguido
  });
}

export function useAppointmentById(id: string) {
  const queryClient = useQueryClient();
  return useQuery({
    queryKey: appointmentKeys.detail(id),
    queryFn:  () => getAppointmentById(id),
    // Usa datos del cache de la lista como placeholder
    placeholderData: () => {
      const cache = queryClient.getQueryData<Appointment[]>(appointmentKeys.lists());
      return cache?.find((a) => a.id === id);
    },
  });
}
```

## Paso 3 — Hook de mutación

```ts
// packages/features/src/appointments/hooks/useAppointmentsMutation.ts
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { createAppointment, updateAppointment, cancelAppointment } from "@helu/api";
import { appointmentKeys } from "./useAppointmentsQuery";
import type { CreateAppointment } from "../schemas/appointment.schema";

export function useCreateAppointment() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (data: CreateAppointment) => createAppointment(data),
    onSuccess: () => {
      // Invalida la lista para que se recargue con el nuevo ítem
      queryClient.invalidateQueries({ queryKey: appointmentKeys.lists() });
    },
    onError: (error) => {
      // El error tipado llega desde @helu/api
      console.error("[useCreateAppointment]", error);
    },
  });
}

export function useCancelAppointment() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (id: string) => cancelAppointment(id),
    onSuccess: (_data, id) => {
      // Actualiza el detalle en cache sin refetch
      queryClient.invalidateQueries({ queryKey: appointmentKeys.detail(id) });
      queryClient.invalidateQueries({ queryKey: appointmentKeys.lists() });
    },
  });
}
```

## Paso 4 — Hook de formulario

```ts
// packages/features/src/appointments/hooks/useAppointmentForm.ts
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { CreateAppointmentSchema, type CreateAppointment } from "../schemas/appointment.schema";
import { useCreateAppointment } from "./useAppointmentsMutation";

export function useAppointmentForm(onSuccess?: () => void) {
  const { mutateAsync, isPending, error } = useCreateAppointment();

  const form = useForm<CreateAppointment>({
    resolver: zodResolver(CreateAppointmentSchema),
    defaultValues: {
      doctorName: "",
      specialty:  "",
      notes:      "",
    },
  });

  const onSubmit = form.handleSubmit(async (data) => {
    await mutateAsync(data);
    form.reset();
    onSuccess?.();
  });

  return { form, onSubmit, isPending, serverError: error };
}
```

## Paso 5 — Componente de formulario

```tsx
// packages/features/src/appointments/components/AppointmentForm.tsx
// Mantener responsabilidades claras — dividir en secciones si crece
import { View } from "react-native";
import { Controller } from "react-hook-form";
import { Button, Input, ErrorText } from "@helu/ui";
import { useAppointmentForm } from "../hooks/useAppointmentForm";

type Props = { onSuccess?: () => void };

export function AppointmentForm({ onSuccess }: Props) {
  const { form, onSubmit, isPending } = useAppointmentForm(onSuccess);
  const { control, formState: { errors } } = form;

  return (
    <View className="gap-4">
      <Controller
        control={control}
        name="doctorName"
        render={({ field: { onChange, onBlur, value } }) => (
          <Input
            label="Médico"
            placeholder="Nombre del médico"
            value={value}
            onChangeText={onChange}
            onBlur={onBlur}
            error={errors.doctorName?.message}
          />
        )}
      />
      <Controller
        control={control}
        name="specialty"
        render={({ field: { onChange, onBlur, value } }) => (
          <Input
            label="Especialidad"
            placeholder="Ej: Cardiología"
            value={value}
            onChangeText={onChange}
            onBlur={onBlur}
            error={errors.specialty?.message}
          />
        )}
      />
      <Button
        label="Guardar cita"
        onPress={onSubmit}
        loading={isPending}
      />
    </View>
  );
}
```

## index.ts — exports del feature

```ts
// packages/features/src/appointments/index.ts
// Solo exportar lo que otros packages necesitan
export { useAppointments, useAppointmentById, appointmentKeys } from "./hooks/useAppointmentsQuery";
export { useCreateAppointment, useCancelAppointment } from "./hooks/useAppointmentsMutation";
export { useAppointmentForm } from "./hooks/useAppointmentForm";
export { AppointmentForm } from "./components/AppointmentForm";
export type { Appointment, CreateAppointment } from "./schemas/appointment.schema";
```

## Checklist antes de hacer PR

- [ ] Schema Zod definido antes de escribir cualquier hook o componente
- [ ] Query keys centralizadas en objeto `[feature]Keys`
- [ ] Mutaciones invalidan queries relacionadas en `onSuccess`
- [ ] Hook de formulario separado del componente
- [ ] Exports limpios en `index.ts` (solo lo público)
- [ ] Archivos con responsabilidades claras, componentizados cuando sea necesario
