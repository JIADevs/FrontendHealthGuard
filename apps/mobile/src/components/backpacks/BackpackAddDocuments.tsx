import { useCallback, useMemo, useState } from "react";
import { FlatList, ScrollView, StyleSheet, Text, View } from "react-native";
import Animated, { FadeIn, FadeOut, LinearTransition } from "react-native-reanimated";
import { SafeAreaView, useSafeAreaInsets } from "react-native-safe-area-context";
import { useFocusEffect } from "@react-navigation/native";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { backpackQueryKeys, invalidateBackpackQueries, useBackpackQuery } from "@helu/api/hooks";
import { addDocToBackpack, getBackpackDocuments, isApiError, type Document, type DocumentPage } from "@helu/api";
import {
  BOTTOM_ACTION_BAR_HEIGHT,
  BottomActionBar,
  Button,
  Chip,
  SearchField,
  Skeleton,
  SkeletonGroup,
  motion,
  nativeFont,
  spacing,
  useAppTheme,
  useSkeletonVisible,
  type ThemeContextValue,
} from "@helu/ui";
import { ScreenHeader } from "../ScreenHeader";
import { SelectableDocumentRow } from "../documents/SelectableDocumentRow";
import { CATEGORY_FILTER_OPTIONS } from "../documents/documentCategories";
import { notify } from "../../lib/notify";
import { useRecentlySaved } from "../../lib/recentlySaved";
import { usePickableDocuments } from "../../hooks/usePickableDocuments";
import { PickerNoDocuments } from "./BackpacksEmpty";
import { documentCountLabel, withDocuments } from "./backpackCopy";

export interface BackpackAddDocumentsProps {
  id: string;
  onClose: () => void;
  /** «Subir documento» / «Escanear» from the empty state; the picker comes back with it selected. */
  onUpload: () => void;
  onScan: () => void;
}

/** Every document already in the backpack, to show «Ya en la mochila» (all pages). */
function useBackpackDocIds(id: string) {
  return useQuery({
    queryKey: backpackQueryKeys.backpackDocIds(id),
    queryFn: async () => {
      const ids = new Set<string>();
      let page = 1;
      let totalPages = 1;
      do {
        const res: DocumentPage = await getBackpackDocuments({ backpackId: id, page, limit: 100 });
        res.items.forEach((doc) => ids.add(doc.id));
        totalPages = res.totalPages;
        page += 1;
      } while (page <= totalPages);
      return ids;
    },
    enabled: !!id,
    staleTime: 5_000,
  });
}

/**
 * Mockup «Agregar documentos» (m5) and m9 «Agregar documentos · sin documentos»: the backpack's name
 * under the title, search, the same category chips as Documentos, multi-select with the square on the
 * right («Ya en la mochila» for those already in it) and the fixed «Agregar N documentos» bar.
 */
