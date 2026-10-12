import { useMemo } from "react";
import { Modal, View, Text, StyleSheet, Pressable, TouchableOpacity } from "react-native";
import { spacing, fontSize, fontWeight, radii, useAppTheme } from "@helu/ui";
import type { ThemeContextValue } from "@helu/ui";
import { DELEGATION_COLOR_OPTIONS } from "./colorTokens";

interface ContextColorPickerProps {
    visible: boolean;
    currentColor: string;
    onClose: () => void;
    onSelectColor: (color: string) => void;
}

export function ContextColorPicker({
    visible,
    currentColor,
    onClose,
    onSelectColor,
}: ContextColorPickerProps) {
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
                    <Text style={[styles.title, { color: t.text.primary }]}>
                        Color de identificación
                    </Text>
                    <View style={styles.palette}>
                        {DELEGATION_COLOR_OPTIONS.map((option) => (
                            <TouchableOpacity
                                key={option.id}
                                style={[
                                    styles.colorTile,
                                    { backgroundColor: option.color },
                                    option.color === currentColor && styles.selected,
                                ]}
                                onPress={() => onSelectColor(option.color)}
                                accessibilityLabel={`Color ${option.id}`}
                                accessibilityRole="button"
                            />
                        ))}
                    </View>
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
            marginBottom: spacing[4],
        },
        palette: {
            flexDirection: "row",
            flexWrap: "wrap",
            gap: spacing[3],
            paddingBottom: spacing[2],
        },
        colorTile: {
            width: 44,
            height: 44,
            borderRadius: radii.sm,
        },
        selected: {
            borderWidth: 3,
            borderColor: "rgba(0,0,0,0.4)",
        },
    });
}
