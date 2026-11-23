import { useMemo } from "react";
import { StyleSheet, Text, View } from "react-native";
import { Activity, CalendarDays, ChevronRight, Globe, Plus, Upload, Camera } from "lucide-react-native";
import { Button, IconTile, PressableScale, fontSize, nativeFont, spacing, toneColors, useAppTheme, type ThemeContextValue, type Tone } from "@helu/ui";
import { EmptyHero } from "../states/EmptyHero";
import { LoadError } from "../states/LoadError";

/** Templates of m9 «Mochilas · vacío» (#46, decision 1): they only prefill the form. */
export interface BackpackTemplate {
  name: string;
  description: string;
}

const TEMPLATES: { title: string; sub: string; tone: Tone; icon: "calendar" | "activity" | "globe"; preset: BackpackTemplate }[] = [
  {
    title: "Para una cita médica",
    sub: "Orden, autorización y exámenes recientes",
    tone: "appointment",
    icon: "calendar",
    preset: { name: "Cita médica", description: "Orden, autorización y exámenes recientes" },
  },
  {
    title: "Para urgencias",
    sub: "Alergias, medicamentos y diagnósticos",
    tone: "danger",
    icon: "activity",
    preset: { name: "Urgencias", description: "Alergias, medicamentos y diagnósticos" },
  },
  {
    title: "Para un viaje",
    sub: "Lo esencial, por si acaso",
    tone: "backpack",
    icon: "globe",
    preset: { name: "Viaje", description: "Lo esencial, por si acaso" },
  },
];


/** m9 «Mochilas · vacío»: one primary action and three templates. */
export function BackpacksEmpty({ onCreate }: { onCreate: (preset?: BackpackTemplate) => void }) {
  const t = useAppTheme();
  const styles = useMemo(() => makeStyles(t), [t]);
  const icons = {
    calendar: CalendarDays,
    activity: Activity,
    globe: Globe,
  } as const;
  return (
    <View style={styles.wrap}>
      <EmptyHero
        pose="point"
        title="Aún no tienes mochilas"
        description="Una mochila junta los documentos que llevas a una cita y se comparte con un QR."
      >
        <Button fullWidth icon={<Plus size={17} strokeWidth={2.6} color={t.text.onSolid} />} onPress={() => onCreate()}>
          Crear mochila
        </Button>
      </EmptyHero>
      <View style={styles.templates}>
        <Text style={styles.eyebrow}>O empieza con una plantilla</Text>
        {TEMPLATES.map((tpl) => {
          const Icon = icons[tpl.icon];
          return (
            <PressableScale
              key={tpl.title}
              onPress={() => onCreate(tpl.preset)}
              accessibilityRole="button"
              accessibilityLabel={`${tpl.title}. ${tpl.sub}`}
              style={styles.tpl}
            >
              <IconTile tone={tpl.tone} icon={<Icon size={19} strokeWidth={2.2} color={toneColors(tpl.tone, t.mode).fg} />} />
              <View style={styles.copy}>
                <Text style={styles.title}>{tpl.title}</Text>
                <Text style={styles.meta}>{tpl.sub}</Text>
              </View>
              <ChevronRight size={18} color={t.text.muted} />
            </PressableScale>
          );
        })}
      </View>
    </View>
  );
}

/** Search without results, with a way out (m9 principle 100). */
export function BackpacksSearchEmpty({ query, onClear }: { query: string; onClear: () => void }) {
  return (
    <EmptyHero pose="think" title={`Sin mochilas para «${query}»`} description="Revisa cómo lo escribiste o busca por otra palabra.">
      <Button variant="secondary" fullWidth onPress={onClear}>
        Borrar búsqueda
      </Button>
    </EmptyHero>
  );
}

/** m7 «Error al cargar» (Mochilas). */
export function BackpacksError({ onRetry }: { onRetry: () => void }) {
  return <LoadError title="No se pudieron cargar las mochilas" onRetry={onRetry} />;
}

/** m9 «Agregar documentos · sin documentos»: explains why and leads to uploading, then back here. */
export function PickerNoDocuments({ onUpload, onScan }: { onUpload: () => void; onScan: () => void }) {
  const t = useAppTheme();
  return (
    <EmptyHero
      pose="happy"
      top={60}
      title="Primero sube un documento"
      description="Para llenar la mochila necesitas documentos. Sube uno y vuelves aquí para agregarlo."
    >
      <Button fullWidth icon={<Upload size={17} strokeWidth={2.4} color={t.text.onSolid} />} onPress={onUpload}>
        Subir documento
      </Button>
      <Button variant="secondary" fullWidth icon={<Camera size={17} strokeWidth={2.4} color={t.brand.text} />} onPress={onScan}>
        Escanear con la cámara
      </Button>
    </EmptyHero>
  );
}

function makeStyles(t: ThemeContextValue) {
  return StyleSheet.create({
    wrap: { gap: spacing[6], paddingBottom: spacing[6] },
    templates: { gap: spacing[2] },
    eyebrow: {
      fontSize: fontSize.xs,
      fontFamily: nativeFont("heading", 900),
      letterSpacing: 0.9,
      textTransform: "uppercase",
      color: t.text.secondary,
    },
    tpl: {
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
  });
}
