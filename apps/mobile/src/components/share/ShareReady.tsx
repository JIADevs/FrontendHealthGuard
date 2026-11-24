import { useEffect, useMemo, useRef, useState } from "react";
import { Pressable, ScrollView, Share, StyleSheet, Text, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import * as Clipboard from "expo-clipboard";
import { Check, Clock, Copy, Eye, Link2, Share2, X } from "lucide-react-native";
import type { ShareResourceType } from "@helu/api";
import { useRevokeShareMutation, useShareHistoryQuery } from "@helu/api/hooks";
import { Button, Chip, ConfirmModal, DangerLink, fontSize, nativeFont, radii, spacing, useAppTheme, type ThemeContextValue } from "@helu/ui";
import { ScreenHeader } from "../ScreenHeader";
import { documentCountLabel } from "../backpacks/backpackCopy";
import { notify } from "../../lib/notify";
import { resolveExpoReachableUrl } from "../../utils/shareLinks";
import { ShareQrCode } from "./ShareQrCode";
import { expiresChipLabel } from "./shareUtils";

export interface ShareReadyProps {
  shareUrl: string;
  title: string;
  resourceType: ShareResourceType;
  expiresAt: string | null;
  documentCount: number;
  /** `created`: step 3 right after «Generar enlace» (toast, «Revocar enlace»). `view`: «Mostrar QR» from a link. */
  mode: "created" | "view";
  fromStepOne?: boolean;
  onClose: () => void;
}

const COPIED_MS = 1500;

/**
 * Mockup «Enlace listo · QR» (paso 3 de 3): the QR drawn on the phone, «Escanea para ver N
 * documentos» with the expiry and «Solo ver» chips, the link with «Copiar», «Compartir» and
 * «Copiar enlace», and «Revocar enlace» as a red link away from them.
 */
export function ShareReady({ shareUrl, title, resourceType, expiresAt, documentCount, mode, fromStepOne, onClose }: ShareReadyProps) {
  const t = useAppTheme();
  const styles = useMemo(() => makeStyles(t), [t]);
  const url = resolveExpoReachableUrl(shareUrl);
  const [copied, setCopied] = useState(false);
  const [confirmRevoke, setConfirmRevoke] = useState(false);
  const shares = useShareHistoryQuery();
  const revoke = useRevokeShareMutation();
  const link = shares.data?.find((l) => l.shareUrl === shareUrl);

  const announced = useRef(false);
  useEffect(() => {
    if (mode !== "created" || announced.current) return;
    announced.current = true;
    notify({ message: "Enlace listo", description: "Compártelo o muestra el QR." });
  }, [mode]);

  useEffect(() => {
    if (!copied) return;
    const id = setTimeout(() => setCopied(false), COPIED_MS);
    return () => clearTimeout(id);
  }, [copied]);

  const copy = async () => {
    try {
      await Clipboard.setStringAsync(url);
      setCopied(true);
      notify({ message: "Enlace copiado" });
    } catch {
      notify({ tone: "error", message: "No se pudo copiar el enlace" });
    }
  };

  const share = async () => {
    try {
      await Share.share({ url, message: `«${title}» en Helu: ${url}` });
    } catch {
      // Cancelled.
    }
  };

  // Revoking waits for the server (#35): the link must really stop working before we say so.
  const doRevoke = () => {
    if (!link) return;
    revoke.mutate(
      { linkId: link.linkId, resourceType: link.resourceType },
      {
        onSuccess: () => {
          setConfirmRevoke(false);
          notify({ message: "Acceso revocado", description: "El enlace ya no funciona." });
          onClose();
        },
        onError: () => notify({ tone: "error", message: "No se pudo revocar", description: "Revisa tu conexión e intenta de nuevo." }),
      },
    );
  };

  const count = resourceType === "document" ? 1 : documentCount;

  return (
    <SafeAreaView style={styles.container} edges={["top", "bottom"]}>
      <ScreenHeader
        title={mode === "created" ? "Enlace listo" : "Código QR"}
        subtitle={mode === "created" && fromStepOne ? "Paso 3 de 3" : title}
        onBack={onClose}
      />
      <ScrollView contentContainerStyle={styles.content}>
        <View style={styles.card}>
          <View style={styles.qrBlock}>
            <ShareQrCode shareUrl={shareUrl} />
            <Text style={styles.h3}>Escanea para ver {documentCountLabel(count)}</Text>
            <View style={styles.chips}>
              <Chip label={expiresChipLabel(expiresAt)} tone="warning" icon={<Clock size={12} color={t.status.warningFg} />} />
              <Chip label="Solo ver" tone="neutral" icon={<Eye size={12} color={t.text.onMuted} />} />
            </View>
          </View>
          <View style={styles.linkBox}>
            <Link2 size={16} color={t.brand.solid} />
            <Text style={styles.linkText} numberOfLines={1} ellipsizeMode="middle" selectable>
              {url.replace(/^https?:\/\//, "")}
            </Text>
            <Pressable onPress={() => void copy()} hitSlop={12} accessibilityRole="button" accessibilityLabel="Copiar enlace">
              <Text style={styles.link}>{copied ? "Copiado" : "Copiar"}</Text>
            </Pressable>
          </View>
        </View>

        <View style={styles.actions}>
          <View style={{ flex: 1 }}>
            <Button fullWidth icon={<Share2 size={16} strokeWidth={2.2} color={t.text.onSolid} />} onPress={() => void share()}>
              Compartir
            </Button>
          </View>
          <View style={{ flex: 1 }}>
            <Button
              variant="secondary"
              fullWidth
              icon={copied ? <Check size={16} strokeWidth={3} color={t.brand.text} /> : <Copy size={16} color={t.brand.text} />}
              onPress={() => void copy()}
            >
              {copied ? "Copiado" : "Copiar enlace"}
            </Button>
          </View>
        </View>

        {mode === "created" ? (
          <View style={styles.danger}>
            <DangerLink
              label="Revocar enlace"
              icon={<X size={16} strokeWidth={2.4} color={t.status.errorFg} />}
              onPress={() => setConfirmRevoke(true)}
              disabled={!link}
            />
          </View>
        ) : null}
      </ScrollView>

      {confirmRevoke ? (
        <ConfirmModal
          title="¿Revocar el enlace?"
          message="Quien lo tenga ya no podrá abrir los documentos. Puedes crear uno nuevo cuando quieras."
          keepLabel="Mantener"
          confirmLabel="Revocar"
          confirmVariant="danger"
          loading={revoke.isPending}
          onConfirm={doRevoke}
          onCancel={() => setConfirmRevoke(false)}
        />
      ) : null}
    </SafeAreaView>
  );
}

function makeStyles(t: ThemeContextValue) {
  return StyleSheet.create({
    container: { flex: 1, backgroundColor: t.surface.bg },
    content: { padding: spacing[4], paddingTop: spacing[6], gap: spacing[4], paddingBottom: spacing[10] },
    card: {
      backgroundColor: t.surface.bgCard,
      borderColor: t.border.default,
      borderRadius: radii.card,
      borderWidth: 1,
      borderBottomWidth: 4,
      padding: spacing[4],
      gap: spacing[4],
    },
    qrBlock: { alignItems: "center", gap: 10 },
    h3: { fontSize: 17, fontFamily: nativeFont("heading", 800), color: t.text.primary, textAlign: "center" },
    chips: { flexDirection: "row", gap: 6 },
    linkBox: {
      flexDirection: "row",
      alignItems: "center",
      gap: spacing[2],
      minHeight: 48,
      paddingHorizontal: 14,
      borderRadius: 14,
      backgroundColor: t.surface.muted,
    },
    linkText: { flex: 1, fontSize: fontSize.sm, fontFamily: nativeFont("body", 500), color: t.text.primary },
    link: { fontSize: 13, fontFamily: nativeFont("heading", 800), color: t.brand.text },
    actions: { flexDirection: "row", gap: 10 },
    danger: { alignItems: "center", marginTop: spacing[2] },
  });
}
