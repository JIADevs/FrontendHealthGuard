import { useMemo, useRef, useState } from "react";
import { StyleSheet, Text, View } from "react-native";
import { Globe, Link2 } from "lucide-react-native";
import { useTreatmentsQuery } from "@helu/api/hooks";
import {
  BottomSheet,
  Button,
  DatePicker,
  IconTile,
  Select,
  TextField,
  nativeFont,
  spacing,
  useAppTheme,
  type BottomSheetHandle,
} from "@helu/ui";
import { Mascot } from "../brand";
import { useDocumentForm } from "../../hooks/useDocumentForm";

function todayKey(): string {
  const d = new Date();
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
}

/** «https://www.colsanitas.com/resultados» → «Colsanitas». */
export function portalName(url: string): string | null {
  const host = url.trim().replace(/^[a-z]+:\/\//i, "").split(/[/?#]/)[0]?.replace(/^www\./i, "") ?? "";
  const parts = host.split(".").filter(Boolean);
  if (parts.length === 0) return null;
  const name = parts.length >= 2 ? parts[parts.length - 2]! : parts[0]!;
  return name.charAt(0).toUpperCase() + name.slice(1);
}

function validUrl(value: string): boolean {
  return /^https?:\/\/[^\s.]+\.[^\s]{2,}/i.test(value.trim());
}

/**
 * Mockup «Resultado de examen virtual»: a sheet over the list, one column, the URL first. The title
 * fills itself with the portal's name. The password field is gone (#43, decision 3): only a user or
 * access code is saved.
 */
export function PortalLinkSheet({ onClose }: { onClose: () => void }) {
  const t = useAppTheme();
  const sheetRef = useRef<BottomSheetHandle>(null);
  const form = useDocumentForm({ skipNavigateBackOnUpload: true, onUploaded: () => sheetRef.current?.close() });
  const treatments = useTreatmentsQuery(1, 100).data?.items ?? [];
  const [url, setUrl] = useState("");
  const [title, setTitle] = useState("");
  const [user, setUser] = useState("");
  const [date, setDate] = useState(todayKey());
  const [treatmentId, setTreatmentId] = useState<string | null>(null);
  const [submitted, setSubmitted] = useState(false);
  const [urlTouched, setUrlTouched] = useState(false);

  const urlError = useMemo(() => {
    if (!submitted && !urlTouched) return undefined;
    if (!url.trim()) return "Escribe la dirección del portal.";
    if (!validUrl(url)) return "Revisa la dirección: debe empezar por https://";
    return undefined;
  }, [url, submitted, urlTouched]);

  const save = () => {
    setSubmitted(true);
    if (!url.trim() || !validUrl(url)) return;
    const fallback = portalName(url);
    void form.handleCreateLink({
      portalUrl: url.trim(),
      portalUsername: user.trim() || null,
      docDate: `${date}T00:00:00`,
      treatmentId,
      overrides: { title: title.trim() || (fallback ? `Resultados · ${fallback}` : undefined) },
    });
  };

  const dirty = url.trim() !== "" || title.trim() !== "" || user.trim() !== "";

  return (
    <BottomSheet
      ref={sheetRef}
      eyebrow="NUEVO DOCUMENTO"
      title="Resultado de examen virtual"
      icon={<IconTile tone="document" size="lg" round icon={<Globe size={24} strokeWidth={2.4} color={t.accent.docFg} />} />}
      dirty={dirty && !form.uploading}
      onClose={onClose}
    >
      <View style={styles.body}>
        <TextField
          label="URL del portal"
          value={url}
          onChange={setUrl}
          onBlur={() => setUrlTouched(true)}
          placeholder="https://"
          keyboardType="default"
          autoCapitalize="none"
          textContentType="URL"
          leadingIcon={<Link2 size={18} color={t.text.muted} />}
          error={urlError}
          autoFocus
        />
        <TextField
          label="Título (opcional)"
          value={title}
          onChange={setTitle}
          placeholder={portalName(url) ? `Resultados · ${portalName(url)}` : "Ej: Resultados · Colsanitas"}
          helper="Si lo dejas vacío, usamos el nombre del portal."
          autoCapitalize="sentences"
        />
        <TextField
          label="Usuario o código de acceso (opcional)"
          value={user}
          onChange={setUser}
          placeholder="Ej: número de orden"
          autoCapitalize="none"
        />
        <DatePicker label="Fecha (opcional)" value={date} onChange={setDate} />
        {treatments.length > 0 ? (
          <Select
            label="Tratamiento (opcional)"
            placeholder="Sin tratamiento"
            options={treatments.map((tr) => ({ value: tr.id, label: tr.name }))}
            value={treatmentId ?? undefined}
            onChange={setTreatmentId}
          />
        ) : null}
        <Button size="lg" fullWidth onPress={save} loading={form.uploading} loadingLabel="Guardando…" disabled={form.uploading}>
          Guardar enlace
        </Button>
        <View style={styles.hint}>
          <Mascot pose="happy" size={32} />
          <Text style={[styles.hintText, { color: t.text.secondary }]}>Nunca guardamos contraseñas del portal.</Text>
        </View>
      </View>
    </BottomSheet>
  );
}

const styles = StyleSheet.create({
  body: { gap: spacing[4] },
  hint: { flexDirection: "row", alignItems: "center", gap: spacing[3] },
  hintText: { flex: 1, fontSize: 13, lineHeight: 18, fontFamily: nativeFont("body", 400) },
});

