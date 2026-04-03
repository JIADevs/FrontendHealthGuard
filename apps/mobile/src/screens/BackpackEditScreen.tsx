import { useCallback, useMemo } from "react";
import {
  ActivityIndicator,
  Alert,
  KeyboardAvoidingView,
  Platform,
  StyleSheet,
  Text,
  View,
} from "react-native";
import { useRoute } from "@react-navigation/native";
import { useBackpackForm } from "../hooks/useBackpackForm";
import { useAppTheme, colors, Button, TextField } from "@healthguard/ui";
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

        <TextField
          label="Nombre"
          value={form.name}
          onChange={form.setName}
          placeholder="Ej: Mochila de Radiología"
          autoCapitalize="words"
          accessibilityLabel="Nombre de la mochila"
        />

        <TextField
          label="Descripción (opcional)"
          value={form.description}
          onChange={form.setDescription}
          placeholder="Ej: Documentos para esta especialidad..."
          multiline
          numberOfLines={4}
          accessibilityLabel="Descripción de la mochila"
        />

        {form.isEdit && (
          <Button variant="danger" fullWidth onPress={confirmDelete} disabled={form.deleting} loading={form.deleting}>
            Eliminar
          </Button>
        )}

        <Button fullWidth onPress={form.handleSave} disabled={form.saving || form.deleting} loading={form.saving}>
          {form.isEdit ? "Guardar" : "Crear"}
        </Button>
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
  });
}
