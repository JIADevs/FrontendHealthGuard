import type { ReactNode } from "react";
import { useMemo } from "react";
import {
  View,
  KeyboardAvoidingView,
  ScrollView,
  StatusBar,
  Platform,
} from "react-native";
import { LinearGradient } from "expo-linear-gradient";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { colors, palette, spacing, useAppTheme } from "@helu/ui";
import { AnimatedLoginBackground } from "../AnimatedLoginBackground";
import { makeAuthStyles } from "./authStyles";

interface AuthScreenLayoutProps {
  children: ReactNode;
}

export function AuthScreenLayout({ children }: AuthScreenLayoutProps) {
  const t = useAppTheme();
  const styles = useMemo(() => makeAuthStyles(t), [t]);
  const insets = useSafeAreaInsets();

  return (
    <View style={styles.screen}>
      <StatusBar barStyle="dark-content" />

      <LinearGradient
        colors={[palette.brand[50], colors.white]}
        locations={[0, 0.5]}
        style={styles.bgGradient}
      />

      <AnimatedLoginBackground />

      <KeyboardAvoidingView
        style={{ flex: 1 }}
        behavior={Platform.OS === "ios" ? "padding" : undefined}
      >
        <ScrollView
          contentContainerStyle={[
            styles.scrollContent,
            { paddingTop: insets.top + spacing[6] },
          ]}
          keyboardShouldPersistTaps="handled"
          showsVerticalScrollIndicator={false}
        >
          {children}
        </ScrollView>
      </KeyboardAvoidingView>
    </View>
  );
}
