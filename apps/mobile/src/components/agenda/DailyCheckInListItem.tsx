import { useMemo } from "react";
import { View, Text, StyleSheet } from "react-native";
import { spacing, fontSize, useAppTheme } from "@helu/ui";
import { Card } from "@helu/ui";
import type { ThemeContextValue } from "@helu/ui";
import type { DailyCheckIn } from "@helu/api";
import { MOOD_CONFIG } from "./moodConfig";

interface DailyCheckInListItemProps {
    checkIn: DailyCheckIn;
    onEdit?: (checkIn: DailyCheckIn) => void;
}

export function DailyCheckInListItem({ checkIn }: DailyCheckInListItemProps) {
    const t = useAppTheme();
    const styles = useMemo(() => makeStyles(t), [t]);

    const { label, emoji } = MOOD_CONFIG[checkIn.mood];
    const localDate = new Date(checkIn.recordedAt).toLocaleString("es-CO", {
        year: "numeric",
        month: "short",
        day: "2-digit",
        hour: "2-digit",
        minute: "2-digit",
    });

    return (
        <View
            accessible
            accessibilityLabel={`Check-in de bienestar: ${label}, ${localDate}`}
        >
            <Card title={`${emoji} ${label}`} subtitle={localDate}>
                {checkIn.notes ? (
                    <Text style={styles.notes}>{checkIn.notes}</Text>
                ) : null}
            </Card>
        </View>
    );
}

function makeStyles(t: ThemeContextValue) {
    return StyleSheet.create({
        notes: {
            fontSize: fontSize.sm,
            color: t.text.secondary,
            marginTop: spacing[1],
        },
    });
}
