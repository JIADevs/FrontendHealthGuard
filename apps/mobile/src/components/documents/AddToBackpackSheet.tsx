import { useEffect, useRef, useState } from "react";
import { StyleSheet, Text, View } from "react-native";
import { Backpack, Check, ChevronRight } from "lucide-react-native";
import { useAddDocToBackpackMutation, useBackpacksQuery } from "@helu/api/hooks";
import {
  BottomSheet,
  IconTile,
  PressableScale,
  Skeleton,
  SkeletonGroup,
  Spinner,
  nativeFont,
  spacing,
  useAppTheme,
  type BottomSheetHandle,
} from "@helu/ui";
import { notify } from "../../lib/notify";

/**
 * «A mochila» from the document detail: pick a backpack and the document goes in. The API has no
 * «which backpacks hold this document» query, so a repeated add is reported, not hidden.
 */
export function AddToBackpackSheet({ documentId, onClose }: { documentId: string; onClose: () => void }) {
  const t = useAppTheme();
  const sheetRef = useRef<BottomSheetHandle>(null);
  const backpacks = useBackpacksQuery("", 100);
  const add = useAddDocToBackpackMutation();
  const [pendingId, setPendingId] = useState<string | null>(null);
  const [addedIds, setAddedIds] = useState<string[]>([]);
  const items = backpacks.data?.items ?? [];
  // Backpacks made elsewhere since the last visit: show the cached list and refresh it.
  const { refetch } = backpacks;
  useEffect(() => {
    void refetch();
  }, [refetch]);

  const pick = (backpackId: string, name: string) => {
    if (pendingId || addedIds.includes(backpackId)) return;
    setPendingId(backpackId);
    add.mutate(
      { backpackId, documentId },
      {
        onSuccess: () => {
          setAddedIds((ids) => [...ids, backpackId]);
          sheetRef.current?.close(() => notify({ message: "Agregado a la mochila", description: name }));
        },
        onError: () =>
          notify({
            tone: "error",
            message: "No se pudo agregar",
            description: "Puede que ya esté en esa mochila. Revisa tu conexión e intenta de nuevo.",
          }),
        onSettled: () => setPendingId(null),
      },
    );
  };

  return (
    <BottomSheet
      ref={sheetRef}
      eyebrow="DOCUMENTO"
      title="Agregar a una mochila"
      icon={<IconTile tone="backpack" size="lg" round icon={<Backpack size={24} strokeWidth={2.4} color={t.accent.backpackFg} />} />}
      onClose={onClose}
    >
      {backpacks.isLoading ? (
        <SkeletonGroup label="Cargando mochilas" style={styles.list}>
          <Skeleton height={64} radius={18} />
          <Skeleton height={64} radius={18} />
        </SkeletonGroup>
      ) : items.length === 0 ? (
        <Text style={[styles.empty, { color: t.text.secondary }]}>
          Aún no tienes mochilas. Créalas en la pestaña Mochilas para agrupar documentos.
        </Text>
      ) : (
        <View style={styles.list}>
          {items.map((b) => {
            const done = addedIds.includes(b.id);
            return (
              <PressableScale
                key={b.id}
                onPress={() => pick(b.id, b.name)}
                accessibilityRole="button"
                accessibilityLabel={`Agregar a ${b.name}`}
                accessibilityState={{ busy: pendingId === b.id, disabled: done }}
                style={[styles.card, { backgroundColor: t.surface.bgCard, borderColor: t.border.default }]}
              >
                <IconTile tone="backpack" icon={<Backpack size={19} strokeWidth={2.2} color={t.accent.backpackFg} />} />
                <View style={styles.copy}>
                  <Text style={[styles.title, { color: t.text.primary }]} numberOfLines={1}>
                    {b.name}
                  </Text>
                  {b.description ? (
                    <Text style={[styles.subtitle, { color: t.text.secondary }]} numberOfLines={1}>
                      {b.description}
                    </Text>
                  ) : null}
                </View>
                {pendingId === b.id ? (
                  <Spinner size="sm" />
                ) : done ? (
                  <Check size={18} strokeWidth={3} color={t.status.successFg} />
                ) : (
                  <ChevronRight size={18} color={t.text.muted} />
                )}
              </PressableScale>
            );
          })}
        </View>
      )}
    </BottomSheet>
  );
}

const styles = StyleSheet.create({
  list: { gap: spacing[3] },
  card: { flexDirection: "row", alignItems: "center", gap: spacing[3], padding: 14, borderRadius: 18, borderWidth: 1, borderBottomWidth: 4 },
  copy: { flex: 1, minWidth: 0, gap: 2 },
  title: { fontSize: 14, fontFamily: nativeFont("body", 600) },
  subtitle: { fontSize: 13, fontFamily: nativeFont("body", 400) },
  empty: { fontSize: 14, lineHeight: 21, fontFamily: nativeFont("body", 400) },
});