export function BackpackAddDocuments({ id, onClose, onUpload, onScan }: BackpackAddDocumentsProps) {
  const t = useAppTheme();
  const styles = useMemo(() => makeStyles(t), [t]);
  const insets = useSafeAreaInsets();
  const qc = useQueryClient();
  const backpack = useBackpackQuery(id).data;
  const existing = useBackpackDocIds(id);
  const docs = usePickableDocuments();
  const [selected, setSelected] = useState<string[]>([]);
  const [adding, setAdding] = useState(false);
  const showSkeleton = useSkeletonVisible(docs.isLoading || existing.isLoading);

  // Back from «Subir documento»: the new document comes selected (#46, decision 2).
  useFocusEffect(
    useCallback(() => {
      const uploaded = useRecentlySaved.getState().takeUploaded();
      if (uploaded) setSelected((ids) => (ids.includes(uploaded) ? ids : [...ids, uploaded]));
    }, []),
  );

  const existingIds = existing.data;
  const toggle = (docId: string) =>
    setSelected((ids) => (ids.includes(docId) ? ids.filter((x) => x !== docId) : [...ids, docId]));

  const add = async () => {
    if (selected.length === 0) return;
    setAdding(true);
    let failed = 0;
    for (const documentId of selected) {
      try {
        await addDocToBackpack(id, documentId);
      } catch (err) {
        // Already there (409) counts as added.
        if (!(isApiError(err) && err.isConflict)) failed += 1;
      }
    }
    // Close only once the backpack has the new rows, so the detail never shows the old content.
    await Promise.all([
      qc.refetchQueries({ queryKey: ["backpack-docs-infinite", id] }),
      qc.refetchQueries({ queryKey: ["backpack", id] }),
    ]).catch(() => undefined);
    invalidateBackpackQueries(qc, id);
    setAdding(false);
    if (failed === selected.length) {
      notify({
        tone: "error",
        message: "No se pudieron agregar",
        description: "Revisa tu conexión e intenta de nuevo.",
        action: { label: "Reintentar", onPress: () => void add() },
      });
      return;
    }
    const added = selected.length - failed;
    notify({
      tone: failed > 0 ? "warning" : "success",
      message: added === 1 ? "Documento agregado" : `${documentCountLabel(added)} agregados`,
      description: failed > 0 ? `${failed} no se pudieron agregar. Intenta de nuevo.` : backpack?.name,
    });
    onClose();
  };

  const searching = docs.debouncedSearch.trim().length > 0;
  const filtered = docs.category !== "all";
  const noDocuments = !showSkeleton && docs.total === 0;

  return (
    <SafeAreaView style={styles.container} edges={["top"]}>
      <ScreenHeader
        title="Agregar documentos"
        subtitle={backpack ? (noDocuments ? `A «${backpack.name}»` : backpack.name) : undefined}
      />

      {noDocuments ? (
        <ScrollView contentContainerStyle={styles.emptyContent}>
          <PickerNoDocuments onUpload={onUpload} onScan={onScan} />
        </ScrollView>
      ) : (
        <>
          <View style={styles.toolbar}>
            <SearchField value={docs.search} onChange={docs.setSearch} placeholder="Buscar documentos" accessibilityLabel="Buscar documentos" />
            <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.chips}>
              {CATEGORY_FILTER_OPTIONS.map((o) => (
                <Chip
                  key={o.value}
                  label={o.label}
                  variant="option"
                  selectionMode="single"
                  selected={docs.category === o.value}
                  onPress={() => docs.setCategory(o.value)}
                />
              ))}
            </ScrollView>
          </View>

          {showSkeleton ? (
            <SkeletonGroup label="Cargando documentos" style={styles.skeleton}>
              {[0, 1, 2, 3].map((i) => (
                <View key={i} style={styles.skeletonRow}>
                  <Skeleton width={40} height={40} radius={13} />
                  <View style={{ flex: 1, gap: 6 }}>
                    <Skeleton width="65%" height={14} />
                    <Skeleton width="30%" height={12} />
                  </View>
                  <Skeleton width={24} height={24} radius={8} />
                </View>
              ))}
            </SkeletonGroup>
          ) : (
            <FlatList
              data={docs.items}
              keyExtractor={(d) => d.id}
              keyboardShouldPersistTaps="handled"
              keyboardDismissMode="on-drag"
              contentContainerStyle={[styles.content, { paddingBottom: BOTTOM_ACTION_BAR_HEIGHT + insets.bottom + spacing[6] }]}
              ItemSeparatorComponent={() => <View style={{ height: spacing[3] }} />}
              renderItem={({ item }: { item: Document }) => {
                const inside = existingIds?.has(item.id) ?? false;
                return (
                  <Animated.View
                    entering={FadeIn.duration(motion.fast)}
                    exiting={FadeOut.duration(motion.instant)}
                    layout={LinearTransition.duration(motion.base)}
                  >
                    <SelectableDocumentRow
                      document={item}
                      selected={!inside && selected.includes(item.id)}
                      onToggle={() => toggle(item.id)}
                      lockedLabel={inside ? "Ya en la mochila" : undefined}
                    />
                  </Animated.View>
                );
              }}
              ListEmptyComponent={
                <Animated.View entering={FadeIn.duration(motion.fast)} style={styles.noMatch}>
                  <Text style={styles.h3}>{searching ? `Sin resultados para «${docs.debouncedSearch.trim()}»` : "Nada en esta categoría"}</Text>
                  <Text style={styles.meta}>
                    {searching ? "Revisa cómo lo escribiste o busca por otra palabra." : "Prueba con otra categoría o mira todos tus documentos."}
                  </Text>
                  <Button
                    variant="secondary"
                    onPress={() => {
                      docs.setSearch("");
                      docs.setCategory("all");
                    }}
                  >
                    {searching && !filtered ? "Borrar búsqueda" : "Ver todos"}
                  </Button>
                </Animated.View>
              }
            />
          )}

          <BottomActionBar
            primary={{
              label: selected.length > 0 ? withDocuments("Agregar", selected.length) : "Agregar documentos",
              onPress: () => void add(),
              loading: adding,
              loadingLabel: "Agregando…",
              disabled: adding || selected.length === 0,
            }}
          />
        </>
      )}
    </SafeAreaView>
  );
}

function makeStyles(t: ThemeContextValue) {
  return StyleSheet.create({
    container: { flex: 1, backgroundColor: t.surface.bg },
    toolbar: { gap: spacing[3], paddingHorizontal: spacing[4], paddingTop: spacing[2], paddingBottom: spacing[3] },
    chips: { gap: spacing[2] },
    content: { paddingHorizontal: spacing[4], paddingTop: spacing[1] },
    emptyContent: { flexGrow: 1, paddingHorizontal: spacing[4], paddingBottom: spacing[8] },
    skeleton: { gap: spacing[3], paddingHorizontal: spacing[4], paddingTop: spacing[1] },
    skeletonRow: {
      flexDirection: "row",
      alignItems: "center",
      gap: spacing[3],
      padding: 14,
      borderRadius: 18,
      borderWidth: 1,
      borderBottomWidth: 4,
      borderColor: t.border.default,
      backgroundColor: t.surface.bgCard,
    },
    noMatch: { alignItems: "center", gap: spacing[2], paddingTop: spacing[8], paddingHorizontal: spacing[4] },
    h3: { fontSize: 17, fontFamily: nativeFont("heading", 800), color: t.text.primary, textAlign: "center" },
    meta: { fontSize: 14, lineHeight: 20, fontFamily: nativeFont("body", 400), color: t.text.secondary, textAlign: "center", marginBottom: spacing[2] },
  });
}
