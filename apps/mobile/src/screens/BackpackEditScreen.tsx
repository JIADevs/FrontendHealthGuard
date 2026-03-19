import { useCallback, useEffect, useMemo, useState } from "react";
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
import { useRoute, useNavigation } from "@react-navigation/native";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import Toast from "react-native-toast-message";
import { getBackpackById, createBackpack, updateBackpack, deleteBackpack, isApiError, type BackpackCreate, type Backpack } from "@healthguard/api";
import type { NativeStackNavigationProp } from "@react-navigation/native-stack";
import type { RootStackParamList } from "../navigation/RootNavigator";

type RouteParams = { id?: string };

export function BackpackEditScreen() {
  const route = useRoute();
  const navigation = useNavigation<NativeStackNavigationProp<RootStackParamList>>();
  const queryClient = useQueryClient();
  const { id } = (route.params ?? {}) as RouteParams;
  const isEdit = !!id;

  const { data: backpack, isLoading } = useQuery({
    queryKey: ["backpack", id],
    queryFn: () => (id ? getBackpackById(id) : Promise.reject(new Error("Missing backpack id"))),
    enabled: isEdit,
  });

  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (!backpack) return;
    setName(backpack.name);
    setDescription(backpack.description ?? "");
  }, [backpack]);

  const payload: BackpackCreate = useMemo(
    () => ({
      name: name.trim(),
      description: description.trim() ? description.trim() : undefined,
    }),
    [name, description]
  );

  const deleteMut = useMutation({
    mutationFn: async () => {
      if (!id) throw new Error("Missing backpack id");
      return deleteBackpack(id);
    },
  });

  const handleSave = useCallback(async () => {
    if (saving) return;
    const trimmedName = name.trim();
    if (!trimmedName) {
      Alert.alert("Nombre requerido", "El nombre de la mochila no puede estar vacío.");
      return;
    }

    setSaving(true);
    try {
      if (isEdit && id) {
        await updateBackpack(id, payload);
        Toast.show({ type: "success", text1: "Mochila actualizada", text2: trimmedName });
      } else {
        await createBackpack(payload);
        Toast.show({ type: "success", text1: "Mochila creada", text2: trimmedName });
      }

      await queryClient.invalidateQueries({ queryKey: ["backpacks"], exact: false });
      await queryClient.invalidateQueries({ queryKey: ["backpack", id], exact: false });
      navigation.goBack();
    } catch (err) {
      const message = isApiError(err) ? err.message : "No se pudo guardar la mochila.";
      Toast.show({ type: "error", text1: "Error al guardar", text2: message });
      Alert.alert("Error", message);
    } finally {
      setSaving(false);
    }
  }, [saving, name, isEdit, id, payload, queryClient, navigation]);

  const handleDelete = useCallback(() => {
    if (!id) return;
    Alert.alert(
      "Eliminar mochila",
      "Esta acción no se puede deshacer. ¿Querés eliminar esta mochila?",
      [
        { text: "Cancelar", style: "cancel" },
        {
          text: "Eliminar",
          style: "destructive",
          onPress: async () => {
            try {
              await deleteMut.mutateAsync();
              Toast.show({ type: "success", text1: "Mochila eliminada", text2: name.trim() || "—" });
              await queryClient.invalidateQueries({ queryKey: ["backpacks"], exact: false });
              navigation.goBack();
            } catch (err) {
              const message = isApiError(err) ? err.message : "No se pudo eliminar la mochila.";
              Toast.show({ type: "error", text1: "Error al eliminar", text2: message });
              Alert.alert("Error", message);
            }
          },
        },
      ]
    );
  }, [id, deleteMut, queryClient, navigation, name]);

  if (isEdit && isLoading) {
    return (
      <View style={styles.center}>
        <ActivityIndicator size="large" color="#0ea5e9" />
      </View>
    );
  }

  return (
    <KeyboardAvoidingView style={styles.container} behavior={Platform.OS === "ios" ? "padding" : undefined}>
      <View style={styles.content}>
        <Text style={styles.title}>{isEdit ? "Editar mochila" : "Crear mochila"}</Text>

        <Text style={styles.label}>Nombre</Text>
        <TextInput
          style={styles.input}
          value={name}
          onChangeText={setName}
          placeholder="Ej: Mochila de Radiología"
          autoCapitalize="words"
          accessibilityLabel="Nombre de la mochila"
        />

        <Text style={[styles.label, { marginTop: 14 }]}>Descripción (opcional)</Text>
        <TextInput
          style={[styles.input, styles.multiline]}
          value={description}
          onChangeText={setDescription}
          placeholder="Ej: Documentos para esta especialidad..."
          multiline
          numberOfLines={4}
          accessibilityLabel="Descripción de la mochila"
        />

        {isEdit && (
          <TouchableOpacity
            style={[styles.secondaryBtn, styles.dangerBtn]}
            onPress={handleDelete}
            disabled={saving}
            accessibilityRole="button"
            accessibilityLabel="Eliminar mochila"
          >
            <Text style={[styles.secondaryBtnText, { color: "#ef4444" }]}>Eliminar</Text>
          </TouchableOpacity>
        )}

        <TouchableOpacity
          style={[styles.primaryBtn, saving && styles.primaryBtnDisabled]}
          onPress={handleSave}
          disabled={saving}
          accessibilityRole="button"
          accessibilityLabel="Guardar mochila"
        >
          {saving ? <ActivityIndicator color="#fff" /> : <Text style={styles.primaryBtnText}>{isEdit ? "Guardar" : "Crear"}</Text>}
        </TouchableOpacity>

        <TouchableOpacity style={styles.secondaryBtn} onPress={() => navigation.goBack()} accessibilityLabel="Cancelar">
          <Text style={styles.secondaryBtnText}>Cancelar</Text>
        </TouchableOpacity>
      </View>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#f8fafc" },
  center: { flex: 1, alignItems: "center", justifyContent: "center", padding: 24 },
  content: { padding: 20 },
  title: { fontSize: 22, fontWeight: "800", color: "#0f172a", marginBottom: 18 },
  label: { fontSize: 14, fontWeight: "700", color: "#0f172a", marginBottom: 8 },
  input: {
    backgroundColor: "#fff",
    borderRadius: 14,
    paddingHorizontal: 14,
    paddingVertical: 12,
    borderWidth: 1,
    borderColor: "#e2e8f0",
    fontSize: 14,
  },
  multiline: { height: 120, textAlignVertical: "top" },
  primaryBtn: { backgroundColor: "#0ea5e9", borderRadius: 14, paddingVertical: 14, alignItems: "center", marginTop: 18 },
  primaryBtnDisabled: { opacity: 0.7 },
  primaryBtnText: { color: "#fff", fontSize: 15, fontWeight: "800" },
  secondaryBtn: { backgroundColor: "#fff", borderRadius: 14, paddingVertical: 14, alignItems: "center", marginTop: 12, borderWidth: 1, borderColor: "#0ea5e9" },
  secondaryBtnText: { color: "#0ea5e9", fontSize: 15, fontWeight: "800" },
  dangerBtn: { borderColor: "#ef4444", backgroundColor: "#fff" },
});

