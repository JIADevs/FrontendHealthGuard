import { useState, useMemo } from "react";
import { View, Text, TextInput, TouchableOpacity } from "react-native";
import type { TextInputProps } from "react-native";
import { Eye, EyeOff } from "lucide-react-native";
import type { LucideIcon } from "lucide-react-native";
import { colors, palette, useAppTheme } from "@helu/ui";
import { makeAuthStyles } from "./authStyles";

interface AuthTextFieldProps {
  label: string;
  icon: LucideIcon;
  value: string;
  onChangeText: (text: string) => void;
  placeholder?: string;
  secure?: boolean;
  keyboardType?: TextInputProps["keyboardType"];
  autoCapitalize?: TextInputProps["autoCapitalize"];
  autoComplete?: TextInputProps["autoComplete"];
}

export function AuthTextField({
  label,
  icon: Icon,
  value,
  onChangeText,
  placeholder,
  secure = false,
  keyboardType,
  autoCapitalize,
  autoComplete,
}: AuthTextFieldProps) {
  const t = useAppTheme();
  const styles = useMemo(() => makeAuthStyles(t), [t]);
  const [showPassword, setShowPassword] = useState(false);

  return (
    <View style={styles.fieldGroup}>
      <Text style={styles.fieldLabel}>{label}</Text>
      <View style={styles.inputContainer}>
        <Icon size={18} color={palette.brand[400]} style={styles.inputIcon} />
        <TextInput
          style={styles.textInput}
          placeholder={placeholder}
          placeholderTextColor={t.text.muted}
          value={value}
          onChangeText={onChangeText}
          secureTextEntry={secure && !showPassword}
          keyboardType={keyboardType}
          autoCapitalize={autoCapitalize}
          autoComplete={autoComplete}
        />
        {secure && (
          <TouchableOpacity
            onPress={() => setShowPassword(!showPassword)}
            style={styles.eyeButton}
            activeOpacity={0.7}
          >
            {showPassword ? (
              <EyeOff size={18} color={colors.gray[400]} />
            ) : (
              <Eye size={18} color={colors.gray[400]} />
            )}
          </TouchableOpacity>
        )}
      </View>
    </View>
  );
}
