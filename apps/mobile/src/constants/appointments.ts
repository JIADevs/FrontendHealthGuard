// Constantes para el formulario de citas

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
  { value: "REPROGRAMADA", label: "Reprogramada" },
  { value: "ASISTI", label: "Asistí" },
  { value: "CANCELADA", label: "Cancelada" },
  { value: "NO_ASISTI", label: "No asistí" },
] as const;

export const STATUS_COLORS: Record<string, string> = {
  PROGRAMADA: "#3B82F6",
  REPROGRAMADA: "#F59E0B",
  ASISTI: "#10B981",
  CANCELADA: "#EF4444",
  NO_ASISTI: "#6B7280",
  // Legacy statuses
  PENDING: "#3B82F6",
  COMPLETED: "#10B981",
  CANCELLED: "#EF4444",
  RESCHEDULED: "#F59E0B",
};