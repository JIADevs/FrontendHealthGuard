---
name: platform-component
description: >
  Crea componentes con implementación diferente por plataforma (mobile/web) para la app Helu.
  Usar cuando se implemente el calendario de citas, la subida de archivos médicos, las notificaciones
  push y recordatorios, o cualquier otro componente que requiera librerías distintas en iOS/Android vs web.
  Define el patrón .native.tsx / .web.tsx con hook compartido para mantener la lógica unificada.
---

# Platform Component — Helu

## Patrón central

La lógica de negocio SIEMPRE es compartida en un hook.
Solo la presentación y las APIs nativas difieren.

```
packages/ui/src/platform/[Feature]/
├── use[Feature].ts           ← hook compartido (lógica)
├── [Feature].native.tsx      ← implementación mobile
├── [Feature].web.tsx         ← implementación web
└── index.ts                  ← export unificado
```

React Native resuelve automáticamente cuál cargar según la extensión.

---

## Calendario de citas

### Hook compartido

```ts
// packages/ui/src/platform/Calendar/useCalendar.ts
import { useState, useMemo } from "react";
import { useAppointments } from "@helu/features/appointments";

export type MarkedDate = {
  marked:     boolean;
  dotColor:   string;
  selected?:  boolean;
};

export function useCalendar() {
  const [selectedDate, setSelectedDate] = useState<string | null>(null);
  const { data, isLoading } = useAppointments();

  const markedDates = useMemo((): Record<string, MarkedDate> => {
    if (!data?.data) return {};
    return data.data.reduce((acc, appt) => {
      const dateKey = appt.date.split("T")[0]; // YYYY-MM-DD
      acc[dateKey] = {
        marked:   true,
        dotColor: appt.status === "confirmed" ? "#0E9F6E" : "#F59E0B",
        selected: dateKey === selectedDate,
      };
      return acc;
    }, {} as Record<string, MarkedDate>);
  }, [data, selectedDate]);

  const appointmentsForDate = useMemo(() => {
    if (!selectedDate || !data?.data) return [];
    return data.data.filter((a) => a.date.startsWith(selectedDate));
  }, [selectedDate, data]);

  return { selectedDate, setSelectedDate, markedDates, appointmentsForDate, isLoading };
}
```

### Implementación mobile

```tsx
// packages/ui/src/platform/Calendar/Calendar.native.tsx
import { Calendar as RNCalendar } from "react-native-calendars";
import { View, Text } from "react-native";
import { useCalendar } from "./useCalendar";
import { AppointmentItem, AppointmentItemSkeleton } from "@helu/ui";

export function AppointmentCalendar() {
  const { selectedDate, setSelectedDate, markedDates, appointmentsForDate, isLoading } =
    useCalendar();

  return (
    <View className="flex-1">
      <RNCalendar
        markedDates={markedDates}
        onDayPress={(day) => setSelectedDate(day.dateString)}
        theme={{
          selectedDayBackgroundColor: "#1A56DB",
          todayTextColor: "#1A56DB",
          dotColor: "#1A56DB",
        }}
      />
      <View className="flex-1 mt-4 px-4">
        {isLoading
          ? Array.from({ length: 3 }).map((_, i) => <AppointmentItemSkeleton key={i} />)
          : appointmentsForDate.length === 0
            ? <Text className="text-center text-gray-400 mt-8">Sin citas este día</Text>
            : appointmentsForDate.map((a) => <AppointmentItem key={a.id} appointment={a} />)
        }
      </View>
    </View>
  );
}
```

### Implementación web

```tsx
// packages/ui/src/platform/Calendar/Calendar.web.tsx
"use client";
import { ScheduleXCalendar, useNextCalendarApp } from "@schedule-x/react";
import { createCalendarControlsPlugin } from "@schedule-x/calendar-controls";
import { View } from "react-native";
import { useCalendar } from "./useCalendar";
import "@schedule-x/theme-default/dist/index.css";

export function AppointmentCalendar() {
  const { setSelectedDate, appointmentsForDate } = useCalendar();

  const calendar = useNextCalendarApp({
    views: ["month", "week"],
    callbacks: {
      onEventClick: (event) => setSelectedDate(event.start.split(" ")[0]),
    },
  });

  return (
    <View className="flex-1">
      <ScheduleXCalendar calendarApp={calendar} />
    </View>
  );
}
```

---

## Subida de archivos médicos

### Hook compartido

```ts
// packages/ui/src/platform/FilePicker/useFileUpload.ts
import { useState } from "react";
import { uploadMedicalFile } from "@helu/api";

export type PickedFile = {
  uri:  string;
  name: string;
  type: string;
  size: number;
};

export function useFileUpload(recordId: string) {
  const [isUploading, setIsUploading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [uploadedFiles, setUploadedFiles] = useState<string[]>([]);

  const upload = async (file: PickedFile) => {
    setIsUploading(true);
    setError(null);
    try {
      const result = await uploadMedicalFile(file, recordId);
      setUploadedFiles((prev) => [...prev, result.url]);
      return result;
    } catch {
      setError("No se pudo subir el archivo. Intentá de nuevo.");
      return null;
    } finally {
      setIsUploading(false);
    }
  };

  return { upload, isUploading, error, uploadedFiles };
}
```

