import type { MissionSessions, MissionType } from "@helu/api";
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

/** Dato mínimo por tipo (mission_details.py): solo lo que hace falta para empezar. */
export const missionField: Record<MissionType, { label: string; placeholder: string; key: string; required: boolean }> = {
    medical_appointment: { label: "Especialidad (opcional)", placeholder: "Ej: Ortopedia", key: "specialty", required: false },
    medical_exam: { label: "¿Qué examen?", placeholder: "Ej: Resonancia magnética de rodilla", key: "exam_name", required: true },
    medication: { label: "¿Qué medicamento? (opcional)", placeholder: "Ej: Metformina 850 mg", key: "medication_name", required: false },
    therapy: { label: "¿Qué terapia?", placeholder: "Ej: Fisioterapia", key: "therapy_type", required: true },
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

type StepsOf = { type: string; steps: { key: string; label?: string | null; hint?: string | null }[] };

/**
 * Título de un paso en esta misión. El examen v2 separa la autorización (DU-41): su paso
 * `schedule` ya no autoriza, solo programa. Una clave que la app no conoce usa la etiqueta del
 * backend (RF-100); `fromBackend` la prefiere siempre (hojas `attach` y `yes_no`).
 */
export function stepTitle(mission: StepsOf, key: string, fromBackend = false): string {
    const step = mission.steps.find((s) => s.key === key);
    if (fromBackend && step?.label) return step.label;
    if (key === "schedule" && mission.type === "medical_exam" && mission.steps.some((s) => s.key === "authorization")) {
        return "Programar el examen";
    }
    return stepLabel[key] ?? step?.label ?? key;
}

/** Texto de un paso pendiente en esta misión (ver `stepTitle`). */
export function stepHint(mission: StepsOf, key: string): string | undefined {
    if (key === "schedule" && mission.type === "medical_exam" && mission.steps.some((s) => s.key === "authorization")) {
        return "Registra dónde y cuándo te harás el examen";
    }
    if (key === "authorization") return "Sube la autorización · opcional";
    return stepPendingHint[key] ?? mission.steps.find((s) => s.key === key)?.hint ?? undefined;
}

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

export function capitalize(text: string) {
    return text ? text.charAt(0).toUpperCase() + text.slice(1) : text;
}

/** «el jueves», «hoy», «mañana» or «el vie 6 nov» after «es». */
function onDay(iso: string) {
    const day = relativeDay(iso);
    return day === "hoy" || day === "mañana" ? day : `el ${day.charAt(0).toLowerCase()}${day.slice(1)}`;
}

/**
 * Message of the sessions step (RF-43, DU-31). The ordinal comes from the backend (`sessions.label`);
 * for a scheduled session the day is added here: «Tu quinta sesión es el jueves».
 */
export function sessionMessage(sessions: MissionSessions | null | undefined) {
    if (!sessions) return "Sesiones";
    const label = sessions.label ?? "Sesiones";
    const next = sessions.next;
    if (sessions.phase === "upcoming" && next) return `${label} es ${onDay(`${next.date}T${(next.time ?? "00:00").slice(0, 5)}`)}`;
    return label;
}

/** «Sesiones · 4 de 10», or just «Sesiones» while the total is pending (RF-40). */
export function sessionsTitle(sessions: MissionSessions | null | undefined) {
    if (!sessions?.total) return "Sesiones";
    return `Sesiones · ${sessions.attended} de ${sessions.total}`;
}

/** «Sigue: …» from the backend label of the next action (falls back to the step key). */
export function nextActionLabel(action: { stepKey: string; label?: string | null } | null | undefined) {
    if (!action) return "¡Todo listo!";
    const label = action.label || stepLabel[action.stepKey] || action.stepKey;
    return label.startsWith("¿") ? label : label.charAt(0).toLowerCase() + label.slice(1);
}

// --- M5 · cierre, seguimiento y sugerencias ---------------------------------------------

/**
 * Qué se logró, para la celebración (mockup «Celebración»: «Te realizaste la resonancia…»).
 * `finalSkipped`: the final step was «Omitir, no me dieron nada», so nothing was saved and the text
 * must not say it was (M7 · scenario 22).
 */
export function celebrationSummary(type: MissionType, managing: boolean, finalSkipped = false): string {
    const you = {
        medical_appointment: finalSkipped
            ? "Asististe a tu cita."
            : "Asististe a tu cita y guardaste lo que te dieron.",
        medical_exam: "Te realizaste el examen y ya tienes los resultados.",
        medication: "Ya tienes tu medicamento.",
        therapy: "Terminaste todas tus sesiones.",
    }[type];
    // Neutral thanks: we do not know the dependent's gender.
    const them = {
        medical_appointment: "Asistió a su cita. Gracias por tu compañía.",
        medical_exam: "Se realizó el examen y ya tiene los resultados. Gracias por tu compañía.",
        medication: "Ya tiene su medicamento. Gracias por tu compañía.",
        therapy: "Terminó todas sus sesiones. Gracias por tu compañía.",
    }[type];
    return managing ? them : you;
}

/**
 * Seguimiento posterior (RF-30–33): la cita pregunta con opción múltiple; los demás tipos, una sola
 * pregunta que deja una cita sugerida.
 */
export function followUpQuestion(type: MissionType, managing = false): { eyebrow: string; question: string } {
    // Management mode (DA-13): the same sheet, in third person.
    const your = managing ? "SU" : "TU";
    const noun = missionTypeShort[type].toUpperCase();
    const question = {
        medical_appointment: managing ? "¿El médico le pidió algo más?" : "¿El médico te pidió algo más?",
        medical_exam: managing ? "¿Necesita una cita médica para revisar sus resultados?" : "¿Necesitas una cita médica para revisar tus resultados?",
        medication: managing ? "¿Necesita una cita médica de control?" : "¿Necesitas una cita médica de control?",
        therapy: managing ? "¿Necesita una cita médica de control?" : "¿Necesitas una cita médica de control?",
    }[type];
    return { eyebrow: `DESPUÉS DE ${your} ${noun}`, question };
}

/** Chips del seguimiento de una cita (mockup «Seguimiento de cita · ¿algo más?»). */
export const followUpNeeds: { type: MissionType; label: string }[] = [
    { type: "medical_exam", label: "Un examen" },
    { type: "medication", label: "Un medicamento" },
    { type: "medical_appointment", label: "Una cita de control" },
    { type: "therapy", label: "Una terapia" },
];

/** Título de una sugerencia: lo que propone, en lenguaje humano. */
export function suggestionTitle(type: MissionType, sourceType: MissionType): string {
    if (type === "medical_appointment" && sourceType === "medical_exam") return "Una cita para revisar tus resultados";
    if (type === "medical_appointment") return "Una cita médica de control";
    return missionTypeLabel[type];
}

/** De dónde viene (mockup: «El médico te lo pidió en tu cita»). */
export function suggestionOrigin(sourceType: MissionType): string {
    switch (sourceType) {
        case "medical_appointment":
            return "El médico te lo pidió en tu cita";
        case "medical_exam":
            return "Te la sugerimos después de tu examen";
        case "medication":
            return "Te la sugerimos después de tu medicamento";
        case "therapy":
            return "Te la sugerimos después de tu terapia";
    }
}

/** «tu cita de Ortopedia», «tu medicamento Losartán»: the origin of a mission, without repeating the noun. */
export function originPhrase(source: { type: MissionType; title: string }): string {
    const noun = missionTypeShort[source.type].toLowerCase();
    const title = source.title.trim();
    if (title.toLowerCase().startsWith(noun)) return `tu ${noun}${title.slice(noun.length)}`;
    return `tu ${noun} ${title}`;
}

/** Encabezado de cada grupo: «DE TU CITA · ORTOPEDIA · 24 NOV». */
export function suggestionGroupLabel(source: { type: MissionType; title: string }, createdAt: string): string {
    const noun = missionTypeShort[source.type].toLowerCase();
    const title = source.title.trim();
    const sameAsNoun = title.toLowerCase().startsWith(noun);
    const parts = [`De tu ${noun}`, sameAsNoun ? title.slice(noun.length).replace(/^\s*de\s+/i, "") : title, shortDate(createdAt)];
    return parts.filter(Boolean).join(" · ").toUpperCase();
}

// --- M6b · misiones desde documentos (RF-68, RF-69, mockups 4c) ---------------------------

/** «tu orden médica» · «tu autorización»: the origin of a document suggestion. */
export function documentOriginPhrase(typeCode: string | null | undefined): string {
    if (typeCode === "medical_order") return "tu orden médica";
    if (typeCode === "eps_authorization") return "tu autorización";
    return "tu documento";
}

/** In the document sheet the therapy starts with the order (DU-48); elsewhere it stays «Terminar una terapia». */
export const documentSheetTypeLabels: Partial<Record<MissionType, string>> = { therapy: "Empezar una terapia" };

/** Copy of the type sheet after saving an order or an authorization (mockups 4c «D2», «D4»). */
export function documentSheetCopy(typeCode: string | null | undefined) {
    const authorization = typeCode === "eps_authorization";
    return {
        eyebrow: authorization ? "AUTORIZACIÓN GUARDADA" : "ORDEN MÉDICA GUARDADA",
        title: "¿Te acompañamos con esto?",
        body: authorization
            ? "Elige para qué es la autorización y la guardamos en el paso «Autorización» de tu misión."
            : "Elige qué quieres conseguir y creamos una misión con tu orden.",
        preselected: authorization ? "Lo elegimos por el tipo de autorización" : "Lo elegimos por el tipo de orden",
    };
}

/** «Examen», «medicamento»… for «¿Es para tu examen en curso?» and «¿Para cuál de tus exámenes es?». */
const MATCH_NOUN: Record<MissionType, { one: string; many: string }> = {
    medical_appointment: { one: "cita", many: "citas" },
    medical_exam: { one: "examen", many: "exámenes" },
    medication: { one: "medicamento", many: "medicamentos" },
    therapy: { one: "terapia", many: "terapias" },
};

/** Titles of the similar-mission sheets (RF-69, mockups «D5», «D5b»). */
export function matchCopy(type: MissionType, count: number) {
    const noun = MATCH_NOUN[type];
    return count > 1
        ? { title: `¿Para cuál de tus ${noun.many} es?`, sub: `Tienes ${count} ${noun.many} esperando autorización.` }
        : { title: `¿Es para tu ${noun.one} en curso?`, sub: null };
}

/** «Paso 1 de 5 · creada hoy» for each similar mission. */
export function matchMeta(stepPosition: number, stepTotal: number, createdAt: string) {
    const day = relativeDay(createdAt);
    const when = day === "hoy" || day === "mañana" ? day : `el ${shortDate(createdAt)}`;
    return `Paso ${stepPosition} de ${stepTotal} · creada ${when}`;
}

/** Group heading of a document suggestion in «Sugeridas»: «DE TU ORDEN MÉDICA · HOY» (mockup «D7»). */
export function documentGroupLabel(typeCode: string | null | undefined, createdAt: string): string {
    const day = relativeDay(createdAt);
    return `De ${documentOriginPhrase(typeCode)} · ${day === "hoy" ? "hoy" : shortDate(createdAt)}`.toUpperCase();
}

/** Title of a document suggestion without type (DU-52): «Crear una misión con tu autorización». */
export function untypedSuggestionTitle(typeCode: string | null | undefined): string {
    return `Crear una misión con ${documentOriginPhrase(typeCode)}`;
}
