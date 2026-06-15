// Constantes para el formulario de citas
import { colors } from "@helu/ui";

export const MODALITIES = [
  { value: "PRESENCIAL", label: "Presencial" },
  { value: "VIRTUAL", label: "Virtual" },
  { value: "DOMICILIARIA", label: "Domiciliaria" },
] as const;

export const SPECIALTIES = [
  "Medicina general",
  "Psicología",
  "Nutrición",
  "Dermatología",
  "Odontología",
  "Oftalmología",
  "Cardiología",
  "Neurología",
  "Laboratorio",
  "Radiología",
] as const;

export const SERVICES = [
  "Consulta médica",
  "Terapia",
  "Laboratorio",
  "Radiografía",
  "Ecografía",
  "Resonancia",
  "Procedimiento",
  "Cirugía",
  "Vacunación",
  "Odontología",
] as const;

export const CONSULTATION_TYPES = [
  { value: "PRIORITARIA", label: "Prioritaria" },
  { value: "CONTROL", label: "Control" },
  { value: "PRIMERA_VEZ", label: "Primera vez" },
  { value: "EMERGENCIA", label: "Emergencia" },
] as const;

export const APPOINTMENT_STATUSES = [
  { value: "PROGRAMADA", label: "Programada" },
  { value: "ASISTI", label: "Asistí" },
  { value: "CANCELADA", label: "Cancelada" },
  { value: "NO_ASISTI", label: "No asistí" },
] as const;

export const STATUS_COLORS: Record<string, string> = {
  PROGRAMADA: colors.primary[500],
  ASISTI: colors.emerald[500],
  CANCELADA: colors.error[500],
  NO_ASISTI: colors.gray[500],
  // Legacy statuses
  PENDING: colors.warning[500],
  COMPLETED: colors.emerald[500],
  CANCELLED: colors.error[500],
  RESCHEDULED: colors.warning[500],
};
