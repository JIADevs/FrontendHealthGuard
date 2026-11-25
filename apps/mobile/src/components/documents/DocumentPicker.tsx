import { useCallback, useMemo, useRef, useState } from "react";
import { ActivityIndicator, FlatList, ScrollView, StyleSheet, Text, View } from "react-native";
import Animated, { FadeIn, FadeOut, LinearTransition } from "react-native-reanimated";
import { SafeAreaView, useSafeAreaInsets } from "react-native-safe-area-context";
import { useFocusEffect } from "@react-navigation/native";
import type { Document } from "@helu/api";
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
import { SelectableDocumentRow } from "./SelectableDocumentRow";
import { CATEGORY_FILTER_OPTIONS } from "./documentCategories";
import { useRecentlySaved } from "../../lib/recentlySaved";
import { usePickableDocuments } from "../../hooks/usePickableDocuments";
import { PickerNoDocuments } from "../backpacks/BackpacksEmpty";
import { withDocuments } from "../backpacks/backpackCopy";

export interface DocumentPickerProps {
  /** Where the documents go (backpack or mission name), under the title. */
  subtitle?: string;
  /** Documents already there: shown locked with `lockedLabel`. */
  existingIds?: Set<string>;
  /** Still loading `existingIds`. */
  loadingExisting?: boolean;
  lockedLabel: string;
  emptyDescription?: string;
  /** Adds the selection; resolves when done (the picker shows «Agregando…» meanwhile). */
  onAdd: (ids: string[]) => Promise<void>;
  /** «Subir documento» / «Escanear» from the empty state; the picker comes back with it selected. */
  onUpload: () => void;
  onScan: () => void;
}

/**
 * Mockup «Agregar documentos» (m5) and m9 «Agregar documentos · sin documentos»: search, the same
 * category chips as Documentos, multi-select with the square on the right (locked for those already
 * there) and the fixed «Agregar N documentos» bar. Shared by Mochilas and Misiones (RF-61).
 */
export function DocumentPicker({
  subtitle,
  existingIds,
  loadingExisting = false,
  lockedLabel,
  emptyDescription,
  onAdd,
  onUpload,
  onScan,
}: DocumentPickerProps) {
  const t = useAppTheme();
  const styles = useMemo(() => makeStyles(t), [t]);
  const insets = useSafeAreaInsets();
  const docs = usePickableDocuments();
  const [selected, setSelected] = useState<string[]>([]);
  const [adding, setAdding] = useState(false);
  const showSkeleton = useSkeletonVisible(docs.isLoading || loadingExisting);

  // Back from «Subir documento»: the new document comes selected (#46, decision 2). The first focus
  // only drops an upload saved earlier from anywhere else, so it is not preselected here.
  const focusedOnce = useRef(false);
  useFocusEffect(
    useCallback(() => {
      const uploaded = useRecentlySaved.getState().takeUploaded();
      if (!focusedOnce.current) {
        focusedOnce.current = true;
        return;
      }
      if (uploaded) setSelected((ids) => (ids.includes(uploaded) ? ids : [...ids, uploaded]));
    }, []),
  );

  const toggle = (docId: string) =>
    setSelected((ids) => (ids.includes(docId) ? ids.filter((x) => x !== docId) : [...ids, docId]));

  const add = async () => {
    if (selected.length === 0) return;
    setAdding(true);
    try {
      await onAdd(selected);
    } finally {
      setAdding(false);
    }
  };

  const searching = docs.debouncedSearch.trim().length > 0;
  const filtered = docs.category !== "all";
  const noDocuments = !showSkeleton && docs.total === 0;

  return (
    <SafeAreaView style={styles.container} edges={["top"]}>
      <ScreenHeader title="Agregar documentos" subtitle={noDocuments ? (subtitle ? `A «${subtitle}»` : undefined) : subtitle} />

      {noDocuments ? (
        <ScrollView contentContainerStyle={styles.emptyContent}>
          <PickerNoDocuments onUpload={onUpload} onScan={onScan} description={emptyDescription} />
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
              onEndReached={docs.loadMore}
              onEndReachedThreshold={0.3}
              ListFooterComponent={docs.isLoadingMore ? <ActivityIndicator style={{ marginTop: spacing[4] }} color={t.brand.fg} accessibilityLabel="Cargando más documentos" /> : undefined}
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
                      lockedLabel={inside ? lockedLabel : undefined}
                    />
                  </Animated.View>
                );
              }}
              ListEmptyComponent={
                docs.hasMore ? undefined : (
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
                )
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
