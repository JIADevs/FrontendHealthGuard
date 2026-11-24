import type { MissionType } from "@helu/api";
import type { Tone } from "@helu/ui";

/**
 * Microcopy de Misiones (es-CO, tuteo), como `backpackCopy.ts`. Fuente: mockups `m3-misiones.js`
 * y `system/pages/misiones.md`. Progreso siempre en positivo («Llevas 4 de 10»).
 */

export const missionTypeLabel: Record<MissionType, string> = {
    medical_appointment: "Asistir a una cita médica",
    medical_exam: "Realizar un examen",
    medication: "Conseguir un medicamento",
    therapy: "Terminar una terapia",
};

export const missionTypeShort: Record<MissionType, string> = {
    medical_appointment: "Cita",
    medical_exam: "Examen",
    medication: "Medicamento",
    therapy: "Terapia",
};

/** Objetivo en lenguaje humano para el encabezado del detalle. */
export const missionGoal: Record<MissionType, string> = {
    medical_appointment: "Vamos a tu cita",
    medical_exam: "Vamos a realizar tu examen",
    medication: "Vamos a conseguir tu medicamento",
    therapy: "Vamos a terminar tu terapia",
};

/** Tinte del módulo en el chip del tipo (cita rosa, medicamento ámbar, examen sky, terapia violeta). */
export const missionTypeTone: Record<MissionType, Tone> = {
    medical_appointment: "appointment",
    medical_exam: "document",
    medication: "medication",
    therapy: "treatment",
};

export const missionTypeHint: Record<MissionType, string> = {
    medical_appointment: "Hasta que asistas",
    medical_exam: "De la orden al resultado",
    medication: "Autorización y reclamo",
    therapy: "Todas tus sesiones",
};

/** Etiqueta de cada paso por clave (plantillas v1 del backend). */
export const stepLabel: Record<string, string> = {
    get_appointment: "Conseguir la cita",
    schedule: "Autorizar y programar",
    prepare: "Prepararte",
    attend: "¿Pudiste asistir a tu cita?",
    perform: "¿Pudiste realizarte el examen?",
    results: "Obtener los resultados",
    final_documents: "Guarda los documentos",
    authorization: "Autorización",
    claim: "Reclamar o recibir",
    receipt: "¿Recibiste tu medicamento?",
    add_to_app: "Agregarlo a tus medicamentos",
    sessions_count: "Cantidad de sesiones",
    sessions: "Sesiones",
};

/** Acción primaria de «Tu próximo paso» según el paso. */
export const stepAction: Record<string, string> = {
    get_appointment: "Programar la cita",
    schedule: "Programar",
    prepare: "Prepararme ahora",
    attend: "Confirmar asistencia",
    perform: "Confirmar el examen",
    results: "Confirmar resultados",
    final_documents: "Guardar documentos",
    authorization: "Registrar la autorización",
    claim: "Ya lo reclamé",
    receipt: "Confirmar recepción",
    add_to_app: "Agregarlo",
    sessions_count: "Registrar sesiones",
    sessions: "Ver sesiones",
};

/** Texto del paso pendiente (qué lo habilita o qué viene). */
export const stepPendingHint: Record<string, string> = {
    get_appointment: "Registra dónde y cuándo es tu cita",
    schedule: "Registra la autorización y la fecha",
    prepare: "Adjunta lo que necesites llevar",
    results: "Sube o confirma tus resultados",
    final_documents: "Fórmula, órdenes o resumen · opcional",
    receipt: "Confírmalo cuando lo tengas",
};

/** «Sigue: …» en minúscula, para la lista y el encabezado. */
export function nextLabel(stepKey: string | undefined | null) {
    if (!stepKey) return "¡Todo listo!";
    const label = stepLabel[stepKey] ?? stepKey;
    return label.startsWith("¿") ? label : label.charAt(0).toLowerCase() + label.slice(1);
}

const MONTHS = ["ene", "feb", "mar", "abr", "may", "jun", "jul", "ago", "sep", "oct", "nov", "dic"];
const DAYS = ["dom", "lun", "mar", "mié", "jue", "vie", "sáb"];

function startOfDay(d: Date) {
    return new Date(d.getFullYear(), d.getMonth(), d.getDate()).getTime();
}

/** «Hoy», «Mañana», «Jueves» (esta semana) o «Vie 6 nov». */
export function relativeDay(iso: string, now = new Date()) {
    const d = new Date(iso);
    const diff = Math.round((startOfDay(d) - startOfDay(now)) / 86_400_000);
    if (diff === 0) return "hoy";
    if (diff === 1) return "mañana";
    if (diff > 1 && diff < 7) {
        const name = ["domingo", "lunes", "martes", "miércoles", "jueves", "viernes", "sábado"][d.getDay()];
        return name;
    }
    const day = DAYS[d.getDay()];
    return `${day.charAt(0).toUpperCase()}${day.slice(1)} ${d.getDate()} ${MONTHS[d.getMonth()]}`;
}

/** «7:30 a. m.» */
export function timeLabel(iso: string) {
    const d = new Date(iso);
    let h = d.getHours();
    const m = d.getMinutes();
    const suffix = h < 12 ? "a. m." : "p. m.";
    h = h % 12 || 12;
    return `${h}:${m.toString().padStart(2, "0")} ${suffix}`;
}

/** Chip de cuándo para «Tu próximo paso»: «MAÑANA · 7:30 A. M.». */
export function whenChip(iso: string | null | undefined) {
    if (!iso) return "SIN FECHA";
    return `${relativeDay(iso)} · ${timeLabel(iso)}`.toUpperCase();
}

/** «Completado · 30 oct». */
export function shortDate(iso: string | null | undefined) {
    if (!iso) return "";
    const d = new Date(iso);
    return `${d.getDate()} ${MONTHS[d.getMonth()]}`;
}
