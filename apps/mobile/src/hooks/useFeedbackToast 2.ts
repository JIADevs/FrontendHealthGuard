import { useState, useCallback } from "react";
import type { FeedbackType } from "../components/FeedbackToast";

interface ToastState {
  visible: boolean;
  type: FeedbackType;
  message: string;
  actionText?: string;
  onAction?: () => void;
}

export function useFeedbackToast() {
  const [toast, setToast] = useState<ToastState>({
    visible: false,
    type: "info",
    message: "",
  });

  const showToast = useCallback(
    (
      type: FeedbackType,
      message: string,
      options?: {
        actionText?: string;
        onAction?: () => void;
      }
    ) => {
      setToast({
        visible: true,
        type,
        message,
        actionText: options?.actionText,
        onAction: options?.onAction,
      });
    },
    []
  );

  const hideToast = useCallback(() => {
    setToast((prev) => ({ ...prev, visible: false }));
  }, []);

  const showSuccess = useCallback(
    (message: string, options?: { actionText?: string; onAction?: () => void }) => {
      showToast("success", message, options);
    },
    [showToast]
  );

  const showError = useCallback(
    (message: string, options?: { actionText?: string; onAction?: () => void }) => {
      showToast("error", message, options);
    },
    [showToast]
  );

  const showWarning = useCallback(
    (message: string, options?: { actionText?: string; onAction?: () => void }) => {
      showToast("warning", message, options);
    },
    [showToast]
  );

  const showInfo = useCallback(
    (message: string, options?: { actionText?: string; onAction?: () => void }) => {
      showToast("info", message, options);
    },
    [showToast]
  );

  return {
    toast,
    showToast,
    hideToast,
    showSuccess,
    showError,
    showWarning,
    showInfo,
  };
}