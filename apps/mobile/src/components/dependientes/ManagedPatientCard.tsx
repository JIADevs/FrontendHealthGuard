import { useMemo, useState } from "react";
import { View, Text, StyleSheet, TouchableOpacity, Alert, ActivityIndicator } from "react-native";
import { palette, spacing, fontSize, fontWeight, radii, useAppTheme } from "@helu/ui";
import { useRevokeDelegationMutation } from "@helu/api/hooks";
import type { ThemeContextValue } from "@helu/ui";
import type { DependentDelegation } from "@helu/api";
import { ContextColorPicker } from "./ContextColorPicker";
import type { DelegationContextColors } from "@helu/api";

interface ManagedPatientCardProps {
    delegation: DependentDelegation;
    contextColors: DelegationContextColors;
    colorIndex: number;
    isActive: boolean;
    onSwitchContext: (patientId: string) => void;
    onColorsUpdate: (updated: DelegationContextColors) => void;
}

export function ManagedPatientCard({
    delegation,
    contextColors,
    colorIndex,
    isActive,
    onSwitchContext,
    onColorsUpdate,
}: ManagedPatientCardProps) {
    const t = useAppTheme();
    const styles = useMemo(() => makeStyles(t), [t]);
    const revoke = useRevokeDelegationMutation();
    const [colorPickerVisible, setColorPickerVisible] = useState(false);

    const name = delegation.linkedUserName;
    const email = delegation.linkedUserEmail;
    const patientId = delegation.dependentUserId ?? delegation.id;
    const ringColor = contextColors[patientId] ?? getDefaultColor(colorIndex);
    const initials = (name ?? email)?.slice(0, 2).toUpperCase() ?? "??";

    const handleRevoke = () => {
        Alert.alert(
            "Revocar delegación",
            `¿Querés revocar el acceso a la cuenta de ${name ?? email}?`,
            [
                { text: "Cancelar", style: "cancel" },
                {
                    text: "Revocar",
                    style: "destructive",
                    onPress: () => revoke.mutate(delegation.id),
                },
            ],
        );
    };

    return (
        <>
            <TouchableOpacity
                style={[
                    styles.card,
                    { backgroundColor: t.surface.bgCard },
                    isActive && { borderColor: ringColor, borderWidth: 2 },
                ]}
                onPress={() => onSwitchContext(patientId)}
                activeOpacity={0.7}
                accessibilityLabel={`Gestionar cuenta de ${name ?? email}`}
            >
                <View style={[styles.avatar, { borderColor: ringColor }]}>
                    <Text style={styles.avatarText}>{initials}</Text>
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
                    {isActive && (
                        <Text style={[styles.activeBadge, { color: ringColor }]}>Activo</Text>
                    )}
                </View>
                <View style={styles.actions}>
                    <TouchableOpacity
                        onPress={() => setColorPickerVisible(true)}
                        style={[styles.colorDot, { backgroundColor: ringColor }]}
                        accessibilityLabel="Cambiar color"
                    />
                    <TouchableOpacity
                        onPress={handleRevoke}
                        disabled={revoke.isPending}
                        style={styles.revokeBtn}
                        accessibilityLabel="Revocar delegación"
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
            </TouchableOpacity>

            <ContextColorPicker
                visible={colorPickerVisible}
                currentColor={ringColor}
                onClose={() => setColorPickerVisible(false)}
                onSelectColor={(color) => {
                    const updated = { ...contextColors, [patientId]: color };
                    onColorsUpdate(updated);
                    setColorPickerVisible(false);
                }}
            />
        </>
    );
}

function getDefaultColor(index: number): string {
    const { DELEGATION_COLOR_TOKENS } = require("./colorTokens");
    return DELEGATION_COLOR_TOKENS[index % DELEGATION_COLOR_TOKENS.length];
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
            width: 40,
            height: 40,
            borderRadius: radii.full,
            borderWidth: 2,
            backgroundColor: palette.neutral[100],
            alignItems: "center",
            justifyContent: "center",
            marginRight: spacing[3],
        },
        avatarText: {
            color: palette.neutral[700],
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
        activeBadge: {
            fontSize: fontSize.xs,
            fontWeight: fontWeight.semibold,
            marginTop: 2,
        },
        actions: {
            flexDirection: "row",
            alignItems: "center",
            gap: spacing[2],
        },
        colorDot: {
            width: 20,
            height: 20,
            borderRadius: radii.full,
        },
        revokeBtn: {
            paddingHorizontal: spacing[2],
            paddingVertical: spacing[1],
        },
        revokeBtnText: {
            fontSize: fontSize.sm,
            fontWeight: fontWeight.semibold,
        },
    });
}
