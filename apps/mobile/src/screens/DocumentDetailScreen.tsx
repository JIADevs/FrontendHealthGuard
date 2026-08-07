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
  DocumentDetailOpenExternal,
  DocumentDetailActions,
  DocumentDetailPortalCard,
} from "../components/documents";
import { useShareFlow } from "../components/share";
import { useDocumentDetail } from "../hooks/useDocumentDetail";
import { useOpenDocumentExternal } from "../hooks/useOpenDocumentExternal";
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
    isLink,
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

  const shareFlow = useShareFlow(navigation);
  const { openDocument, opening } = useOpenDocumentExternal();

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
        {isLink ? (
          <DocumentDetailPortalCard
            portalUrl={document.portalUrl ?? ""}
            portalUsername={document.portalUsername}
            portalPassword={document.portalPassword}
            description={document.description}
          />
        ) : (
          <>
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
            <DocumentDetailOpenExternal
              onPress={() =>
                void openDocument({
                  url: signedUrl ?? "",
                  title: document.title,
                  format: document.format ?? "",
                  docFormat,
                })
              }
              disabled={!signedUrl || signedUrlLoading}
              loading={opening}
            />
          </>
        )}
        <DocumentDetailActions
          onShare={() => shareFlow.openConfigureDocument(document, "Documento")}
          onEdit={() => navigation.navigate("DocumentEdit", { id: document.id })}
          onDelete={handleDelete}
          deleteLoading={deletePending}
        />
      </ScrollView>

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
