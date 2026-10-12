import { useMemo, useState } from "react";
import { View, Text, StyleSheet, TouchableOpacity, ActivityIndicator } from "react-native";
import { palette, spacing, fontSize, fontWeight, radii, useAppTheme } from "@helu/ui";
import { useRevokeDelegationMutation } from "@helu/api/hooks";
import type { ThemeContextValue } from "@helu/ui";
import type { DependentDelegation, ManagerDelegation } from "@helu/api";
import { DelegationRevokeConfirm } from "./DelegationRevokeConfirm";
import { DelegationRelationshipCaption } from "./DelegationRelationshipCaption";

interface DelegationPendingOutboundCardProps {
    delegation: DependentDelegation | ManagerDelegation;
}

export function DelegationPendingOutboundCard({ delegation }: DelegationPendingOutboundCardProps) {
    const t = useAppTheme();
    const styles = useMemo(() => makeStyles(t), [t]);
    const revoke = useRevokeDelegationMutation();
    const [cancelConfirmVisible, setCancelConfirmVisible] = useState(false);

    const name = (delegation as { linkedUserName?: string | null }).linkedUserName;
    const email = delegation.linkedUserEmail;
    const displayName = name ?? email;

    const handleConfirmCancel = () => {
        revoke.mutate(delegation.id, {
            onSettled: () => setCancelConfirmVisible(false),
        });
    };

    return (
        <>
            <View style={[styles.card, { backgroundColor: t.surface.bgCard }]}>
                <View style={styles.info}>
                    <Text style={[styles.name, { color: t.text.primary }]} numberOfLines={1}>
                        {displayName}
                    </Text>
                    {name ? (
                        <Text style={[styles.email, { color: t.text.secondary }]} numberOfLines={1}>
                            {email}
                        </Text>
                    ) : null}
                    <DelegationRelationshipCaption delegation={delegation} perspective="outbound" />
                    <Text style={[styles.status, { color: t.text.muted }]}>Esperando respuesta</Text>
                </View>
                <TouchableOpacity
                    style={styles.revokeBtn}
                    onPress={() => setCancelConfirmVisible(true)}
                    disabled={revoke.isPending}
                    accessibilityLabel="Cancelar invitación"
                >
                    {revoke.isPending ? (
                        <ActivityIndicator size="small" color={palette.status.error[500]} />
                    ) : (
                        <Text style={[styles.revokeBtnText, { color: palette.status.error[500] }]}>
                            Cancelar
                        </Text>
                    )}
                </TouchableOpacity>
            </View>

            <DelegationRevokeConfirm
                visible={cancelConfirmVisible}
                title="¿Cancelar invitación?"
                message={`Se cancelará la invitación enviada a ${displayName}.`}
                confirmLabel="Cancelar invitación"
                actionsLayout="stacked"
                loading={revoke.isPending}
                onConfirm={handleConfirmCancel}
                onCancel={() => setCancelConfirmVisible(false)}
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
        info: {
            flex: 1,
            marginRight: spacing[2],
        },
        name: {
            fontSize: fontSize.base,
            fontWeight: fontWeight.medium,
        },
        email: {
            fontSize: fontSize.sm,
            marginTop: 2,
        },
        status: {
            fontSize: fontSize.sm,
            lineHeight: fontSize.sm,
            marginTop: 2,
        },
        revokeBtn: {
            paddingHorizontal: spacing[3],
            paddingVertical: spacing[1],
            alignSelf: "center",
        },
        revokeBtnText: {
            fontSize: fontSize.sm,
            fontWeight: fontWeight.semibold,
        },
    });
}
