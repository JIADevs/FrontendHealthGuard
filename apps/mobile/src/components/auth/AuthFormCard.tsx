import type { ReactNode } from "react";
import { useMemo } from "react";
import { View, Text } from "react-native";
import { useAppTheme, Typography } from "@helu/ui";
import { makeAuthStyles } from "./authStyles";

interface AuthFormCardProps {
  title: string;
  subtitle: string;
  error?: string | null;
  children: ReactNode;
}

export function AuthFormCard({ title, subtitle, error, children }: AuthFormCardProps) {
  const t = useAppTheme();
  const styles = useMemo(() => makeAuthStyles(t), [t]);

  return (
    <View style={styles.formCard}>
      <Text style={styles.cardTitle}>{title}</Text>
      <Text style={styles.cardSubtitle}>{subtitle}</Text>

      {!!error && (
        <View style={styles.errorBox}>
          <Typography variant="bodySm" color="error" align="center">
            {error}
          </Typography>
        </View>
      )}

      {children}
    </View>
  );
}
