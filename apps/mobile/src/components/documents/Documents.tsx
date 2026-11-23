import { useCallback, useMemo, useState } from "react";
import { Keyboard, Pressable, ScrollView, SectionList, StyleSheet, Text, View } from "react-native";
import Animated, { FadeIn, FadeOut, LinearTransition, useAnimatedStyle, withTiming } from "react-native-reanimated";
import { SafeAreaView } from "react-native-safe-area-context";
import { Filter } from "lucide-react-native";
import type { Document } from "@helu/api";
import {
  Chip,
  PullRefreshIndicator,
  SearchField,
  Skeleton,
  SkeletonGroup,
  motion,
  nativeFont,
  radii,
  spacing,
  useAppTheme,
  usePullRefresh,
  useSkeletonVisible,
  type ThemeContextValue,
} from "@helu/ui";
import { Fab } from "../Fab";
import { useDocumentsList } from "../../hooks/useDocumentsList";
import { LoadError } from "../states/LoadError";
import { CATEGORY_FILTER_OPTIONS, type DocumentCategory } from "./documentCategories";
import { DocumentRow } from "./DocumentRow";
import { DocumentsAddSheet } from "./DocumentsAddSheet";
import {
  DocumentsEmpty,
  DocumentsFilterEmpty,
  DocumentsSearchEmpty,
  DocumentsSearchFilteredEmpty,
  documentsMatching,
} from "./DocumentsEmpty";
import { DocumentsFilterSheet } from "./DocumentsFilterSheet";
import { PortalLinkSheet } from "./PortalLinkSheet";

export interface DocumentsProps {
  onOpen: (doc: Document) => void;
  onEdit: (doc: Document) => void;
  onShare: (doc: Document) => void;
  onDelete: (doc: Document) => void;
  onScan: () => void;
  onUpload: () => void;
}

const STAGGER_MS = 40;
const STAGGER_MAX = 6;

/**
 * Mockup «Documentos» (m4) with its states (m9): title, search with the filter button, quick
 * category chips, the list grouped by date («ESTA SEMANA», months), and the «+» to add one.
 */
