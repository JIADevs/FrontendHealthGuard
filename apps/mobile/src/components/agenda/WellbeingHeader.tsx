import { useMemo } from "react";
import { View, Text, StyleSheet } from "react-native";
import { Heart } from "lucide-react-native";
import { spacing, fontSize, fontWeight, radii, useAppTheme } from "@helu/ui";
import type { ThemeContextValue } from "@helu/ui";

interface WellbeingHeaderProps {
    total?: number;
    isLoading?: boolean;
}

export function WellbeingHeader({ total = 0, isLoading }: WellbeingHeaderProps) {
    const t = useAppTheme();
    const styles = useMemo(() => makeStyles(t), [t]);

    const countLabel = isLoading
        ? "Cargando…"
        : total === 0
          ? "Sin registros todavía"
          : total === 1
            ? "1 registro"
            : `${total} registros`;

    return (
        <View style={styles.container}>
            <View style={styles.iconWrap}>
                <Heart size={22} color={t.brand.fg} fill={t.brand.fg} />
            </View>
            <View style={styles.textBlock}>
                <Text style={styles.title}>Tu bienestar</Text>
                <Text style={styles.subtitle}>Cómo te sentiste últimamente</Text>
                <Text style={styles.count}>{countLabel}</Text>
            </View>
        </View>
    );
}

function makeStyles(t: ThemeContextValue) {
    return StyleSheet.create({
        container: {
            flexDirection: "row",
            alignItems: "center",
            gap: spacing[4],
            paddingHorizontal: spacing[4],
            paddingVertical: spacing[4],
            backgroundColor: t.surface.bgCard,
            borderBottomWidth: 1,
            borderBottomColor: t.border.medium,
        },
        iconWrap: {
            width: 48,
            height: 48,
            borderRadius: radii.full,
            backgroundColor: t.brand.tint,
            alignItems: "center",
            justifyContent: "center",
        },
        textBlock: {
            flex: 1,
            gap: spacing[1],
        },
        title: {
            fontSize: fontSize.lg,
            fontWeight: fontWeight.semibold,
            color: t.text.primary,
        },
        subtitle: {
            fontSize: fontSize.sm,
            color: t.text.secondary,
        },
        count: {
            fontSize: fontSize.xs,
            fontWeight: fontWeight.medium,
            color: t.text.secondary,
            marginTop: spacing[1],
        },
    });
}
