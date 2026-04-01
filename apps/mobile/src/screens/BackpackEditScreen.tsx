import { useCallback, useMemo } from "react";
import {
  ActivityIndicator,
  Alert,
  KeyboardAvoidingView,
  Platform,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";
import { useRoute } from "@react-navigation/native";
import { useBackpackForm } from "../hooks/useBackpackForm";
import { useAppTheme, colors } from "@healthguard/ui";
import type { ThemeContextValue } from "@healthguard/ui";

type RouteParams = { id?: string };

export function BackpackEditScreen() {
  const { id } = (useRoute().params ?? {}) as RouteParams;
  const t = useAppTheme();
  const styles = useMemo(() => makeStyles(t), [t]);

  const form = useBackpackForm({ backpackId: id });

  const confirmDelete = useCallback(() => {
    Alert.alert(
      "Eliminar mochila",
      "Esta acción no se puede deshacer. ¿Querés eliminar esta mochila?",
      [
        { text: "Cancelar", style: "cancel" },
        { text: "Eliminar", style: "destructive", onPress: form.handleDelete },
      ],
    );
  }, [form.handleDelete]);

  if (form.loading) {
    return (
      <View style={styles.center}>
        <ActivityIndicator size="large" color={colors.sky[500]} />
      </View>
    );
  }

  return (
    <KeyboardAvoidingView
      style={styles.container}
      behavior={Platform.OS === "ios" ? "padding" : undefined}
    >
      <View style={styles.content}>
        <Text style={styles.title}>{form.isEdit ? "Editar mochila" : "Crear mochila"}</Text>

        <Text style={styles.label}>Nombre</Text>
        <TextInput
          style={styles.input}
          value={form.name}
          onChangeText={form.setName}
          placeholder="Ej: Mochila de Radiología"
          autoCapitalize="words"
          accessibilityLabel="Nombre de la mochila"
          placeholderTextColor={t.text.muted}
        />

        <Text style={[styles.label, { marginTop: 14 }]}>Descripción (opcional)</Text>
        <TextInput
          style={[styles.input, styles.multiline]}
          value={form.description}
          onChangeText={form.setDescription}
          placeholder="Ej: Documentos para esta especialidad..."
          multiline
          numberOfLines={4}
          accessibilityLabel="Descripción de la mochila"
          placeholderTextColor={t.text.muted}
        />

        {form.isEdit && (
          <TouchableOpacity
            style={[styles.secondaryBtn, styles.dangerBtn]}
            onPress={confirmDelete}
            disabled={form.deleting}
            accessibilityRole="button"
            accessibilityLabel="Eliminar mochila"
          >
            {form.deleting
              ? <ActivityIndicator color={colors.error[500]} />
              : <Text style={[styles.secondaryBtnText, { color: colors.error[500] }]}>Eliminar</Text>}
          </TouchableOpacity>
        )}

        <TouchableOpacity
          style={[styles.primaryBtn, (form.saving || form.deleting) && styles.primaryBtnDisabled]}
          onPress={form.handleSave}
          disabled={form.saving || form.deleting}
          accessibilityRole="button"
          accessibilityLabel="Guardar mochila"
        >
          {form.saving
            ? <ActivityIndicator color={colors.white} />
            : <Text style={styles.primaryBtnText}>{form.isEdit ? "Guardar" : "Crear"}</Text>}
        </TouchableOpacity>
      </View>
    </KeyboardAvoidingView>
  );
}

function makeStyles(t: ThemeContextValue) {
  return StyleSheet.create({
    container:          { flex: 1, backgroundColor: t.surface.bg },
    center:             { flex: 1, alignItems: "center", justifyContent: "center", padding: 24 },
    content:            { padding: 20 },
    title:              { fontSize: 22, fontWeight: "800", color: t.text.primary, marginBottom: 18 },
    label:              { fontSize: 14, fontWeight: "700", color: t.text.primary, marginBottom: 8 },
    input:              { backgroundColor: t.surface.bgCard, borderRadius: 14, paddingHorizontal: 14, paddingVertical: 12, borderWidth: 1, borderColor: t.border.medium, fontSize: 14, color: t.text.primary },
    multiline:          { height: 120, textAlignVertical: "top" },
    primaryBtn:         { backgroundColor: colors.sky[500], borderRadius: 14, paddingVertical: 14, alignItems: "center", marginTop: 18 },
    primaryBtnDisabled: { opacity: 0.7 },
    primaryBtnText:     { color: colors.white, fontSize: 15, fontWeight: "800" },
    secondaryBtn:       { backgroundColor: t.surface.bgCard, borderRadius: 14, paddingVertical: 14, alignItems: "center", marginTop: 12, borderWidth: 1, borderColor: colors.sky[500] },
    secondaryBtnText:   { color: colors.sky[500], fontSize: 15, fontWeight: "800" },
    dangerBtn:          { borderColor: colors.error[500] },
  });
}
