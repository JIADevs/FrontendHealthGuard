import { useMemo } from "react";
import { View, Text, StyleSheet } from "react-native";
import { ChevronRight } from "lucide-react-native";
import { PressableScale, formatClock, nativeFont, spacing, useAppTheme } from "@helu/ui";
import type { ThemeContextValue } from "@helu/ui";
import type { DailyCheckIn } from "@helu/api";
import { MOOD_CONFIG } from "./moodConfig";
import { MoodFace } from "./MoodFace";

interface DailyCheckInListItemProps {
    checkIn: DailyCheckIn;
    onEdit?: (checkIn: DailyCheckIn) => void;
}

/**
 * Check-in row (mockup Bienestar · `checkItem`): a card with the drawn face, the mood and the time.
 * The day is the section title, so the row only shows the time. Tapping the card edits it.
 */
export function DailyCheckInListItem({ checkIn, onEdit }: DailyCheckInListItemProps) {
    const t = useAppTheme();
    const styles = useMemo(() => makeStyles(t), [t]);

    const { label } = MOOD_CONFIG[checkIn.mood];
    const time = formatClock(new Date(checkIn.recordedAt));

    const body = (
        <View style={styles.card}>
            <MoodFace mood={checkIn.mood} size={40} />
            <View style={styles.body}>
                <Text style={styles.moodLabel}>{label}</Text>
                <Text style={styles.meta} numberOfLines={2}>
                    {checkIn.notes ? `${time} · ${checkIn.notes}` : time}
                </Text>
            </View>
            {onEdit ? <ChevronRight size={18} color={t.text.muted} /> : null}
        </View>
    );

    if (!onEdit) {
        return (
            <View style={styles.wrap} accessible accessibilityLabel={`Check-in: ${label}, ${time}`}>
                {body}
            </View>
        );
    }

    return (
        <PressableScale
            style={styles.wrap}
            onPress={() => onEdit(checkIn)}
            accessibilityRole="button"
            accessibilityLabel={`Check-in: ${label}, ${time}`}
            accessibilityHint="Abre el check-in para editarlo"
        >
            {body}
        </PressableScale>
    );
}

function makeStyles(t: ThemeContextValue) {
    return StyleSheet.create({
        wrap: { paddingHorizontal: spacing[4] },
        // MASTER «Tarjeta» compacta: radio 18, padding 12, borde 1 px + canto de 3 px
        card: {
            flexDirection: "row",
            alignItems: "center",
            gap: spacing[3],
            padding: spacing[3],
            minHeight: 64,
            borderRadius: 18,
            borderWidth: 1,
            borderColor: t.border.default,
            backgroundColor: t.surface.bgCard,
            boxShadow: `0 3px 0 ${t.border.default}`,
        },
        body: { flex: 1, gap: 2 },
        moodLabel: { fontSize: 15, fontFamily: nativeFont("heading", 800), color: t.text.primary },
        meta: { fontSize: 13, fontFamily: nativeFont("body", 400), color: t.text.secondary },
    });
}
