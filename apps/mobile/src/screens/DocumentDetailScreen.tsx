import { useLayoutEffect, useMemo } from "react";
import { View, ScrollView, StyleSheet } from "react-native";
import { useRoute, useNavigation } from "@react-navigation/native";
import type { NativeStackNavigationProp } from "@react-navigation/native-stack";
import type { RootStackParamList } from "../navigation/RootNavigator";
import { Typography, Spinner, spacing, useAppTheme } from "@helu/ui";
import type { ThemeContextValue } from "@helu/ui";
import {
  DocumentDetailHeader,
  DocumentDetailMetaCard,
  DocumentDetailTags,
  DocumentDetailPreview,
  DocumentDetailActions,
  DocumentViewerModal,
} from "../components/documents";
import { useDocumentDetail } from "../hooks/useDocumentDetail";

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
    sharePending,
    deletePending,
    viewerOpen,
    closeViewer,
    handleOpen,
    handleShareLink,
    handleDelete,
  } = useDocumentDetail(id);

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
        />
        <DocumentDetailActions
          onOpen={handleOpen}
          onShare={handleShareLink}
          onEdit={() => navigation.navigate("DocumentEdit", { id: document.id })}
          onDelete={handleDelete}
          openDisabled={!signedUrl}
          openLoading={signedUrlLoading}
          shareDisabled={sharePending}
          shareLoading={sharePending}
          deleteLoading={deletePending}
        />
      </ScrollView>

      <DocumentViewerModal
        visible={viewerOpen}
        title={document.title}
        uri={signedUrl}
        format={docFormat}
        loading={signedUrlLoading}
        onClose={closeViewer}
      />
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
