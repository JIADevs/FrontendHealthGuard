import { StyleSheet, View } from "react-native";
import QRCode from "react-native-qrcode-svg";
import { colors } from "@helu/ui";
import { resolveExpoReachableUrl } from "../../utils/shareLinks";

/**
 * The share QR, drawn on the phone (JIADevs/BackendHealthGuard#18): the link carries the access
 * token, so it is never sent to a QR service. Always dark on white, also in dark mode, so any
 * camera reads it. Kit: 16 px white frame, radius 20, 1 px border.
 */
export function ShareQrCode({ shareUrl, size = 200 }: { shareUrl: string; size?: number }) {
  return (
    <View style={styles.frame} accessible accessibilityRole="image" accessibilityLabel="Código QR del enlace">
      <QRCode value={resolveExpoReachableUrl(shareUrl)} size={size} color={colors.slate[900]} backgroundColor={colors.white} ecl="M" />
    </View>
  );
}

const styles = StyleSheet.create({
  frame: {
    padding: 16,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: colors.slate[200],
    backgroundColor: colors.white,
    alignSelf: "center",
  },
});
