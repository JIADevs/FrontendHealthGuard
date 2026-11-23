import { Trash2 } from "lucide-react-native";
import { ConfirmModal, useAppTheme } from "@helu/ui";

/**
 * Deleting a backpack keeps its confirmation because it also turns off its shared links (#46,
 * decision 4). After «Eliminar mochila», the card collapses and the toast offers «Deshacer».
 * The centered dialog (with icon) is the one that stacks its buttons: the two labels do not fit
 * side by side on a 390 pt phone, and the plain dialog ignores `actionsLayout`.
 */
export function BackpackDeleteConfirm({ name, onConfirm, onCancel }: { name: string; onConfirm: () => void; onCancel: () => void }) {
  const t = useAppTheme();
  return (
    <ConfirmModal
      title="¿Eliminar mochila?"
      message={`«${name}» se elimina y sus enlaces compartidos dejan de funcionar. Tus documentos siguen en Documentos.`}
      keepLabel="Mantener mochila"
      confirmLabel="Eliminar mochila"
      confirmVariant="danger"
      icon={<Trash2 size={26} color={t.status.errorFg} strokeWidth={2.25} />}
      iconTone="danger"
      actionsLayout="stacked"
      onConfirm={onConfirm}
      onCancel={onCancel}
    />
  );
}
