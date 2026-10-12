import { useMemo } from "react";
import { TouchableOpacity, StyleSheet } from "react-native";
import { Plus } from "lucide-react-native";
import { colors, radii, spacing } from "../../tokens/tokens";
import { useAppTheme } from "../../tokens/ThemeProvider";
import type { ThemeContextValue } from "../../tokens/ThemeProvider";

interface AgendaCalendarFABProps {
    onPress: () => void;
    accessibilityLabel?: string;
}

export function AgendaCalendarFAB({
    onPress,
    accessibilityLabel = "Nueva cita",
}: AgendaCalendarFABProps) {
    const t = useAppTheme();
    const styles = useMemo(() => makeStyles(t), [t]);

    return (
        <TouchableOpacity
            style={styles.fab}
            onPress={onPress}
            activeOpacity={0.85}
            accessibilityRole="button"
            accessibilityLabel={accessibilityLabel}
        >
            <Plus color={colors.white} size={28} />
        </TouchableOpacity>
    );
}

function makeStyles(t: ThemeContextValue) {
    return StyleSheet.create({
        fab: {
            position: "absolute",
            right: spacing[5],
            bottom: spacing[6],
            width: 56,
            height: 56,
            borderRadius: radii.full,
            backgroundColor: t.brand.solid,
            alignItems: "center",
            justifyContent: "center",
            elevation: 8,
            shadowColor: colors.black,
            shadowOffset: { width: 0, height: 4 },
            shadowOpacity: 0.15,
            shadowRadius: 8,
            zIndex: 90,
        },
    });
}
