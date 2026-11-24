import { useRef, useState } from "react";
import { StyleSheet, View } from "react-native";
import { Pencil } from "lucide-react-native";
import { isApiError, useUpdateMissionMutation, type Mission } from "@helu/api";
import { BottomSheet, Button, IconTile, TextField, spacing, useAppTheme, type BottomSheetHandle } from "@helu/ui";
import { notify } from "../../lib/notify";

/** «Editar nombre» (RF-18): the mission title. Waits for the server (button in loading state). */
export function MissionEditSheet({ mission, onClose }: { mission: Mission; onClose: () => void }) {
  const t = useAppTheme();
  const ref = useRef<BottomSheetHandle>(null);
  const update = useUpdateMissionMutation();
  const [title, setTitle] = useState(mission.title);
  const [error, setError] = useState<string | undefined>();
  const trimmed = title.trim();

  const save = () => {
    if (!trimmed) return setError("Escribe un nombre para tu misión.");
    if (trimmed === mission.title) return ref.current?.close();
    update.mutate(
      { id: mission.id, payload: { title: trimmed } },
      {
        onSuccess: () => ref.current?.close(() => notify({ message: "Misión actualizada", description: trimmed })),
        onError: (err) =>
          notify({
            tone: "error",
            message: "No se pudo guardar",
            description: isApiError(err) ? "Intenta de nuevo en un momento." : "Revisa tu conexión e intenta de nuevo.",
            action: { label: "Reintentar", onPress: save },
          }),
      },
    );
  };

  return (
    <BottomSheet
      ref={ref}
      eyebrow="MISIÓN"
      title="Editar nombre"
      icon={<IconTile round size="lg" tone="brand" icon={<Pencil size={22} strokeWidth={2.2} color={t.brand.text} />} />}
      onClose={onClose}
    >
      <View style={styles.body}>
        <TextField
          label="Nombre de la misión"
          value={title}
          onChange={(v) => {
            setTitle(v);
            if (error) setError(undefined);
          }}
          error={error}
          autoCapitalize="sentences"
        />
        <Button variant="primary" fullWidth loading={update.isPending} loadingLabel="Guardando…" onPress={save}>
          Guardar
        </Button>
      </View>
    </BottomSheet>
  );
}

const styles = StyleSheet.create({
  body: { gap: spacing[4], paddingBottom: spacing[2] },
});
