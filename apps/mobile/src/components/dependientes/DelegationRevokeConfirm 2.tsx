import { UserX } from "lucide-react-native";
import { ConfirmModal, palette } from "@helu/ui";

interface DelegationRevokeConfirmProps {
    visible: boolean;
    title: string;
    message: string;
    confirmLabel?: string;
    loading?: boolean;
    actionsLayout?: "row" | "stacked";
    onConfirm: () => void;
    onCancel: () => void;
}

export function DelegationRevokeConfirm({
    visible,
    title,
    message,
    confirmLabel = "Revocar",
    loading = false,
    actionsLayout = "row",
    onConfirm,
    onCancel,
}: DelegationRevokeConfirmProps) {
    if (!visible) return null;

    return (
        <ConfirmModal
            title={title}
            message={message}
            confirmLabel={confirmLabel}
            confirmVariant="danger"
            loading={loading}
            onConfirm={onConfirm}
            onCancel={onCancel}
            icon={<UserX size={26} color={palette.status.error[500]} strokeWidth={2.25} />}
            iconTone="danger"
            actionsLayout={actionsLayout}
        />
    );
}
