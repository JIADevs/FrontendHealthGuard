import { Text } from "react-native";
import { FileText } from "lucide-react-native";
import type { Document } from "@helu/api";
import { formatShortDay, nativeFont, useAppTheme } from "@helu/ui";
import { HomeCard } from "./HomeCard";
import { HomeRow } from "./HomeRow";
import { SeeAllLink } from "./SeeAllLink";
import { useManagingSomeone } from "./useManagingSomeone";
import { documentTypeLabel } from "../documents/documentCategories";

/** «28 oct · Orden» (mockup «Documentos recientes»): fecha sin día de la semana y el tipo. */
function documentMeta(d: Document): string {
  const date = formatShortDay(d.uploadedAt).split(" ").slice(1).join(" ");
  return [date, documentTypeLabel(d.documentType?.name)].filter(Boolean).join(" · ");
}

/** «Documentos recientes» (bloque 7). */
export function RecentDocumentsCard({
  documents,
  onOpen,
  onSeeAll,
}: {
  documents: Document[];
  onOpen: (doc: Document) => void;
  onSeeAll: () => void;
}) {
  const other = useManagingSomeone();
  const t = useAppTheme();
  return (
    <HomeCard title="Documentos recientes" right={<SeeAllLink label="Ver todos" onPress={onSeeAll} />}>
      {documents.length === 0 ? (
        <Text style={{ fontSize: 14, lineHeight: 20, fontFamily: nativeFont("body", 400), color: t.text.secondary }}>
          {other ? "Aún no tiene documentos." : "Aún no tienes documentos."}
        </Text>
      ) : (
        documents.map((d) => (
          <HomeRow
            key={d.id}
            tone="document"
            icon={<FileText size={19} strokeWidth={2.2} color={t.accent.docFg} />}
            title={d.title}
            meta={documentMeta(d)}
            onPress={() => onOpen(d)}
          />
        ))
      )}
    </HomeCard>
  );
}
