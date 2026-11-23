import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { ActivityIndicator, FlatList, StyleSheet, Text, View } from "react-native";
import Animated, { FadeIn, FadeOut, LinearTransition } from "react-native-reanimated";
import { SafeAreaView, useSafeAreaInsets } from "react-native-safe-area-context";
import { Backpack as BackpackIcon, Check } from "lucide-react-native";
import type { Backpack, Document } from "@helu/api";
import { useBackpacksQuery } from "@helu/api/hooks";
import {
  BOTTOM_ACTION_BAR_HEIGHT,
  BottomActionBar,
  DiscardChangesDialog,
  IconTile,
  PressableScale,
  SearchField,
  SegmentedControl,
  Skeleton,
  SkeletonGroup,
  fontSize,
  motion,
  nativeFont,
  spacing,
  useAppTheme,
  useConfirmBounce,
  useSkeletonVisible,
  type ThemeContextValue,
} from "@helu/ui";
import { ScreenHeader } from "../ScreenHeader";
import type { SubscribeBeforeLeave } from "../agenda/AppointmentForm";
import { SelectableDocumentRow } from "../documents/SelectableDocumentRow";
import { usePickableDocuments } from "../../hooks/usePickableDocuments";
import { documentCountLabel, withDocuments } from "../backpacks/backpackCopy";

export type ShareChoice =
  | { kind: "documents"; documents: Document[] }
  | { kind: "backpack"; backpack: Backpack };

export interface ShareChooseProps {
  onContinue: (choice: ShareChoice) => void;
  onClose: () => void;
  subscribeBeforeLeave: SubscribeBeforeLeave;
}

/**
 * Mockup «Elegir documentos» (Compartir, paso 1 de 3): «Documentos / Mochilas», search, documents
 * to tick (several) or one backpack, and the fixed «Continuar con N documentos».
 */
export function ShareChoose({ onContinue, onClose, subscribeBeforeLeave }: ShareChooseProps) {
  const t = useAppTheme();
  const styles = useMemo(() => makeStyles(t), [t]);
  const insets = useSafeAreaInsets();
  const [tab, setTab] = useState<"documents" | "backpacks">("documents");
  const docs = usePickableDocuments();
  const backpacksQuery = useBackpacksQuery("", 50);
  const [selectedDocs, setSelectedDocs] = useState<string[]>([]);
  const [backpackId, setBackpackId] = useState<string | null>(null);
  const [bpSearch, setBpSearch] = useState("");
  const showSkeleton = useSkeletonVisible(tab === "documents" ? docs.isLoading : backpacksQuery.isLoading);

  const backpacks = useMemo(() => {
    const q = bpSearch.trim().toLowerCase();
    const all = (backpacksQuery.data?.items ?? []) as Backpack[];
    return q ? all.filter((b) => b.name.toLowerCase().includes(q)) : all;
  }, [backpacksQuery.data, bpSearch]);

  // ── Leaving with a selection asks first (formularios.md §7) ──
  const dirty = selectedDocs.length > 0 || backpackId !== null;
  const allowLeave = useRef(false);
  const [askDiscard, setAskDiscard] = useState(false);
  const leave = useCallback(() => {
    allowLeave.current = true;
    onClose();
  }, [onClose]);
  useEffect(
    () =>
      subscribeBeforeLeave((prevent) => {
        if (!dirty || allowLeave.current) return;
        prevent();
        setAskDiscard(true);
      }),
    [subscribeBeforeLeave, dirty],
  );

  const chosenBackpack = backpacks.find((b) => b.id === backpackId) ?? null;
  const barLabel =
    tab === "documents"
      ? selectedDocs.length > 0
        ? withDocuments("Continuar con", selectedDocs.length)
        : "Elige qué compartir"
      : chosenBackpack
        ? `Continuar con «${chosenBackpack.name}»`
        : "Elige una mochila";

  const next = () => {
    if (tab === "documents") {
      const byId = new Map(docs.loaded.map((d) => [d.id, d]));
      const chosen = selectedDocs.map((id) => byId.get(id)).filter((d): d is Document => !!d);
      if (chosen.length > 0) onContinue({ kind: "documents", documents: chosen });
      return;
    }
    if (chosenBackpack) onContinue({ kind: "backpack", backpack: chosenBackpack });
  };

  const listPadding = { paddingBottom: BOTTOM_ACTION_BAR_HEIGHT + insets.bottom + spacing[6] };

  return (
    <SafeAreaView style={styles.container} edges={["top"]}>
      <ScreenHeader title="Compartir" subtitle="Paso 1 de 3 · Elige qué compartir" onBack={() => (dirty ? setAskDiscard(true) : leave())} />
      <View style={styles.toolbar}>
        <SegmentedControl
          options={[
            { value: "documents", label: "Documentos" },
            { value: "backpacks", label: "Mochilas" },
          ]}
          value={tab}
          onChange={(v) => setTab(v as "documents" | "backpacks")}
          accessibilityLabel="Qué compartir"
        />
        {tab === "documents" ? (
          <SearchField value={docs.search} onChange={docs.setSearch} placeholder="Buscar documentos" accessibilityLabel="Buscar documentos" />
        ) : (
          <SearchField value={bpSearch} onChange={setBpSearch} placeholder="Buscar mochilas" accessibilityLabel="Buscar mochilas" />
        )}
      </View>

      {showSkeleton ? (
        <SkeletonGroup label="Cargando" style={styles.skeleton}>
          {[0, 1, 2, 3].map((i) => (
            <Skeleton key={i} height={72} radius={18} />
          ))}
        </SkeletonGroup>
      ) : tab === "documents" ? (
        <FlatList
          key="documents"
          data={docs.items}
          onEndReached={docs.loadMore}
          onEndReachedThreshold={0.3}
          ListFooterComponent={docs.isLoadingMore ? <ActivityIndicator style={{ marginTop: spacing[4] }} color={t.brand.fg} accessibilityLabel="Cargando más documentos" /> : undefined}
          keyExtractor={(d) => d.id}
          keyboardShouldPersistTaps="handled"
          keyboardDismissMode="on-drag"
          contentContainerStyle={[styles.content, listPadding]}
          ItemSeparatorComponent={() => <View style={{ height: spacing[3] }} />}
          renderItem={({ item }) => (
            <Animated.View entering={FadeIn.duration(motion.fast)} exiting={FadeOut.duration(motion.instant)} layout={LinearTransition.duration(motion.base)}>
              <SelectableDocumentRow
                document={item}
                selected={selectedDocs.includes(item.id)}
                onToggle={() =>
                  setSelectedDocs((ids) => (ids.includes(item.id) ? ids.filter((x) => x !== item.id) : [...ids, item.id]))
                }
              />
            </Animated.View>
          )}
          ListEmptyComponent={
            docs.hasMore ? undefined : (
              <Text style={styles.emptyLine}>
                {docs.total === 0 ? "Aún no tienes documentos para compartir." : `Ningún documento coincide con «${docs.debouncedSearch.trim()}».`}
              </Text>
            )
          }
        />
      ) : (
        <FlatList
          key="backpacks"
          data={backpacks}
          keyExtractor={(b) => b.id}
          keyboardShouldPersistTaps="handled"
          keyboardDismissMode="on-drag"
          contentContainerStyle={[styles.content, listPadding]}
          ItemSeparatorComponent={() => <View style={{ height: spacing[3] }} />}
          renderItem={({ item }) => (
            <SelectableBackpackRow
              backpack={item}
              selected={backpackId === item.id}
              onSelect={() => setBackpackId((id) => (id === item.id ? null : item.id))}
            />
          )}
          ListEmptyComponent={
            <Text style={styles.emptyLine}>
              {(backpacksQuery.data?.items.length ?? 0) === 0 ? "Aún no tienes mochilas." : `Ninguna mochila coincide con «${bpSearch.trim()}».`}
            </Text>
          }
        />
      )}

      <BottomActionBar
        primary={{
          label: barLabel,
          onPress: next,
          disabled: tab === "documents" ? selectedDocs.length === 0 : !chosenBackpack || (chosenBackpack.documentCount ?? 0) === 0,
        }}
      />

      {askDiscard ? (
        <DiscardChangesDialog
          onKeep={() => setAskDiscard(false)}
          onDiscard={() => {
            setAskDiscard(false);
            leave();
          }}
        />
      ) : null}
    </SafeAreaView>
  );
}

