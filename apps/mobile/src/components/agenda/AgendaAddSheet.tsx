import { Pressable, View, Text, StyleSheet } from "react-native";
import { CalendarDays, CheckSquare, ChevronRight, Heart, Pill, Plus } from "lucide-react-native";
import { BottomSheet, IconTile, nativeFont, spacing, useAppTheme, type Tone } from "@helu/ui";

export interface AgendaAddSheetProps {
  visible: boolean;
  onClose: () => void;
  onAddAppointment: () => void;
  onAddMedication: () => void;
  onAddTask: () => void;
  onAddCheckIn: () => void;
}

/**
 * Hoja del botón «+» (mockup «Agregar a agenda»): encabezado «AGENDA · ¿Qué quieres agregar?»
 * y una tarjeta por opción con el color de su módulo (aquí el módulo es la opción, MASTER §4.3 v2.1).
 */
export function AgendaAddSheet({
  visible,
  onClose,
  onAddAppointment,
  onAddMedication,
  onAddTask,
  onAddCheckIn,
}: AgendaAddSheetProps) {
  const t = useAppTheme();
  if (!visible) return null;

  const options: { tone: Tone; icon: typeof Heart; title: string; subtitle: string; onPress: () => void }[] = [
    { tone: "wellbeing", icon: Heart, title: "Registrar check-in", subtitle: "Cómo te sientes hoy", onPress: onAddCheckIn },
    { tone: "appointment", icon: CalendarDays, title: "Nueva cita", subtitle: "Consulta, examen o control", onPress: onAddAppointment },
    { tone: "medication", icon: Pill, title: "Nuevo medicamento", subtitle: "Con recordatorios de cada toma", onPress: onAddMedication },
    { tone: "mission", icon: CheckSquare, title: "Nueva tarea", subtitle: "Recoger, llamar o enviar algo", onPress: onAddTask },
  ];

  return (
    <BottomSheet
      eyebrow="AGENDA"
      title="¿Qué quieres agregar?"
      icon={<IconTile tone="brand" size="lg" round icon={<Plus size={24} strokeWidth={2.4} color={t.brand.text} />} />}
      onClose={onClose}
    >
      <View style={styles.list}>
        {options.map(({ tone, icon: Icon, title, subtitle, onPress }) => (
          <Pressable
            key={title}
            onPress={() => {
              onClose();
              onPress();
            }}
            accessibilityRole="button"
            accessibilityLabel={`${title}, ${subtitle}`}
            style={({ pressed }) => [
              styles.card,
              { backgroundColor: t.surface.bgCard, borderColor: t.border.default, opacity: pressed ? 0.85 : 1 },
            ]}
          >
            <IconTile tone={tone} icon={<Icon size={19} strokeWidth={2.2} color={toneColor(t, tone)} />} />
            <View style={styles.copy}>
              <Text style={[styles.title, { color: t.text.primary }]}>{title}</Text>
              <Text style={[styles.subtitle, { color: t.text.secondary }]}>{subtitle}</Text>
            </View>
            <ChevronRight size={18} color={t.text.muted} />
          </Pressable>
        ))}
      </View>
    </BottomSheet>
  );
}

function toneColor(t: ReturnType<typeof useAppTheme>, tone: Tone): string {
  if (tone === "wellbeing") return t.accent.wellbeingFg;
  if (tone === "appointment") return t.accent.calFg;
  if (tone === "medication") return t.accent.medFg;
  return t.accent.missionFg;
}

const styles = StyleSheet.create({
  list: { gap: spacing[3] },
  // Kit `.card.tight`
  card: {
    flexDirection: "row",
    alignItems: "center",
    gap: spacing[3],
    padding: 14,
    borderRadius: 18,
    borderWidth: 1,
    borderBottomWidth: 4,
  },
  copy: { flex: 1, gap: 2 },
  title: { fontSize: 14, fontFamily: nativeFont("body", 600) },
  subtitle: { fontSize: 13, fontFamily: nativeFont("body", 400) },
});
