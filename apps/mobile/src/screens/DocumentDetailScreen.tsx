import { useLayoutEffect, useMemo } from "react";
import { View, ScrollView, StyleSheet } from "react-native";
import { useRoute, useNavigation } from "@react-navigation/native";
import type { NativeStackNavigationProp } from "@react-navigation/native-stack";
import { Trash2 } from "lucide-react-native";
import type { RootStackParamList } from "../navigation/RootNavigator";
import { Typography, Spinner, ConfirmModal, palette, spacing, useAppTheme } from "@helu/ui";
import type { ThemeContextValue } from "@helu/ui";
import {
  DocumentDetailHeader,
  DocumentDetailMetaCard,
  DocumentDetailTags,
  DocumentDetailPreview,
  DocumentDetailActions,
  ShareDocumentModal,
} from "../components/documents";
import { useDocumentDetail } from "../hooks/useDocumentDetail";
import { useDocumentShareModal } from "../hooks/useDocumentShareModal";
import { getDocumentPageCount } from "../components/documents/utils/documentDetailMeta";

type RouteParams = {
  id: string;
  title?: string;
};

export function DocumentDetailScreen() {
  const t = useAppTheme();
  const styles = useMemo(() => makeStyles(t), [t]);

  const route = useRoute();
  const navigation = useNavigation<NativeStackNavigationProp<RootStackParamList>>();
  const { id } = (route.params ?? {}) as RouteParams;

  const {
    document,
    theme,
    subtitle,
    detailTags,
    isLoading,
    signedUrl,
    signedUrlLoading,
    isImage,
    docFormat,
    deletePending,
    deleteTarget,
    cancelDelete,
    confirmDelete,
    handleDelete,
  } = useDocumentDetail(id);

  const share = useDocumentShareModal();

  useLayoutEffect(() => {
    navigation.setOptions({ title: "" });
  }, [navigation]);

  if (!id) {
    return (
      <View style={styles.center}>
        <Typography variant="body" color="error">
          Documento no encontrado.
        </Typography>
      </View>
    );
  }

  if (isLoading || !theme) {
    return (
      <View style={styles.center}>
        <Spinner size="lg" />
      </View>
    );
  }

  if (!document) {
    return (
      <View style={styles.center}>
        <Typography variant="body" color="error">
          No se pudo cargar el documento.
        </Typography>
      </View>
    );
  }

  const pageCount = getDocumentPageCount(document);

  return (
    <>
      <ScrollView
        style={styles.container}
        contentContainerStyle={styles.content}
        showsVerticalScrollIndicator={false}
      >
        <DocumentDetailHeader document={document} theme={theme} subtitle={subtitle} />
        <DocumentDetailTags tags={detailTags} theme={theme} />
        <DocumentDetailMetaCard document={document} />
        <DocumentDetailPreview
          title={document.title}
          description={document.description}
          documentDate={document.documentDate ?? document.uploadedAt}
          signedUrl={signedUrl}
          isImage={isImage}
          docFormat={docFormat}
          isLoading={signedUrlLoading}
          pageCount={pageCount}
        />
        <DocumentDetailActions
          onShare={() => share.openShare(document)}
          onEdit={() => navigation.navigate("DocumentEdit", { id: document.id })}
          onDelete={handleDelete}
          shareDisabled={share.isPreparing && share.shareTarget?.id === document.id}
          shareLoading={share.isSharePendingFor(document.id)}
          deleteLoading={deletePending}
        />
      </ScrollView>

      {share.shareTarget && (
        <ShareDocumentModal
          shareUrl={share.shareUrl}
          isPreparing={share.isPreparing}
          isCopying={share.isCopying}
          onClose={share.closeShare}
          onCopyLink={() => void share.copyLink()}
          onWhatsApp={() => void share.shareWhatsApp()}
          onEmail={() => void share.shareEmail()}
          onLink={() => void share.shareLink()}
          onMore={() => void share.shareMore()}
        />
      )}

      {deleteTarget && (
        <ConfirmModal
          title="¿Eliminar documento?"
          message="Esta acción no se puede deshacer."
          confirmLabel="Eliminar"
          loading={deletePending}
          onConfirm={confirmDelete}
          onCancel={cancelDelete}
          icon={<Trash2 size={26} color={palette.status.error[500]} strokeWidth={2.25} />}
          iconTone="danger"
        />
      )}
    </>
  );
}

function makeStyles(t: ThemeContextValue) {
  return StyleSheet.create({
    container: {
      flex: 1,
      backgroundColor: t.surface.bg,
    },
    content: {
      padding: spacing[5],
      gap: spacing[4],
      paddingBottom: spacing[10],
    },
    center: {
      flex: 1,
      alignItems: "center",
      justifyContent: "center",
      padding: spacing[6],
      backgroundColor: t.surface.bg,
    },
  });
}
