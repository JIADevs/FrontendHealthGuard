import { useMemo } from "react";
import { View, Text, StyleSheet } from "react-native";
import { fontSize, fontWeight, useAppTheme } from "@helu/ui";
import { useProfileQuery } from "@helu/api/hooks";
import { useAuthStore } from "@helu/stores";
import {
    inferDelegationRelationship,
    getDelegationRelationshipLabels,
} from "@helu/api";
import type { DependentDelegation, ManagerDelegation } from "@helu/api";

interface DelegationRelationshipCaptionProps {
    delegation: DependentDelegation | ManagerDelegation;
    perspective: "inbound" | "outbound";
}

export function DelegationRelationshipCaption({
    delegation,
    perspective,
}: DelegationRelationshipCaptionProps) {
    const t = useAppTheme();
    const styles = useMemo(() => makeStyles(), []);
    const storeUserEmail = useAuthStore((s) => s.user?.email);
    const profile = useProfileQuery();
    const userEmail = profile.data?.email ?? storeUserEmail ?? "";

    const relationship = inferDelegationRelationship(delegation, userEmail);
    if (!relationship) return null;

    const { shortLabel, description } = getDelegationRelationshipLabels(
        relationship,
        perspective,
    );

    if (!description) {
        return (
            <View style={styles.wrap}>
                <Text style={[styles.roleLabel, { color: t.brand.fg }]}>{shortLabel}</Text>
            </View>
        );
    }

    return (
        <View style={styles.wrap}>
            <Text style={[styles.roleLabel, { color: t.brand.fg }]}>{shortLabel}</Text>
            <Text style={[styles.description, { color: t.text.secondary }]}>{description}</Text>
        </View>
    );
}

function makeStyles() {
    return StyleSheet.create({
        wrap: {
            marginTop: 2,
            gap: 2,
        },
        roleLabel: {
            fontSize: fontSize.sm,
            fontWeight: fontWeight.semibold,
            lineHeight: fontSize.sm,
        },
        description: {
            fontSize: fontSize.sm,
            lineHeight: fontSize.sm,
        },
    });
}
