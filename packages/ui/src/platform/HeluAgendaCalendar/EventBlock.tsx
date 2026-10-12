import { useMemo } from "react";
import { View, Text, StyleSheet, TouchableOpacity } from "react-native";
import { Stethoscope, FlaskConical, Pill, CheckCircle2, XCircle } from "lucide-react-native";
import { spacing, fontSize, fontWeight, radii } from "../../tokens/tokens";
import { useAppTheme } from "../../tokens/ThemeProvider";
import type { ThemeContextValue } from "../../tokens/ThemeProvider";
import { eventLabel, type AgendaEvent } from "./mapCalendarApiToEvents";
import { MOOD_EMOJI } from "./moodEmoji";
import { NOT_TAKEN_REASON_LABELS_ES, formatMedDose } from "./medicationIntakeUtils";

type MedicationStatus = "PENDING" | "TAKEN" | "NOT_TAKEN";

function medicationStatus(event: AgendaEvent): MedicationStatus | null {
    if (event.type !== "medication") return null;
    return event.intake?.status ?? "PENDING";
}

interface EventBlockProps {
    event: AgendaEvent;
    compact?: boolean;
    onPress?: () => void;
}

export function EventBlock({ event, compact = false, onPress }: EventBlockProps) {
    const t = useAppTheme();
    const medStatus = medicationStatus(event);
    const styles = useMemo(
        () => makeStyles(t, event.type, compact, medStatus),
        [t, event.type, compact, medStatus],
    );

    const title = eventLabel(event);
    let subtitle = "";
    if (event.type === "checkin") {
        subtitle = new Date(event.data.recordedAt).toLocaleTimeString("es-CO", {
            hour: "2-digit",
            minute: "2-digit",
        });
    } else if (event.type === "medication") {
        const dose = formatMedDose(event.data.doseAmount, event.data.doseUnit, event.data.dosage);
        const doseLabel = dose ? `${dose} · ${event.intakeTime}` : event.intakeTime;

        if (event.intake?.status === "TAKEN" && event.intake.takenAt) {
            const takenAtMs = new Date(event.intake.takenAt).getTime();
            const scheduledMs = new Date(event.intake.scheduledTime).getTime();
            const isLate = takenAtMs - scheduledMs > 5 * 60_000;
            const takenLabel = new Date(event.intake.takenAt).toLocaleTimeString("es-CO", {
                hour: "2-digit",
                minute: "2-digit",
            });
            subtitle = isLate ? `Tomado tarde · ${takenLabel}` : `Tomado · ${takenLabel}`;
        } else if (event.intake?.status === "NOT_TAKEN") {
            const reasonLabel = event.intake.notTakenReason
                ? NOT_TAKEN_REASON_LABELS_ES[event.intake.notTakenReason]
                : "";
            subtitle = reasonLabel ? `No tomado · ${reasonLabel}` : "No tomado";
        } else {
            subtitle = doseLabel;
        }
    } else {
        subtitle = event.data.time?.slice(0, 5) ?? "";
    }

    return (
        <TouchableOpacity
            style={styles.block}
            onPress={onPress}
            disabled={!onPress}
            activeOpacity={onPress ? 0.7 : 1}
        >
            <View style={styles.row}>
                {!compact && event.type === "appointment" ? (
                    <Stethoscope size={14} color={t.brand.fg} />
                ) : null}
                {!compact && event.type === "exam" ? (
                    <FlaskConical size={14} color={t.text.secondary} />
                ) : null}
                {!compact && event.type === "medication" && medStatus === "TAKEN" ? (
                    <CheckCircle2 size={14} color={t.status.successFg} />
                ) : null}
                {!compact && event.type === "medication" && medStatus === "NOT_TAKEN" ? (
                    <XCircle size={14} color={t.status.errorFg} />
                ) : null}
                {!compact && event.type === "medication" && medStatus === "PENDING" ? (
                    <Pill size={14} color={t.accent.medFg} />
                ) : null}
                {event.type === "checkin" ? (
                    <Text style={styles.emoji}>{MOOD_EMOJI[event.data.mood]}</Text>
                ) : null}
                <Text style={styles.title} numberOfLines={compact ? 2 : 1}>
                    {title}
                </Text>
            </View>
            {!compact && subtitle ? <Text style={styles.subtitle}>{subtitle}</Text> : null}
        </TouchableOpacity>
    );
}

function makeStyles(
    t: ThemeContextValue,
    type: AgendaEvent["type"],
    compact: boolean,
    medStatus: MedicationStatus | null,
) {
    let bg = t.accent.notifBg;
    let border = t.accent.notifFg;

    if (type === "appointment") {
        bg = t.brand.tintMed;
        border = t.brand.fg;
    } else if (type === "exam") {
        bg = t.surface.bgCard;
        border = t.border.medium;
    } else if (type === "medication") {
        if (medStatus === "TAKEN") {
            bg = t.status.successBg;
            border = t.status.successFg;
        } else if (medStatus === "NOT_TAKEN") {
            bg = t.status.errorBg;
            border = t.status.errorFg;
        } else {
            bg = t.accent.medBg;
            border = t.accent.medFg;
        }
    }

    return StyleSheet.create({
        block: {
            backgroundColor: bg,
            borderLeftWidth: 3,
            borderLeftColor: border,
            borderRadius: radii.sm,
            paddingHorizontal: compact ? spacing[1] : spacing[2],
            paddingVertical: compact ? 2 : spacing[1],
            marginBottom: spacing[1],
        },
        row: {
            flexDirection: "row",
            alignItems: "center",
            gap: compact ? 2 : spacing[1],
        },
        emoji: {
            fontSize: compact ? fontSize.xs : fontSize.sm,
        },
        title: {
            flex: 1,
            fontSize: compact ? 10 : fontSize.xs,
            fontWeight: fontWeight.semibold,
            color: t.text.primary,
        },
        subtitle: {
            fontSize: fontSize.xs,
            color: t.text.secondary,
            marginTop: 2,
        },
    });
}