export function Documents(props: DocumentsProps) {
  // Leaving the list with the search focused makes iOS give it the focus back on return, so the
  // keyboard would pop up by itself: close it before any navigation.
  const [addOpen, setAddOpen] = useState(false);
  const [filtersOpen, setFiltersOpen] = useState(false);
  // It also closes the sheets: a row tapped while «Agregar documento» was still opening used to
  // leave the sheet on top of the detail screen.
  const away = <A extends unknown[]>(fn: (...args: A) => void) => (...args: A) => {
    Keyboard.dismiss();
    setAddOpen(false);
    setFiltersOpen(false);
    fn(...args);
  };
  const onOpen = away(props.onOpen);
  const onEdit = away(props.onEdit);
  const onShare = away(props.onShare);
  const onDelete = props.onDelete;
  const onScan = away(props.onScan);
  const onUpload = away(props.onUpload);
  const t = useAppTheme();
  const styles = useMemo(() => makeStyles(t), [t]);
  const list = useDocumentsList();
  const pull = usePullRefresh(list.refetch, list.updatedAt);
  const showSkeleton = useSkeletonVisible(list.isLoading);
  const [portalOpen, setPortalOpen] = useState(false);
  // Staggered entry only for the first paint of the list (§2, §6c), not on every refetch.
  const [entered, setEntered] = useState(false);

  const pickTag = useCallback(
    (valueId: string) => {
      list.setSearch("");
      list.setFilters((f) => ({ ...f, tagValueIds: [valueId] }));
    },
    [list],
  );
  const pickCategory = useCallback(
    (c: DocumentCategory) => {
      list.setSearch("");
      list.setFilters((f) => ({ ...f, categories: [c] }));
    },
    [list],
  );

  const searching = list.debouncedSearch.trim().length > 0;
  // v2.13 «Buscar y filtrar»: while the next results are on their way the current ones dim to 50 %
  // (150 ms) and the search field shows the spinner; then rows that stay keep still, rows that leave
  // fade out in 100 ms and new ones fade in in 150 ms.
  const busy = !list.settled && (list.search.trim().length > 0 || list.debouncedSearch.trim().length > 0);
  const dim = useAnimatedStyle(() => ({ opacity: withTiming(busy ? 0.5 : 1, { duration: motion.fast }) }));
  // v2.13: when a search finds nothing because of the active filter, the empty state says so.
  const hiddenByFilter = useMemo(
    () => (searching && list.hasActiveFilter ? documentsMatching(list.debouncedSearch, list.allDocuments) : []),
    [searching, list.hasActiveFilter, list.debouncedSearch, list.allDocuments],
  );
  // Staggered entry by group (§2, §6c): rows of «Esta semana» together, then each month 40 ms later.
  const groupById = useMemo(
    () => new Map(list.sections.flatMap((section, g) => section.data.map((d) => [d.id, g] as const))),
    [list.sections],
  );

  return (
    <SafeAreaView style={styles.container} edges={["top"]}>
      <View style={styles.header}>
        <Text style={styles.title} accessibilityRole="header">
          Documentos
        </Text>
        <View style={styles.toolbar}>
          <View style={styles.searchWrap}>
            <SearchField
              value={list.search}
              onChange={list.setSearch}
              placeholder="Buscar documentos"
              accessibilityLabel="Buscar documentos"
              loading={busy}
            />
          </View>
          <Pressable
            style={[styles.filterBtn, list.hasActiveFilter && styles.filterBtnActive]}
            onPress={() => {
              Keyboard.dismiss();
              setFiltersOpen(true);
            }}
            accessibilityRole="button"
            accessibilityLabel={list.hasActiveFilter ? "Filtros, hay filtros activos" : "Filtros"}
          >
            <Filter size={18} color={list.hasActiveFilter ? t.brand.text : t.text.onMuted} />
          </Pressable>
        </View>
        <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.quick}>
          {CATEGORY_FILTER_OPTIONS.map((o) => (
            <Chip
              key={o.value}
              label={o.label}
              variant="option"
              selectionMode="single"
              selected={list.quickCategory === o.value}
              onPress={() => list.setQuickCategory(o.value)}
            />
          ))}
        </ScrollView>
      </View>

      {showSkeleton ? (
        // §6c: header, search and filters are real; the list is a skeleton by groups (date + 2 rows).
        <SkeletonGroup label="Cargando documentos" style={styles.skeleton}>
          <Skeleton width={90} height={11} />
          <DocumentRowSkeleton />
          <DocumentRowSkeleton />
          <DocumentRowSkeleton />
          <Skeleton width={70} height={11} style={{ marginTop: spacing[2] }} />
          <DocumentRowSkeleton />
          <DocumentRowSkeleton />
        </SkeletonGroup>
      ) : (
        <Animated.View style={[{ flex: 1 }, dim]} aria-busy={busy}>
          <SectionList
            sections={list.sections}
            keyExtractor={(d) => d.id}
            stickySectionHeadersEnabled={false}
            contentContainerStyle={list.items.length === 0 ? styles.emptyContent : styles.content}
            keyboardShouldPersistTaps="handled"
            keyboardDismissMode="on-drag"
            onLayout={() => setEntered(true)}
            refreshControl={pull.refreshControl}
            onScroll={pull.onScroll}
            scrollEventThrottle={16}
            renderSectionHeader={({ section }) => (
              <Text style={styles.eyebrow} accessibilityRole="header">
                {section.title}
              </Text>
            )}
            renderItem={({ item }) => {
              const group = groupById.get(item.id) ?? 0;
              return (
                <Animated.View
                  entering={
                    entered
                      ? FadeIn.duration(motion.fast)
                      : FadeIn.duration(motion.base).delay(Math.min(group, STAGGER_MAX) * STAGGER_MS)
                  }
                  exiting={FadeOut.duration(motion.instant)}
                  layout={LinearTransition.duration(motion.base)}
                  style={styles.rowWrap}
                >
                  <DocumentRow
                    document={item}
                    onPress={() => onOpen(item)}
                    actions={{
                      onView: () => onOpen(item),
                      onEdit: () => onEdit(item),
                      onShare: () => onShare(item),
                      onDelete: () => onDelete(item),
                    }}
                  />
                </Animated.View>
              );
            }}
            ListEmptyComponent={
              !list.settled ? undefined : (
                <Animated.View entering={FadeIn.duration(motion.fast)}>
                  {list.isError ? (
                    <LoadError title="No se pudieron cargar tus documentos" onRetry={() => void list.refetch()} retrying={list.isRefetching} />
                  ) : searching && list.hasActiveFilter && hiddenByFilter.length > 0 ? (
                    <DocumentsSearchFilteredEmpty
                      query={list.debouncedSearch}
                      filters={list.filters}
                      matches={hiddenByFilter}
                      onSearchAll={() => list.setFilters({ categories: [], tagValueIds: [], startDate: null, endDate: null })}
                      onOpen={onOpen}
                    />
                  ) : searching ? (
                    <DocumentsSearchEmpty
                      query={list.debouncedSearch}
                      allDocuments={list.allDocuments}
                      tagCategories={list.tagCategories}
                      onSearch={list.setSearch}
                      onPickTag={pickTag}
                      onPickCategory={pickCategory}
                      onUpload={() => setAddOpen(true)}
                    />
                  ) : list.hasActiveFilter ? (
                    <DocumentsFilterEmpty
                      filters={list.filters}
                      allDocuments={list.allDocuments}
                      tagCategories={list.tagCategories}
                      onChange={list.setFilters}
                      onOpen={onOpen}
                    />
                  ) : (
                    <DocumentsEmpty onUpload={onUpload} onScan={onScan} />
                  )}
                </Animated.View>
              )
            }
          />
          <PullRefreshIndicator state={pull} />
        </Animated.View>
      )}

      <Fab
        onPress={() => {
          Keyboard.dismiss();
          setAddOpen(true);
        }}
        accessibilityLabel="Agregar documento"
      />

      <DocumentsAddSheet
        visible={addOpen}
        onClose={() => setAddOpen(false)}
        onScan={onScan}
        onUpload={onUpload}
        onPortalLink={() => setPortalOpen(true)}
      />

      {portalOpen ? <PortalLinkSheet onClose={() => setPortalOpen(false)} /> : null}

      {filtersOpen ? (
        <DocumentsFilterSheet
          initial={list.filters}
          tagCategories={list.tagCategories}
          countFor={list.countFor}
          onApply={list.setFilters}
          onClose={() => setFiltersOpen(false)}
        />
      ) : null}
    </SafeAreaView>
  );
}

