import { useMemo } from "react";
import { Text, TouchableOpacity } from "react-native";
import { LinearGradient } from "expo-linear-gradient";
import { ArrowRight } from "lucide-react-native";
import { colors, palette, useAppTheme } from "@helu/ui";
import { makeAuthStyles } from "./authStyles";

interface AuthSubmitButtonProps {
  label: string;
  loadingLabel: string;
  loading: boolean;
  disabled: boolean;
  onPress: () => void;
}

export function AuthSubmitButton({
  label,
  loadingLabel,
  loading,
  disabled,
  onPress,
}: AuthSubmitButtonProps) {
  const t = useAppTheme();
  const styles = useMemo(() => makeAuthStyles(t), [t]);

  return (
    <TouchableOpacity
      style={[styles.submitBtn, disabled && styles.submitBtnDisabled]}
      activeOpacity={0.85}
      onPress={onPress}
      disabled={disabled}
    >
      <LinearGradient
        colors={[palette.brand[400], palette.brand[500]]}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 0 }}
        style={styles.submitGradient}
      >
        <Text style={styles.submitText}>
          {loading ? loadingLabel : label}
        </Text>
        {!loading && <ArrowRight size={20} color={colors.white} />}
      </LinearGradient>
    </TouchableOpacity>
  );
}
