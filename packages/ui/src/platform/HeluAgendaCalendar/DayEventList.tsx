import { View, Text, StyleSheet } from "react-native";
import { FadeThrough, PressableScale } from "../../motion/motion.native";
import { Check } from "lucide-react-native";
import { Button } from "../../primitives/Button/Button.native";
import { Chip } from "../../primitives/Chip/Chip.native";
import { spacing, fontSize, nativeFont } from "../../tokens/tokens";
import { semanticDark, semanticLight } from "../../tokens/semantic";
import { useAppTheme } from "../../tokens/ThemeProvider";
import type { ThemeContextValue } from "../../tokens/ThemeProvider";
import { NOT_TAKEN_REASON_LABELS_ES } from "./medicationIntakeUtils";
import { eventDetailLine, eventLabel, eventTimeLabel, type AgendaEvent } from "./mapCalendarApiToEvents";

interface DayEventListProps {
    events: AgendaEvent[];
    onEventPress?: (event: AgendaEvent) => void;
    onMedicationTake?: (event: Extract<AgendaEvent, { type: "medication" }>) => void;
    onTaskComplete?: (event: Extract<AgendaEvent, { type: "task" }>) => void;
    takingCycleId?: string;
}

/**
 * Lista del día (mockup «Calendario», helper `ev`): cada evento es una tarjeta compacta con un
 * borde izquierdo de 6 px del color del módulo, título Inter 600 14, metadato «hora · tipo · detalle»
 * y a la derecha el estado o una acción `sm`. Solo la toma más urgente va en éxito (inicio-agenda.md).
 */
export function DayEventList({
    events,
    onEventPress,
    onMedicationTake,
    onTaskComplete,
    takingCycleId,
}: DayEventListProps) {
    const t = useAppTheme();
    if (events.length === 0) return null;

    const urgentIndex = mostUrgentTakeIndex(events);

    const renderTrailing = (kind: TrailingKind, event: AgendaEvent) => {
        if (kind === "taken" || kind === "done") {
            return (
                <Chip
                    label={kind === "taken" ? "Tomado" : "Hecha"}
                    tone="success"
                    icon={<Check size={12} strokeWidth={3} color={t.status.successFg} />}
                />
            );
        }
        if (kind === "missed" && event.type === "medication") {
            const reason = event.intake?.notTakenReason;
            return <Chip label={reason ? NOT_TAKEN_REASON_LABELS_ES[reason] : "No tomado"} tone="danger" />;
        }
        if ((kind === "take-urgent" || kind === "take") && event.type === "medication" && onMedicationTake) {
            const taking = takingCycleId === event.cycleId;
            const urgent = kind === "take-urgent";
            return (
                <Button
                    size="sm"
                    variant={urgent ? "success" : "secondary"}
                    icon={urgent ? <Check size={14} strokeWidth={3} color={t.text.onSolid} /> : undefined}
                    onPress={() => onMedicationTake(event)}
                    disabled={taking}
                    loading={taking}
                    loadingLabel="Guardando…"
                >
                    Tomar
                </Button>
            );
        }
        if (kind === "complete" && event.type === "task" && onTaskComplete) {
            return (
                <Button size="sm" variant="secondary" onPress={() => onTaskComplete(event)}>
                    Completar
                </Button>
            );
        }
        return null;
    };

    return (
        <View style={styles.list}>
            {events.map((event, index) => {
                return (
                    <PressableScale
                        key={`${event.type}-${index}`}
                        onPress={() => onEventPress?.(event)}
                        accessibilityRole="button"
                        accessibilityLabel={`${eventLabel(event)}, ${eventTimeLabel(event)}, ${eventDetailLine(event)}`}
                        style={[
                            styles.card,
                            { backgroundColor: t.surface.bgCard, borderColor: t.border.default, borderLeftColor: accentFor(t, event) },
                        ]}
                    >
                        <View style={styles.copy}>
                            <Text style={[styles.title, { color: t.text.primary }]} numberOfLines={2}>
                                {eventLabel(event)}
                            </Text>
                            <Text style={[styles.detail, { color: t.text.secondary }]} numberOfLines={2}>
                                {eventTimeLabel(event)} · {eventDetailLine(event)}
                            </Text>
                        </View>

                        {/* El estado de la fila cambia con fade through (§2): «Tomar» → «✓ Tomado». */}
                        <FadeThrough value={trailingKind(event, index === urgentIndex)}>
                            {(kind) => renderTrailing(kind, event)}
                        </FadeThrough>
                    </PressableScale>
                );
            })}
        </View>
    );
}

/** Color del borde izquierdo por tipo (mockup: tomas en ámbar, check-in esmeralda, tareas azul, citas rosa). */
function accentFor(t: ThemeContextValue, event: AgendaEvent): string {
    const s = t.mode === "dark" ? semanticDark : semanticLight;
    if (event.type === "medication") return s["motivation-level"];
    if (event.type === "checkin") return s["feature-wellbeing-solid"];
    if (event.type === "task") return t.brand.solid;
    return s["feature-appointment-solid"];
}

type TrailingKind = "taken" | "missed" | "take-urgent" | "take" | "complete" | "done" | "none";

function trailingKind(event: AgendaEvent, urgent: boolean): TrailingKind {
    if (event.type === "medication") {
        if (event.intake?.status === "TAKEN") return "taken";
        if (event.intake?.status === "NOT_TAKEN") return "missed";
        return actionFor(event) === "take" ? (urgent ? "take-urgent" : "take") : "none";
    }
    if (event.type === "task") return event.data.status === "completed" ? "done" : "complete";
    return "none";
}

function slotMs(event: Extract<AgendaEvent, { type: "medication" }>): number {
    const ms = new Date(`${event.dayKey}T${event.intakeTime}`).getTime();
    return Number.isFinite(ms) ? ms : Number.POSITIVE_INFINITY;
}

function mostUrgentTakeIndex(events: AgendaEvent[]): number {
    let best = -1;
    let bestMs = Number.POSITIVE_INFINITY;
    events.forEach((event, index) => {
        if (event.type !== "medication" || actionFor(event) !== "take") return;
        const ms = slotMs(event);
        if (best === -1 || ms < bestMs) {
            best = index;
            bestMs = ms;
        }
    });
    return best;
}

function actionFor(event: AgendaEvent): "take" | "complete" | null {
    if (event.type === "medication") {
        if (event.intake?.status === "TAKEN" || event.intake?.status === "NOT_TAKEN") return null;
        const slot = new Date(`${event.dayKey}T${event.intakeTime}`);
        if (Number.isFinite(slot.getTime()) && slot.getTime() > Date.now()) return null;
        return "take";
    }
    if (event.type === "task" && event.data.status !== "completed") return "complete";
    return null;
}

const styles = StyleSheet.create({
    list: {
        gap: spacing[3],
        paddingHorizontal: spacing[4],
        paddingBottom: spacing[3],
    },
    // Kit `.card.tight` + `border-left: 6px`
    card: {
        flexDirection: "row",
        alignItems: "center",
        gap: spacing[3],
        padding: 14,
        borderRadius: 18,
        borderWidth: 1,
        borderBottomWidth: 4,
        borderLeftWidth: 6,
    },
    copy: {
        flex: 1,
        gap: 2,
    },
    title: {
        fontSize: 14,
        lineHeight: 18,
        fontFamily: nativeFont("body", 600),
    },
    detail: {
        fontSize: fontSize.sm,
        lineHeight: 18,
        fontFamily: nativeFont("body", 400),
    },
});