/** One backpack to share: the same card as `pickDoc`, with a round check (only one at a time). */
function SelectableBackpackRow({ backpack, selected, onSelect }: { backpack: Backpack; selected: boolean; onSelect: () => void }) {
  const t = useAppTheme();
  const styles = useMemo(() => makeStyles(t), [t]);
  const bounce = useConfirmBounce(selected);
  const count = backpack.documentCount ?? 0;
  const empty = count === 0;
  return (
    <PressableScale
      onPress={onSelect}
      disabled={empty}
      accessibilityRole="radio"
      accessibilityState={{ checked: selected, disabled: empty }}
      accessibilityLabel={`${backpack.name}, ${documentCountLabel(count)}${empty ? ", vacía" : ""}`}
      style={[styles.card, selected && { borderColor: t.brand.focus }, empty && { opacity: 0.55 }]}
    >
      <IconTile tone="backpack" icon={<BackpackIcon size={19} strokeWidth={2.2} color={t.accent.backpackFg} />} />
      <View style={styles.copy}>
        <Text style={styles.title} numberOfLines={1}>
          {backpack.name}
        </Text>
        <Text style={styles.meta} numberOfLines={1}>
          {empty ? "Vacía · agrega documentos para compartirla" : documentCountLabel(count)}
        </Text>
      </View>
      <Animated.View
        style={[
          styles.radio,
          selected ? { backgroundColor: t.brand.solid, borderColor: t.brand.solid } : { borderColor: t.border.medium },
          bounce,
        ]}
      >
        {selected ? <Check size={14} strokeWidth={3} color={t.text.onSolid} /> : null}
      </Animated.View>
    </PressableScale>
  );
}

function makeStyles(t: ThemeContextValue) {
  return StyleSheet.create({
    container: { flex: 1, backgroundColor: t.surface.bg },
    toolbar: { gap: spacing[3], paddingHorizontal: spacing[4], paddingTop: spacing[2], paddingBottom: spacing[3] },
    content: { paddingHorizontal: spacing[4], paddingTop: spacing[1] },
    skeleton: { gap: spacing[3], paddingHorizontal: spacing[4], paddingTop: spacing[1] },
    emptyLine: {
      textAlign: "center",
      paddingVertical: spacing[6],
      fontSize: 14,
      lineHeight: 20,
      fontFamily: nativeFont("body", 400),
      color: t.text.secondary,
    },
    card: {
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
    copy: { flex: 1, minWidth: 0, gap: 2 },
    title: { fontSize: 14, lineHeight: 18, fontFamily: nativeFont("body", 600), color: t.text.primary },
    meta: { fontSize: fontSize.sm, lineHeight: 18, fontFamily: nativeFont("body", 400), color: t.text.secondary },
    radio: { width: 24, height: 24, borderRadius: 12, borderWidth: 2, alignItems: "center", justifyContent: "center" },
  });
}
