import { useMemo } from "react";
import { Modal, View, Text, StyleSheet, Pressable, TouchableOpacity } from "react-native";
import { UserPlus, ShieldCheck } from "lucide-react-native";
import { spacing, fontSize, fontWeight, radii, useAppTheme } from "@helu/ui";
import type { ThemeContextValue } from "@helu/ui";
import type { DelegationRelationship } from "@helu/api";

interface DelegationInviteModeSheetProps {
    visible: boolean;
    onClose: () => void;
    onSelect: (relationship: DelegationRelationship) => void;
}

const MODES: { relationship: DelegationRelationship; label: string; sublabel: string; Icon: typeof UserPlus }[] = [
    {
        relationship: "I_WANT_TO_MANAGE_THEM",
        label: "Invitar dependiente",
        sublabel: "Vas a gestionar su cuenta de salud",
        Icon: UserPlus,
    },
    {
        relationship: "THEY_WILL_MANAGE_ME",
        label: "Invitar cuidador",
        sublabel: "Esa persona va a gestionar tu cuenta",
        Icon: ShieldCheck,
    },
];

export function DelegationInviteModeSheet({
    visible,
    onClose,
    onSelect,
}: DelegationInviteModeSheetProps) {
    const t = useAppTheme();
    const styles = useMemo(() => makeStyles(t), [t]);

    if (!visible) return null;

    return (
        <Modal
            transparent
            visible
            animationType="slide"
            statusBarTranslucent
            onRequestClose={onClose}
        >
            <Pressable style={styles.backdrop} onPress={onClose}>
                <Pressable style={styles.sheet} onPress={(e) => e.stopPropagation()}>
                    <View style={styles.handle} />
                    <Text style={[styles.title, { color: t.text.primary }]}>¿Qué tipo de invitación?</Text>
                    {MODES.map(({ relationship, label, sublabel, Icon }) => (
                        <TouchableOpacity
                            key={relationship}
                            style={[styles.row, { borderBottomColor: t.border.light }]}
                            onPress={() => {
                                onSelect(relationship);
                                onClose();
                            }}
                            accessibilityLabel={label}
                            accessibilityRole="button"
                        >
                            <View style={[styles.iconWrap, { backgroundColor: t.surface.bg }]}>
                                <Icon size={22} color={t.brand.fg} />
                            </View>
                            <View style={styles.rowInfo}>
                                <Text style={[styles.rowLabel, { color: t.text.primary }]}>{label}</Text>
                                <Text style={[styles.rowSublabel, { color: t.text.secondary }]}>{sublabel}</Text>
                            </View>
                        </TouchableOpacity>
                    ))}
                </Pressable>
            </Pressable>
        </Modal>
    );
}

function makeStyles(t: ThemeContextValue) {
    return StyleSheet.create({
        backdrop: {
            flex: 1,
            backgroundColor: "rgba(0,0,0,0.4)",
            justifyContent: "flex-end",
        },
        sheet: {
            backgroundColor: t.surface.bgCard,
            borderTopLeftRadius: radii.xl,
            borderTopRightRadius: radii.xl,
            paddingBottom: spacing[8],
            paddingHorizontal: spacing[4],
        },
        handle: {
            alignSelf: "center",
            width: 40,
            height: 4,
            borderRadius: radii.full,
            backgroundColor: t.border.medium,
            marginVertical: spacing[3],
        },
        title: {
            fontSize: fontSize.lg,
            fontWeight: fontWeight.semibold,
            marginBottom: spacing[3],
        },
        row: {
            flexDirection: "row",
            alignItems: "center",
            paddingVertical: spacing[4],
            borderBottomWidth: 1,
        },
        iconWrap: {
            width: 44,
            height: 44,
            borderRadius: radii.md,
            alignItems: "center",
            justifyContent: "center",
            marginRight: spacing[3],
        },
        rowInfo: {
            flex: 1,
        },
        rowLabel: {
            fontSize: fontSize.base,
            fontWeight: fontWeight.semibold,
        },
        rowSublabel: {
            fontSize: fontSize.sm,
            marginTop: 2,
        },
    });
}
