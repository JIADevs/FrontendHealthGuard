import { useMemo, useState } from "react";
import { useNavigation } from "@react-navigation/native";
import type { NativeStackNavigationProp } from "@react-navigation/native-stack";
import { View, Text, StyleSheet, TouchableOpacity, ActivityIndicator } from "react-native";
import { palette, spacing, fontSize, fontWeight, radii, useAppTheme } from "@helu/ui";
import { useRevokeDelegationMutation } from "@helu/api/hooks";
import { useAuthStore } from "@helu/stores";
import type { ThemeContextValue } from "@helu/ui";
import type { DependentDelegation } from "@helu/api";
import { ContextColorPicker } from "./ContextColorPicker";
import { DelegationRevokeConfirm } from "./DelegationRevokeConfirm";
import { resolveDelegationRingColor } from "./colorTokens";
import type { DelegationContextColors } from "@helu/api";
import type { RootStackParamList } from "../../navigation/RootNavigator";

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
    const navigation = useNavigation<NativeStackNavigationProp<RootStackParamList>>();
    const t = useAppTheme();
    const styles = useMemo(() => makeStyles(t), [t]);
    const revoke = useRevokeDelegationMutation();
    const [colorPickerVisible, setColorPickerVisible] = useState(false);
    const [revokeConfirmVisible, setRevokeConfirmVisible] = useState(false);

    const name = delegation.linkedUserName;
    const email = delegation.linkedUserEmail;
    const patientId = delegation.dependentUserId ?? delegation.id;
    const ringColor = resolveDelegationRingColor(contextColors, patientId, colorIndex);
    const initials = (name ?? email)?.slice(0, 2).toUpperCase() ?? "??";
    const displayName = name ?? email;

    const handleConfirmRevoke = () => {
        revoke.mutate(delegation.id, {
            onSuccess: () => {
                const { isManaging, activePatientId, switchPatientContext } =
                    useAuthStore.getState();
                if (isManaging && activePatientId === patientId) {
                    switchPatientContext(null);
                    navigation.navigate("MainTabs");
                }
            },
            onSettled: () => setRevokeConfirmVisible(false),
        });
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
                accessibilityLabel={`Gestionar cuenta de ${displayName}`}
            >
                <View style={[styles.avatar, { borderColor: ringColor }]}>
                    <Text style={styles.avatarText}>{initials}</Text>
                </View>
                <View style={styles.info}>
                    <Text style={[styles.name, { color: t.text.primary }]} numberOfLines={1}>
                        {displayName}
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
                        onPress={() => setRevokeConfirmVisible(true)}
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

            <DelegationRevokeConfirm
                visible={revokeConfirmVisible}
                title="¿Revocar delegación?"
                message={`¿Quieres revocar el acceso a la cuenta de ${displayName}?`}
                loading={revoke.isPending}
                onConfirm={handleConfirmRevoke}
                onCancel={() => setRevokeConfirmVisible(false)}
            />
        </>
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
