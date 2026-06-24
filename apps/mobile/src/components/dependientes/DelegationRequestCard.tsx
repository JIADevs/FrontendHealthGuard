import { useMemo } from "react";
import { View, Text, StyleSheet, TouchableOpacity, ActivityIndicator } from "react-native";
import { palette, spacing, fontSize, fontWeight, radii, useAppTheme } from "@helu/ui";
import { useRespondDelegationMutation } from "@helu/api/hooks";
import type { ThemeContextValue } from "@helu/ui";
import type { DependentDelegation, ManagerDelegation } from "@helu/api";
import { DelegationRelationshipCaption } from "./DelegationRelationshipCaption";

interface DelegationRequestCardProps {
    delegation: DependentDelegation | ManagerDelegation;
}

export function DelegationRequestCard({ delegation }: DelegationRequestCardProps) {
    const t = useAppTheme();
    const styles = useMemo(() => makeStyles(t), [t]);
    const respond = useRespondDelegationMutation();

    const isPending = respond.isPending;
    const email = delegation.linkedUserEmail;
    const name = (delegation as { linkedUserName?: string | null }).linkedUserName;

    return (
        <View style={[styles.card, { backgroundColor: t.surface.bgCard }]}>
            <View style={styles.info}>
                <Text style={[styles.name, { color: t.text.primary }]} numberOfLines={1}>
                    {name ?? email}
                </Text>
                {name ? (
                    <Text style={[styles.email, { color: t.text.secondary }]} numberOfLines={1}>
                        {email}
                    </Text>
                ) : null}
                <DelegationRelationshipCaption delegation={delegation} perspective="inbound" />
            </View>
            <View style={styles.actions}>
                <TouchableOpacity
                    style={[styles.btn, styles.rejectBtn, { borderColor: palette.status.error[400] }]}
                    onPress={() => respond.mutate({ id: delegation.id, action: "reject" })}
                    disabled={isPending}
                    accessibilityLabel="Rechazar invitación"
                >
                    <Text style={[styles.btnText, { color: palette.status.error[500] }]}>Rechazar</Text>
                </TouchableOpacity>
                <TouchableOpacity
                    style={[styles.btn, styles.acceptBtn, { backgroundColor: palette.brand[500] }]}
                    onPress={() => respond.mutate({ id: delegation.id, action: "accept" })}
                    disabled={isPending}
                    accessibilityLabel="Aceptar invitación"
                >
                    {isPending ? (
                        <ActivityIndicator size="small" color="#fff" />
                    ) : (
                        <Text style={[styles.btnText, { color: "#fff" }]}>Aceptar</Text>
                    )}
                </TouchableOpacity>
            </View>
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
        actions: {
            flexDirection: "row",
            gap: spacing[2],
            alignSelf: "center",
        },
        btn: {
            paddingVertical: spacing[1],
            paddingHorizontal: spacing[3],
            borderRadius: radii.sm,
            alignItems: "center",
            justifyContent: "center",
            minWidth: 72,
        },
        rejectBtn: {
            borderWidth: 1,
        },
        acceptBtn: {},
        btnText: {
            fontSize: fontSize.sm,
            fontWeight: fontWeight.semibold,
        },
    });
}
