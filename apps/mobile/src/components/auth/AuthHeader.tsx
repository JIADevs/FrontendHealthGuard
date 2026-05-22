import { useMemo } from "react";
import { View, Text, Image } from "react-native";
import { useAppTheme } from "@helu/ui";
import { makeAuthStyles } from "./authStyles";

// eslint-disable-next-line @typescript-eslint/no-var-requires
const heluLogo = require("../../../assets/helu-logo.png");

interface AuthHeaderProps {
  title: string;
  subtitle: string;
}

export function AuthHeader({ title, subtitle }: AuthHeaderProps) {
  const t = useAppTheme();
  const styles = useMemo(() => makeAuthStyles(t), [t]);

  return (
    <View style={styles.header}>
      <Image source={heluLogo} style={styles.logo} resizeMode="contain" />
      <Text style={styles.brandTitle}>{title}</Text>
      <Text style={styles.brandSubtitle}>{subtitle}</Text>
    </View>
  );
}
