import { useMemo } from "react";
import { View, Text, StyleSheet, TouchableOpacity } from "react-native";
import { Pencil } from "lucide-react-native";
import { spacing, fontSize, fontWeight, radii, useAppTheme } from "@helu/ui";
import type { ThemeContextValue } from "@helu/ui";
import type { DailyCheckIn } from "@helu/api";
import { MOOD_CONFIG } from "./moodConfig";

interface DailyCheckInListItemProps {
    checkIn: DailyCheckIn;
    onEdit?: (checkIn: DailyCheckIn) => void;
}

export function DailyCheckInListItem({ checkIn, onEdit }: DailyCheckInListItemProps) {
    const t = useAppTheme();
    const styles = useMemo(() => makeStyles(t), [t]);

    const { label, emoji, circleBg } = MOOD_CONFIG[checkIn.mood];
    const timeLabel = new Date(checkIn.recordedAt).toLocaleString("es-AR", {
        hour: "2-digit",
        minute: "2-digit",
    });

    return (
        <View
            style={styles.row}
            accessible
            accessibilityLabel={`Check-in de bienestar: ${label}, ${timeLabel}`}
        >
            <View style={[styles.emojiCircle, { backgroundColor: circleBg }]}>
                <Text style={styles.emoji}>{emoji}</Text>
            </View>

            <View style={styles.body}>
                <Text style={styles.moodLabel}>{label}</Text>
                <Text style={styles.time}>{timeLabel}</Text>
                {checkIn.notes ? (
                    <Text style={styles.notes} numberOfLines={4}>
                        {checkIn.notes}
                    </Text>
                ) : null}
            </View>

            {onEdit ? (
                <TouchableOpacity
                    style={styles.editBtn}
                    onPress={() => onEdit(checkIn)}
                    accessibilityLabel="Editar check-in"
                    hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
                >
                    <Pencil size={16} color={t.text.secondary} />
                </TouchableOpacity>
            ) : null}
        </View>
    );
}

function makeStyles(t: ThemeContextValue) {
    return StyleSheet.create({
        row: {
            flexDirection: "row",
            alignItems: "flex-start",
            gap: spacing[3],
            paddingVertical: spacing[3],
            paddingHorizontal: spacing[4],
        },
        emojiCircle: {
            width: 44,
            height: 44,
            borderRadius: radii.full,
            alignItems: "center",
            justifyContent: "center",
        },
        emoji: {
            fontSize: fontSize.xl,
        },
        body: {
            flex: 1,
            gap: spacing[1],
        },
        moodLabel: {
            fontSize: fontSize.base,
            fontWeight: fontWeight.semibold,
            color: t.text.primary,
        },
        time: {
            fontSize: fontSize.sm,
            color: t.text.secondary,
        },
        notes: {
            fontSize: fontSize.sm,
            color: t.text.secondary,
            marginTop: spacing[1],
            lineHeight: 20,
        },
        editBtn: {
            width: 32,
            height: 32,
            alignItems: "center",
            justifyContent: "center",
            borderRadius: radii.sm,
        },
    });
}
