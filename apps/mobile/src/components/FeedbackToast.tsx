import { View, Text, StyleSheet, TouchableOpacity, Animated } from "react-native";
import { useAppTheme, spacing } from "@helu/ui";
import type { ThemeContextValue } from "@helu/ui";
import { useMemo, useEffect, useRef } from "react";
import { CheckCircle, XCircle, AlertCircle, Info } from "lucide-react-native";

export type FeedbackType = "success" | "error" | "warning" | "info";

interface FeedbackToastProps {
  visible: boolean;
  type: FeedbackType;
  message: string;
  actionText?: string;
  onAction?: () => void;
  onDismiss?: () => void;
  duration?: number;
}

export function FeedbackToast({
  visible,
  type,
  message,
  actionText,
  onAction,
  onDismiss,
  duration = 4000,
}: FeedbackToastProps) {
  const t = useAppTheme();
  const styles = useMemo(() => makeStyles(t), [t]);
  const opacity = useRef(new Animated.Value(0)).current;
  const translateY = useRef(new Animated.Value(-100)).current;

  useEffect(() => {
    if (visible) {
      Animated.parallel([
        Animated.timing(opacity, {
          toValue: 1,
          duration: 300,
          useNativeDriver: true,
        }),
        Animated.timing(translateY, {
          toValue: 0,
          duration: 300,
          useNativeDriver: true,
        }),
      ]).start();

      if (duration > 0 && !actionText) {
        const timer = setTimeout(() => {
          handleDismiss();
        }, duration);
        return () => clearTimeout(timer);
      }
    } else {
      Animated.parallel([
        Animated.timing(opacity, {
          toValue: 0,
          duration: 200,
          useNativeDriver: true,
        }),
        Animated.timing(translateY, {
          toValue: -100,
          duration: 200,
          useNativeDriver: true,
        }),
      ]).start();
    }
  }, [visible, duration, actionText]);

  const handleDismiss = () => {
    Animated.parallel([
      Animated.timing(opacity, {
        toValue: 0,
        duration: 200,
        useNativeDriver: true,
      }),
      Animated.timing(translateY, {
        toValue: -100,
        duration: 200,
        useNativeDriver: true,
      }),
    ]).start(() => {
      onDismiss?.();
    });
  };

  if (!visible) return null;

  const getIcon = () => {
    const iconSize = 20;
    const iconColor = "#FFFFFF";

    switch (type) {
      case "success":
        return <CheckCircle size={iconSize} color={iconColor} />;
      case "error":
        return <XCircle size={iconSize} color={iconColor} />;
      case "warning":
        return <AlertCircle size={iconSize} color={iconColor} />;
      case "info":
        return <Info size={iconSize} color={iconColor} />;
    }
  };

  const getBackgroundColor = () => {
    switch (type) {
      case "success":
        return "#10B981";
      case "error":
        return "#EF4444";
      case "warning":
        return "#F59E0B";
      case "info":
        return "#3B82F6";
    }
  };

  return (
    <Animated.View
      style={[
        styles.container,
        {
          opacity,
          transform: [{ translateY }],
          backgroundColor: getBackgroundColor(),
        },
      ]}
    >
      <View style={styles.iconContainer}>{getIcon()}</View>

      <Text style={styles.message} numberOfLines={2}>
        {message}
      </Text>

      {actionText && onAction && (
        <TouchableOpacity onPress={onAction} style={styles.actionButton}>
          <Text style={styles.actionText}>{actionText}</Text>
        </TouchableOpacity>
      )}
    </Animated.View>
  );
}

const makeStyles = (t: ThemeContextValue) =>
  StyleSheet.create({
    container: {
      position: "absolute",
      top: 50,
      left: spacing[4],
      right: spacing[4],
      flexDirection: "row",
      alignItems: "center",
      paddingVertical: spacing[3],
      paddingHorizontal: spacing[4],
      borderRadius: 12,
      shadowColor: "#000",
      shadowOffset: { width: 0, height: 4 },
      shadowOpacity: 0.3,
      shadowRadius: 8,
      elevation: 8,
      gap: spacing[3],
      zIndex: 9999,
    },
    iconContainer: {
      width: 24,
      height: 24,
      justifyContent: "center",
      alignItems: "center",
    },
    message: {
      flex: 1,
      fontSize: 14,
      fontWeight: "500",
      color: "#FFFFFF",
    },
    actionButton: {
      paddingVertical: spacing[1],
      paddingHorizontal: spacing[2],
    },
    actionText: {
      fontSize: 14,
      fontWeight: "600",
      color: "#FFFFFF",
      textDecorationLine: "underline",
    },
  });