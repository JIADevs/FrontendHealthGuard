import { useMemo } from "react";
import { View, Text, StyleSheet, TouchableOpacity } from "react-native";
import { Stethoscope, FlaskConical } from "lucide-react-native";
import { spacing, fontSize, fontWeight, radii } from "../../tokens/tokens";
import { useAppTheme } from "../../tokens/ThemeProvider";
import type { ThemeContextValue } from "../../tokens/ThemeProvider";
import { eventLabel, type AgendaEvent } from "./mapCalendarApiToEvents";
import { MOOD_EMOJI } from "./moodEmoji";

interface EventBlockProps {
    event: AgendaEvent;
    compact?: boolean;
}

export function EventBlock({ event, compact = false }: EventBlockProps) {
    const t = useAppTheme();
    const styles = useMemo(() => makeStyles(t, event.type, compact), [t, event.type, compact]);

    const title = eventLabel(event);
    const subtitle =
        event.type === "checkin"
            ? new Date(event.data.recordedAt).toLocaleTimeString("es-CO", {
                  hour: "2-digit",
                  minute: "2-digit",
              })
            : event.data.time?.slice(0, 5) ?? "";

    return (
        <View style={styles.block}>
            <View style={styles.row}>
                {!compact && event.type === "appointment" ? (
                    <Stethoscope size={14} color={t.brand.fg} />
                ) : null}
                {!compact && event.type === "exam" ? (
                    <FlaskConical size={14} color={t.text.secondary} />
                ) : null}
                {event.type === "checkin" ? (
                    <Text style={styles.emoji}>{MOOD_EMOJI[event.data.mood]}</Text>
                ) : null}
                <Text style={styles.title} numberOfLines={compact ? 2 : 1}>
                    {title}
                </Text>
            </View>
            {!compact && subtitle ? <Text style={styles.subtitle}>{subtitle}</Text> : null}
        </View>
    );
}

function makeStyles(t: ThemeContextValue, type: AgendaEvent["type"], compact: boolean) {
    const bg =
        type === "appointment"
            ? t.brand.tintMed
            : type === "exam"
              ? t.surface.bgCard
              : t.accent.notifBg;

    const border =
        type === "appointment"
            ? t.brand.fg
            : type === "exam"
              ? t.border.medium
              : t.accent.notifFg;

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
