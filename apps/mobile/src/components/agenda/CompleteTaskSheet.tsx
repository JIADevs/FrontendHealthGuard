import { useMemo, useRef, useState } from "react";
import { View, Text, StyleSheet } from "react-native";
import { CheckSquare } from "lucide-react-native";
import {
  useBackpacksQuery,
  useCompleteAgendaTaskMutation,
  useDocumentsQuery,
} from "@helu/api/hooks";
import {
  BottomSheet,
  Button,
  ChoiceChips,
  IconTile,
  TextField,
  nativeFont,
  spacing,
  useAppTheme,
  type BottomSheetHandle,
} from "@helu/ui";
import type { ThemeContextValue } from "@helu/ui";
import { notify } from "../../lib/notify";
import { haptics } from "../../lib/haptics";

const MAX_OPTIONS = 12;

export interface CompleteTaskSheetProps {
  taskId: string;
  taskTitle: string;
  onClose: () => void;
}

/**
 * «Completar tarea» (mockup «Detalle de tarea»: «Completar abre un resultado opcional»). Everything
 * is optional: a comment and the documents or backpacks the task produced. Brand accent, like every
 * agenda task (inicio-agenda.md · Tareas de agenda).
 */
export function CompleteTaskSheet({ taskId, taskTitle, onClose }: CompleteTaskSheetProps) {
  const t = useAppTheme();
  const styles = useMemo(() => makeStyles(t), [t]);
  const sheetRef = useRef<BottomSheetHandle>(null);

  const [comment, setComment] = useState("");
  const [documentIds, setDocumentIds] = useState<string[]>([]);
  const [backpackIds, setBackpackIds] = useState<string[]>([]);

  const completeMut = useCompleteAgendaTaskMutation();
  const docs = useDocumentsQuery("", 1, MAX_OPTIONS);
  const backpacks = useBackpacksQuery("", MAX_OPTIONS);

  const docOptions = (docs.data?.items ?? []).map((d) => ({ value: d.id, label: d.title }));
  const backpackOptions = (backpacks.data?.items ?? []).map((b) => ({ value: b.id, label: b.name }));
  const dirty = comment.trim() !== "" || documentIds.length > 0 || backpackIds.length > 0;

  // v2.14: completing a task is low risk and reversible (movimiento §8): the task shows as done at once
  // (optimistic in @helu/api), the sheet closes and the toast shows on tap. On error the task rolls
  // back and the error toast offers «Reintentar». mutateAsync: the sheet unmounts right away.
  const handleComplete = () => {
    const result = {
      resultComment: comment.trim() || null,
      resultDocumentIds: documentIds,
      resultBackpackIds: backpackIds,
    };
    const save = (): void => {
      completeMut.mutateAsync({ id: taskId, result }).catch(() => {
        haptics.error();
        notify({
          tone: "error",
          message: "No se pudo completar la tarea",
          description: "Revisa tu conexión e intenta de nuevo.",
          action: { label: "Reintentar", onPress: save },
        });
      });
    };
    haptics.success();
    save();
    sheetRef.current?.close(onClose) ?? onClose();
    notify({ message: "Tarea completada", description: taskTitle });
  };

  return (
    <BottomSheet
      ref={sheetRef}
      eyebrow="TAREA"
      title="Completar tarea"
      icon={<IconTile tone="brand" size="lg" round icon={<CheckSquare size={24} strokeWidth={2.4} color={t.brand.text} />} />}
      dirty={dirty}
      onClose={onClose}
    >
      <View style={styles.fields}>
        <Text style={styles.intro}>{taskTitle}</Text>

        <TextField
          label="Comentario (opcional)"
          value={comment}
          onChange={setComment}
          placeholder="Ej: Me entregaron la fórmula completa"
          multiline
          numberOfLines={3}
        />

        {docOptions.length > 0 ? (
          <View style={styles.group}>
            <Text style={styles.label}>Documentos obtenidos (opcional)</Text>
            <ChoiceChips multiple options={docOptions} value={documentIds} onChange={setDocumentIds} />
          </View>
        ) : null}

        {backpackOptions.length > 0 ? (
          <View style={styles.group}>
            <Text style={styles.label}>Mochilas (opcional)</Text>
            <ChoiceChips multiple options={backpackOptions} value={backpackIds} onChange={setBackpackIds} />
          </View>
        ) : null}
      </View>

      <View style={styles.actions}>
        <Button
          variant="success"
          size="lg"
          fullWidth
          onPress={handleComplete}
          disabled={completeMut.isPending}
        >
          Completar tarea
        </Button>
      </View>
    </BottomSheet>
  );
}

function makeStyles(t: ThemeContextValue) {
  return StyleSheet.create({
    fields: { gap: spacing[4] },
    group: { gap: spacing[2] },
    intro: { fontSize: 15, fontFamily: nativeFont("body", 400), color: t.text.secondary },
    // MASTER «Campo»: etiqueta visible, Nunito 800 13
    label: { fontSize: 13, fontFamily: nativeFont("heading", 800), color: t.text.primary },
    actions: { marginTop: spacing[5] },
  });
}
