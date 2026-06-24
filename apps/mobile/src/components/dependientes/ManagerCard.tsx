import { useMemo } from "react";
import { View, Text, StyleSheet, TouchableOpacity, Alert, ActivityIndicator } from "react-native";
import { palette, spacing, fontSize, fontWeight, radii, useAppTheme } from "@helu/ui";
import { useRevokeDelegationMutation } from "@helu/api/hooks";
import type { ThemeContextValue } from "@helu/ui";
import type { ManagerDelegation } from "@helu/api";

interface ManagerCardProps {
    manager: ManagerDelegation;
}

export function ManagerCard({ manager }: ManagerCardProps) {
    const t = useAppTheme();
    const styles = useMemo(() => makeStyles(t), [t]);
    const revoke = useRevokeDelegationMutation();

    const name = manager.linkedUserName;
    const email = manager.linkedUserEmail;

    const handleRevoke = () => {
        Alert.alert(
            "Revocar acceso",
            `¿Querés revocarle el acceso a ${name ?? email}?`,
            [
                { text: "Cancelar", style: "cancel" },
                {
                    text: "Revocar",
                    style: "destructive",
                    onPress: () => revoke.mutate(manager.id),
                },
            ],
        );
    };

    return (
        <View style={[styles.card, { backgroundColor: t.surface.bgCard }]}>
            <View style={styles.avatar}>
                <Text style={styles.avatarText}>
                    {(name ?? email)?.[0]?.toUpperCase() ?? "?"}
                </Text>
            </View>
            <View style={styles.info}>
                <Text style={[styles.name, { color: t.text.primary }]} numberOfLines={1}>
                    {name ?? email}
                </Text>
                {name ? (
                    <Text style={[styles.email, { color: t.text.secondary }]} numberOfLines={1}>
                        {email}
                    </Text>
                ) : null}
            </View>
            <TouchableOpacity
                style={styles.revokeBtn}
                onPress={handleRevoke}
                disabled={revoke.isPending}
                accessibilityLabel="Revocar acceso del cuidador"
            >
                {revoke.isPending ? (
                    <ActivityIndicator size="small" color={palette.status.error[500]} />
                ) : (
                    <Text style={[styles.revokeBtnText, { color: palette.status.error[500] }]}>
                        Revocar
                    </Text>
                )}
            </TouchableOpacity>
        </View>
    );
}

function makeStyles(t: ThemeContextValue) {
    return StyleSheet.create({
        card: {
            borderRadius: radii.md,
            padding: spacing[3],
            marginBottom: spacing[2],
            flexDirection: "row",
            alignItems: "center",
            borderWidth: 1,
            borderColor: t.border.light,
        },
        avatar: {
            width: 36,
            height: 36,
            borderRadius: radii.full,
            backgroundColor: palette.brand[100],
            alignItems: "center",
            justifyContent: "center",
            marginRight: spacing[3],
        },
        avatarText: {
            color: palette.brand[600],
            fontSize: fontSize.base,
            fontWeight: fontWeight.bold,
        },
        info: {
            flex: 1,
        },
        name: {
            fontSize: fontSize.base,
            fontWeight: fontWeight.medium,
        },
        email: {
            fontSize: fontSize.sm,
            marginTop: 2,
        },
        revokeBtn: {
            paddingHorizontal: spacing[3],
            paddingVertical: spacing[1],
        },
        revokeBtnText: {
            fontSize: fontSize.sm,
            fontWeight: fontWeight.semibold,
        },
    });
}
