import type { ReactNode } from "react";
import { View, Text } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { CalendarDays, ChevronRight, FileUp, Pill } from "lucide-react-native";
import { Button, IconTile, PressableScale, nativeFont, radii, spacing, useAppTheme } from "@helu/ui";
import { Mascot } from "../brand";
import { AuthScreenLayout } from "./AuthScreenLayout";

export interface WelcomeProps {
  onAddMedication: () => void;
  onAddAppointment: () => void;
  onUploadDocument: () => void;
  onExplore: () => void;
}

/**
 * Bienvenida (m1 · «Bienvenida (después del registro)»): aparece una sola vez, justo después de
 * «Crear cuenta». Tres primeros pasos opcionales y una salida secundaria. El registro todavía no
 * pide el nombre, así que el saludo no lo usa.
 */
export function Welcome({ onAddMedication, onAddAppointment, onUploadDocument, onExplore }: WelcomeProps) {
  const t = useAppTheme();
  const insets = useSafeAreaInsets();

  const bar = (
    <View
      style={{
        paddingHorizontal: spacing[4],
        paddingTop: spacing[3],
        paddingBottom: Math.max(insets.bottom, spacing[3]),
        backgroundColor: t.surface.bgCard,
        borderTopWidth: 1,
        borderTopColor: t.border.default,
      }}
    >
      <Button variant="secondary" size="lg" fullWidth onPress={onExplore}>
        Explorar por mi cuenta
      </Button>
    </View>
  );

  return (
    <AuthScreenLayout bottomBar={bar}>
      <View style={{ alignItems: "center", gap: 10, paddingTop: spacing[2] }}>
        <Mascot pose="wave" size={96} />
        <Text style={{ fontSize: 11, letterSpacing: 0.9, fontFamily: nativeFont("heading", 900), color: t.status.successFg }}>
          CUENTA CREADA
        </Text>
        <Text
          accessibilityRole="header"
          style={{ fontSize: 24, lineHeight: 32, fontFamily: nativeFont("heading", 900), color: t.text.primary, textAlign: "center" }}
        >
          ¡Te damos la bienvenida!
        </Text>
        <Text style={{ fontSize: 14, lineHeight: 21, fontFamily: nativeFont("body", 400), color: t.text.secondary, textAlign: "center" }}>
          Tu salud, paso a paso. ¿Qué te gustaría hacer primero?
        </Text>
      </View>

      <View style={{ gap: spacing[3] }}>
        <StepCard icon={<Pill size={20} color={t.brand.text} />} title="Agrega tu primer medicamento" meta="Te avisamos en cada toma · 1 min" onPress={onAddMedication} />
        <StepCard icon={<CalendarDays size={20} color={t.brand.text} />} title="Agrega tu próxima cita" meta="Te avisamos antes · 1 min" onPress={onAddAppointment} />
        <StepCard icon={<FileUp size={20} color={t.brand.text} />} title="Sube un documento" meta="Una orden, fórmula o resultado · 30 s" onPress={onUploadDocument} />
      </View>

      <Text style={{ fontSize: 13, lineHeight: 18, fontFamily: nativeFont("body", 400), color: t.text.secondary, textAlign: "center" }}>
        Ninguna es obligatoria. Puedes hacerlas después desde Inicio.
      </Text>
    </AuthScreenLayout>
  );
}

function StepCard({ icon, title, meta, onPress }: { icon: ReactNode; title: string; meta: string; onPress: () => void }) {
  const t = useAppTheme();
  return (
    <PressableScale
      onPress={onPress}
      accessibilityRole="button"
      accessibilityLabel={`${title}. ${meta}`}
      style={{
        flexDirection: "row",
        alignItems: "center",
        gap: spacing[3],
        padding: 14,
        backgroundColor: t.surface.bgCard,
        borderRadius: radii.card,
        borderWidth: 1,
        borderBottomWidth: 4,
        borderColor: t.border.default,
      }}
    >
      <IconTile icon={icon} tone="brand" />
      <View style={{ flex: 1, minWidth: 0 }}>
        <Text style={{ fontSize: 15, fontFamily: nativeFont("heading", 800), color: t.text.primary }}>{title}</Text>
        <Text style={{ fontSize: 13, lineHeight: 18, fontFamily: nativeFont("body", 400), color: t.text.secondary, marginTop: 2 }}>{meta}</Text>
      </View>
      <ChevronRight size={18} color={t.text.secondary} />
    </PressableScale>
  );
}
