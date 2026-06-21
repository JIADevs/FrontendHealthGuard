import { useMemo } from "react";
import { View, Text, StyleSheet } from "react-native";
import { spacing, fontSize, useAppTheme, Card, ActionButton } from "@helu/ui";
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
            <Card
                title={`${emoji} ${label}`}
                subtitle={localDate}
                actions={
                    <View style={styles.cardActions}>
                        <ActionButton
                            action="edit"
                            size="sm"
                            disabled={!onEdit}
                            onPress={() => onEdit?.(checkIn)}
                        />
                    </View>
                }
            >
                {checkIn.notes ? (
                    <Text style={styles.notes}>{checkIn.notes}</Text>
                ) : null}
            </Card>
        </View>
    );
}

function makeStyles(_t: ThemeContextValue) {
    return StyleSheet.create({
        cardActions: {
            gap: spacing[2],
        },
        notes: {
            fontSize: fontSize.sm,
            color: _t.text.secondary,
            marginTop: spacing[1],
        },
    });
}
