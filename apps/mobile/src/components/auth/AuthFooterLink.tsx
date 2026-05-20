import { useMemo } from "react";
import { View, Text, TouchableOpacity } from "react-native";
import { useAppTheme } from "@helu/ui";
import { makeAuthStyles } from "./authStyles";

interface AuthFooterLinkProps {
  text: string;
  linkText: string;
  onPress: () => void;
}

export function AuthFooterLink({ text, linkText, onPress }: AuthFooterLinkProps) {
  const t = useAppTheme();
  const styles = useMemo(() => makeAuthStyles(t), [t]);

  return (
    <View style={styles.footer}>
      <Text style={styles.footerText}>{text}</Text>
      <TouchableOpacity activeOpacity={0.7} onPress={onPress}>
        <Text style={styles.footerLink}>{linkText}</Text>
      </TouchableOpacity>
    </View>
  );
}
