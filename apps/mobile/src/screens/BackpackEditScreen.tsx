import { useCallback, useMemo } from "react";
import {
  Alert,
  KeyboardAvoidingView,
  Platform,
  StyleSheet,
  View,
} from "react-native";
import { useRoute } from "@react-navigation/native";
import { useBackpackForm } from "../hooks/useBackpackForm";
import { useAppTheme, colors, spacing, Button, TextField, Typography, Spinner } from "@helu/ui";
import type { ThemeContextValue } from "@helu/ui";

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
        <Spinner size="lg" />
      </View>
    );
  }

  return (
    <KeyboardAvoidingView
      style={styles.container}
      behavior={Platform.OS === "ios" ? "padding" : undefined}
    >
      <View style={styles.content}>
        <View style={{ marginBottom: spacing[5] }}>
          <Typography variant="h3">{form.isEdit ? "Editar mochila" : "Crear mochila"}</Typography>
        </View>

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
    container: { flex: 1, backgroundColor: t.surface.bg },
    center:    { flex: 1, alignItems: "center", justifyContent: "center", padding: 24 },
    content:   { padding: 20, gap: spacing[4] },
  });
}
