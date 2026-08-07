import { useCallback, useLayoutEffect, useMemo, useState } from "react";
import {
  Alert,
  KeyboardAvoidingView,
  Platform,
  RefreshControl,
  ScrollView,
  StyleSheet,
  TouchableOpacity,
  Text,
  View,
} from "react-native";
import { Trash2 } from "lucide-react-native";
import { useRoute, useNavigation } from "@react-navigation/native";
import type { NativeStackNavigationProp } from "@react-navigation/native-stack";
import { useInfiniteBackpackDocuments } from "@helu/api/hooks";
import type { Document } from "@helu/api";
import { useBackpackForm } from "../hooks/useBackpackForm";
import { useBackpackCreateWithDocs } from "../hooks/useBackpackCreateWithDocs";
import { useBackpackDetail } from "../hooks/useBackpackDetail";
import {
  spacing,
  Button,
  TextField,
  Typography,
  Spinner,
  ConfirmModal,
  palette,
  useAppTheme,
} from "@helu/ui";
import type { ThemeContextValue } from "@helu/ui";
import type { RootStackParamList } from "../navigation/RootNavigator";
import { BackpackCreateDocumentPicker, BackpackDetailContentSection } from "../components/backpacks";

type RouteParams = { id?: string };

export function BackpackEditScreen() {
  const { id } = (useRoute().params ?? {}) as RouteParams;
  const navigation = useNavigation<NativeStackNavigationProp<RootStackParamList>>();
  const t = useAppTheme();
  const styles = useMemo(() => makeStyles(t), [t]);
  const isEdit = !!id;

  const form = useBackpackForm({ backpackId: id });
  const create = useBackpackCreateWithDocs();
  const detail = useBackpackDetail(id ?? "");
  const docsQuery = useInfiniteBackpackDocuments(id ?? "");
  const docs = useMemo(
    () => docsQuery.data?.pages.flatMap((p) => p.items) ?? [],
    [docsQuery.data],
  );
  const [deleteConfirmVisible, setDeleteConfirmVisible] = useState(false);

  const openDocument = useCallback(
    (doc: Document) =>
      navigation.navigate("DocumentDetail", { id: doc.id, title: doc.title, backTitle: "Mochila" }),
    [navigation],
  );

  const handleRemoveDocument = useCallback(
    (doc: Document) => {
      Alert.alert(
        "Quitar documento",
        `¿Querés quitar "${doc.title}" de esta mochila? El documento no se elimina de tu biblioteca.`,
        [
          { text: "Cancelar", style: "cancel" },
          {
            text: "Quitar",
            style: "destructive",
            onPress: () => detail.removeDocument(doc.id, doc.title),
          },
        ],
      );
    },
    [detail],
  );

  const handleLoadMoreDocs = useCallback(() => {
    if (docsQuery.hasNextPage && !docsQuery.isFetchingNextPage) {
      void docsQuery.fetchNextPage();
    }
  }, [docsQuery]);

  const handleHeaderCreate = useCallback(() => {
    void create.handleCreate();
  }, [create.handleCreate]);

  useLayoutEffect(() => {
    if (isEdit) {
      navigation.setOptions({ title: "Editar mochila" });
      return;
    }
    navigation.setOptions({
      title: "Nueva mochila",
      headerRight: () => (
        <TouchableOpacity
          onPress={handleHeaderCreate}
          disabled={create.creating}
          style={styles.headerAction}
          accessibilityRole="button"
          accessibilityLabel="Crear mochila"
        >
          {create.creating ? (
            <Spinner size="sm" />
          ) : (
            <Text style={styles.headerActionText}>Crear</Text>
          )}
        </TouchableOpacity>
      ),
    });
  }, [navigation, isEdit, create.creating, handleHeaderCreate, styles]);

  const confirmDelete = useCallback(() => {
    setDeleteConfirmVisible(true);
  }, []);

  const handleConfirmDelete = useCallback(() => {
    form.handleDelete();
  }, [form.handleDelete]);

  if (isEdit) {
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
        <ScrollView contentContainerStyle={styles.editContent} keyboardShouldPersistTaps="handled">
          <TextField
            label="Nombre"
            value={form.name}
            onChange={form.setName}
            placeholder="Ej: Neurología"
            autoCapitalize="words"
            accessibilityLabel="Nombre de la mochila"
          />

          <TextField
            label="Descripción (opcional)"
            value={form.description}
            onChange={form.setDescription}
            placeholder="Ej: Para cita con Dr. Rivera · 24 abr"
            multiline
            numberOfLines={3}
            accessibilityLabel="Descripción de la mochila"
          />

          {docsQuery.isLoading ? (
            <View style={styles.docsLoading}>
              <Spinner size="md" />
            </View>
          ) : (
            <BackpackDetailContentSection
              documents={docs}
              onDocumentPress={openDocument}
              onAddPress={() => navigation.navigate("BackpackAddDocuments", { id: id! })}
              onRemoveDocument={handleRemoveDocument}
              removingDocId={detail.removingDocId}
              hasNextPage={docsQuery.hasNextPage}
              isFetchingNextPage={docsQuery.isFetchingNextPage}
              onLoadMore={handleLoadMoreDocs}
            />
          )}

          <Button variant="danger" fullWidth onPress={confirmDelete} disabled={form.deleting} loading={form.deleting}>
            Eliminar mochila
          </Button>

          <Button fullWidth onPress={form.handleSave} disabled={form.saving || form.deleting} loading={form.saving}>
            Guardar
          </Button>
        </ScrollView>

        {deleteConfirmVisible && (
          <ConfirmModal
            title="¿Eliminar mochila?"
            message="Esta acción no se puede deshacer."
            confirmLabel="Eliminar"
            loading={form.deleting}
            onConfirm={handleConfirmDelete}
            onCancel={() => setDeleteConfirmVisible(false)}
            icon={<Trash2 size={26} color={palette.status.error[500]} strokeWidth={2.25} />}
            iconTone="danger"
          />
        )}
      </KeyboardAvoidingView>
    );
  }

  return (
    <KeyboardAvoidingView
      style={styles.container}
      behavior={Platform.OS === "ios" ? "padding" : undefined}
    >
      <ScrollView
        contentContainerStyle={styles.createContent}
        keyboardShouldPersistTaps="handled"
        refreshControl={
          <RefreshControl
            refreshing={create.documentsRefetching}
            onRefresh={() => void create.refetchDocuments()}
            colors={[t.brand.fg]}
            tintColor={t.brand.fg}
          />
        }
      >
        <TextField
          label="Nombre"
          value={create.name}
          onChange={create.setName}
          placeholder="Ej: Chequeo anual"
          autoCapitalize="words"
          accessibilityLabel="Nombre de la mochila"
        />

        <TextField
          label="Descripción (opcional)"
          value={create.description}
          onChange={create.setDescription}
          placeholder="Ej: Para cita con especialista"
          multiline
          numberOfLines={2}
          accessibilityLabel="Descripción de la mochila"
        />

        <BackpackCreateDocumentPicker
          documents={create.documents}
          selectedIds={create.selectedIds}
          onToggle={create.toggleDocument}
          loading={create.documentsLoading}
          search={create.docSearch}
          onSearchChange={create.setDocSearch}
          hasNextPage={create.hasMoreDocuments}
          isFetchingNextPage={create.isFetchingMoreDocuments}
          onLoadMore={create.loadMoreDocuments}
        />

        <View style={styles.createFooter}>
          <Button
            fullWidth
            onPress={() => void create.handleCreate()}
            disabled={create.creating}
            loading={create.creating}
          >
            Crear mochila
          </Button>
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

function makeStyles(t: ThemeContextValue) {
  return StyleSheet.create({
    container: { flex: 1, backgroundColor: t.surface.bg },
    center: { flex: 1, alignItems: "center", justifyContent: "center", padding: 24 },
    createContent: { padding: spacing[5], gap: spacing[5], paddingBottom: spacing[10] },
    editContent: { padding: spacing[5], gap: spacing[4] },
    createFooter: { marginTop: spacing[2] },
    docsLoading: { paddingVertical: spacing[8], alignItems: "center" },
    headerAction: {
      paddingHorizontal: spacing[3],
      paddingVertical: spacing[2],
      minWidth: 56,
      alignItems: "center",
    },
    headerActionText: {
      color: t.brand.fg,
      fontSize: 16,
      fontWeight: "700",
    },
  });
}