### Implementación mobile

```tsx
// packages/ui/src/platform/FilePicker/FilePicker.native.tsx
import * as DocumentPicker from "expo-document-picker";
import * as ImagePicker from "expo-image-picker";
import { View, Pressable, Text } from "react-native";
import { useFileUpload } from "./useFileUpload";

type Props = { recordId: string };

export function FilePicker({ recordId }: Props) {
  const { upload, isUploading, error } = useFileUpload(recordId);

  const pickDocument = async () => {
    const result = await DocumentPicker.getDocumentAsync({
      type: ["application/pdf", "image/*"],
      copyToCacheDirectory: true,
    });
    if (!result.canceled && result.assets[0]) {
      const asset = result.assets[0];
      await upload({ uri: asset.uri, name: asset.name, type: asset.mimeType ?? "application/octet-stream", size: asset.size ?? 0 });
    }
  };

  return (
    <View className="gap-3">
      <Pressable
        className="border-2 border-dashed border-primary-300 rounded-xl p-6 items-center"
        onPress={pickDocument}
        disabled={isUploading}
      >
        <Text className="text-primary-500 font-semibold">
          {isUploading ? "Subiendo..." : "Seleccionar archivo"}
        </Text>
        <Text className="text-gray-400 text-sm mt-1">PDF o imagen</Text>
      </Pressable>
      {error && <Text className="text-error text-sm">{error}</Text>}
    </View>
  );
}
```

### Implementación web

```tsx
// packages/ui/src/platform/FilePicker/FilePicker.web.tsx
"use client";
import { useDropzone } from "react-dropzone";
import { View, Text } from "react-native";
import { useFileUpload } from "./useFileUpload";

type Props = { recordId: string };

export function FilePicker({ recordId }: Props) {
  const { upload, isUploading, error } = useFileUpload(recordId);

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    accept: { "application/pdf": [], "image/*": [] },
    onDrop: async ([file]) => {
      if (!file) return;
      const uri = URL.createObjectURL(file);
      await upload({ uri, name: file.name, type: file.type, size: file.size });
    },
  });

  return (
    <View>
      <div
        {...getRootProps()}
        className={`border-2 border-dashed rounded-xl p-8 text-center cursor-pointer
          ${isDragActive ? "border-primary-500 bg-blue-50" : "border-gray-300"}`}
      >
        <input {...getInputProps()} />
        <p className="text-primary-500 font-semibold">
          {isUploading ? "Subiendo..." : isDragActive ? "Soltá acá" : "Arrastrá o hacé click"}
        </p>
        <p className="text-gray-400 text-sm mt-1">PDF o imagen</p>
      </div>
      {error && <p className="text-red-500 text-sm mt-2">{error}</p>}
    </View>
  );
}
```

---

## Notificaciones y recordatorios

```ts
// packages/ui/src/platform/Notifications/notifications.native.ts
import * as Notifications from "expo-notifications";
import { Platform } from "react-native";

Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowAlert: true,
    shouldPlaySound: true,
    shouldSetBadge:  true,
  }),
});

export async function requestPermissions(): Promise<boolean> {
  const { status } = await Notifications.requestPermissionsAsync();
  return status === "granted";
}

export async function scheduleReminder(params: {
  title:     string;
  body:      string;
  date:      Date;
  id:        string;
}): Promise<void> {
  await Notifications.scheduleNotificationAsync({
    identifier: params.id,
    content:    { title: params.title, body: params.body },
    trigger:    { date: params.date },
  });
}

export async function cancelReminder(id: string): Promise<void> {
  await Notifications.cancelScheduledNotificationAsync(id);
}
```

```ts
// packages/ui/src/platform/Notifications/notifications.web.ts
export async function requestPermissions(): Promise<boolean> {
  if (!("Notification" in window)) return false;
  const result = await Notification.requestPermission();
  return result === "granted";
}

export async function scheduleReminder(params: {
  title: string; body: string; date: Date; id: string;
}): Promise<void> {
  const delay = params.date.getTime() - Date.now();
  if (delay <= 0) return;
  setTimeout(() => new Notification(params.title, { body: params.body }), delay);
}

export async function cancelReminder(_id: string): Promise<void> {
  // Web no soporta cancelación de notificaciones programadas
}
```

## Reglas del equipo

- El hook compartido NO importa nada de `react-native-*` ni de librerías nativas
- La implementación `.native.tsx` y `.web.tsx` deben tener la misma interfaz de props
- Nunca usar `Platform.OS` dentro de un componente para renderizado condicional — usar extensiones de archivo
- El `index.ts` exporta el componente sin extensión → React Native resuelve automáticamente