function makeStyles(t: ThemeContextValue) {
  return StyleSheet.create({
    container: { flex: 1, backgroundColor: t.surface.bg },
    header: { paddingHorizontal: spacing[4], paddingTop: spacing[3], gap: spacing[3], backgroundColor: t.surface.bg },
    title: { fontSize: 26, lineHeight: 30, fontFamily: nativeFont("heading", 900), color: t.text.primary },
    toolbar: { flexDirection: "row", alignItems: "center", gap: spacing[2] },
    searchWrap: { flex: 1 },
    // Mockup: 46 × 46, radio 14 (MASTER §6: mínimo 44)
    filterBtn: {
      width: 46,
      height: 46,
      borderRadius: radii.lg,
      alignItems: "center",
      justifyContent: "center",
      backgroundColor: t.surface.bgCard,
      borderWidth: 1,
      borderColor: t.border.default,
    },
    filterBtnActive: { backgroundColor: t.brand.tint, borderColor: t.brand.tintBorder },
    quick: { gap: spacing[2], paddingBottom: spacing[1] },
    content: { paddingHorizontal: spacing[4], paddingBottom: spacing[12] + 58 },
    emptyContent: { flexGrow: 1, paddingBottom: spacing[12] + 58 },
    rowWrap: { marginBottom: spacing[3] },
    eyebrow: {
      fontSize: 11,
      fontFamily: nativeFont("heading", 900),
      letterSpacing: 0.9,
      textTransform: "uppercase",
      color: t.text.secondary,
      marginTop: spacing[4],
      marginBottom: spacing[2],
    },
    skeleton: { gap: spacing[3], paddingHorizontal: spacing[4], paddingTop: spacing[4] },
  });
}

/** A `DocumentRow` while it loads: same card, 40 px tile, two lines and the 44 px «⋯». */
function DocumentRowSkeleton() {
  const t = useAppTheme();
  return (
    <View
      style={{
        flexDirection: "row",
        alignItems: "center",
        gap: spacing[3],
        padding: 14,
        borderRadius: 18,
        borderWidth: 1,
        borderBottomWidth: 4,
        borderColor: t.border.default,
        backgroundColor: t.surface.bgCard,
      }}
    >
      <Skeleton width={40} height={40} radius={13} />
      <View style={{ flex: 1, gap: 6 }}>
        <Skeleton width="65%" height={14} />
        <Skeleton width="40%" height={12} />
      </View>
      <View style={{ width: 44, height: 44, alignItems: "center", justifyContent: "center" }}>
        <Skeleton width={4} height={16} radius={2} />
      </View>
    </View>
  );
}
