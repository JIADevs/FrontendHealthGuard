import { useRef } from "react";
import { StyleSheet, Text, View } from "react-native";
import { ChevronRight, ListChecks, Pause, Pencil, Play, QrCode, Route, X, type LucideIcon } from "lucide-react-native";
import type { Mission } from "@helu/api";
import {
  BottomSheet,
  DangerLink,
  IconTile,
  PressableScale,
  nativeFont,
  spacing,
  useAppTheme,
  type BottomSheetHandle,
} from "@helu/ui";

export type MissionOption = "share" | "history" | "edit" | "pause" | "resume" | "cancel";

/**
 * Mockup «Opciones de la misión» (menú «⋯» del encabezado, misiones.md v2.17): Compartir documentos,
 * Ver historial, Editar nombre y datos y Pausar (o Reanudar); «Cancelar misión» como enlace rojo al
 * final, lejos del resto (MASTER §7). No hay «Eliminar»: una misión solo se cancela (DU-24).
 */
export function MissionOptionsSheet({
  mission,
  canShare,
  onClose,
  onChoose,
}: {
  mission: Mission;
  /** «Compartir documentos» only when the mission has documents. */
  canShare: boolean;
  onClose: () => void;
  onChoose: (option: MissionOption) => void;
}) {
  const t = useAppTheme();
  const ref = useRef<BottomSheetHandle>(null);
  const closed = mission.status === "completed" || mission.status === "canceled";
  const rows: { key: MissionOption; icon: LucideIcon; title: string; hint: string }[] = [
    ...(canShare ? [{ key: "share" as const, icon: QrCode, title: "Compartir documentos", hint: "Crea un enlace y un QR para tu médico" }] : []),
    { key: "history", icon: ListChecks, title: "Ver historial", hint: "Quién hizo qué y cuándo" },
    ...(closed ? [] : [{ key: "edit" as const, icon: Pencil, title: "Editar nombre", hint: "" }]),
    ...(mission.status === "active"
      ? [{ key: "pause" as const, icon: Pause, title: "Pausar misión", hint: "La retomas cuando quieras" }]
      : mission.status === "paused"
        ? [{ key: "resume" as const, icon: Play, title: "Reanudar misión", hint: "Sigues donde la dejaste" }]
        : []),
  ];
  const choose = (option: MissionOption) => ref.current?.close(() => onChoose(option));

  return (
    <BottomSheet
      ref={ref}
      eyebrow="MISIÓN"
      title={mission.title}
      icon={<IconTile round size="lg" tone="brand" icon={<Route size={22} strokeWidth={2.2} color={t.brand.text} />} />}
      onClose={onClose}
    >
      <View style={styles.body}>
        <View style={[styles.card, { backgroundColor: t.surface.bgCard, borderColor: t.border.default }]}>
          {rows.map(({ key, icon: Icon, title, hint }) => (
            <PressableScale key={key} onPress={() => choose(key)} accessibilityRole="button" accessibilityLabel={title} style={styles.row}>
              <IconTile tone="neutral" icon={<Icon size={19} strokeWidth={2.2} color={t.text.secondary} />} />
              <View style={styles.copy}>
                <Text style={[styles.title, { color: t.text.primary }]}>{title}</Text>
                {hint ? <Text style={[styles.hint, { color: t.text.secondary }]}>{hint}</Text> : null}
              </View>
              <ChevronRight size={18} color={t.text.muted} />
            </PressableScale>
          ))}
        </View>
        {closed ? null : (
          <DangerLink label="Cancelar misión" icon={<X size={16} strokeWidth={2.6} color={t.status.errorFg} />} onPress={() => choose("cancel")} />
        )}
      </View>
    </BottomSheet>
  );
}

const styles = StyleSheet.create({
  body: { gap: spacing[3] },
  card: { paddingHorizontal: 14, paddingVertical: 6, borderRadius: 18, borderWidth: 1, borderBottomWidth: 4 },
  row: { flexDirection: "row", alignItems: "center", gap: spacing[3], paddingVertical: 10, minHeight: 56 },
  copy: { flex: 1, gap: 2 },
  title: { fontSize: 14, fontFamily: nativeFont("body", 600) },
  hint: { fontSize: 13, fontFamily: nativeFont("body", 400) },
});
