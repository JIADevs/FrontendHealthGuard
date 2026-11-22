import { useMemo, type ReactNode } from "react";
import { Pressable, StyleSheet, Text, View } from "react-native";
import { Activity, Camera, ChevronRight, Search, Sparkles, Tag } from "lucide-react-native";
import type { Document } from "@helu/api";
import { Button, Chip, IconTile, PressableScale, nativeFont, radii, spacing, useAppTheme, type ThemeContextValue } from "@helu/ui";
import { AgendaEmpty } from "../agenda/AgendaEmpty";
import { Mascot } from "../brand";
import { CATEGORY_META, categoryOf, type DocumentCategory } from "./documentCategories";
import { documentDateLabel } from "./utils/groupDocumentsByDate";
import {
  applyClientFilters,
  hasActiveDocumentFilters,
  type DocumentListFilters,
  type TagCategoryOption,
} from "./utils/documentListFilters";

/** m9 «Documentos · vacío»: one primary action, scanning as the secondary one, and what the AI fills in. */
export function DocumentsEmpty({ onUpload, onScan }: { onUpload: () => void; onScan: () => void }) {
  const t = useAppTheme();
  return (
    <AgendaEmpty
      pose="happy"
      title="Aún no tienes documentos"
      description="Sube una orden, un resultado o una fórmula. La IA detecta el tipo, la fecha y el médico."
      actionLabel="Subir documento"
      onAction={onUpload}
      secondaryAction={{ label: "Escanear con la cámara", icon: <Camera size={17} strokeWidth={2.4} color={t.brand.text} />, onPress: onScan }}
      exampleLabel="Así lo ordena la IA"
      example={{
        tone: "ai",
        icon: <Activity size={19} strokeWidth={2.2} color={t.accent.aiFg} />,
        title: "Hemograma completo",
        meta: "15 oct · Resultado",
        trailing: <Chip label="IA" tone="ai" icon={<Sparkles size={11} color={t.accent.aiFg} />} />,
        footer: (
          <View style={{ flexDirection: "row", flexWrap: "wrap", gap: spacing[2] }}>
            <Chip label="Laboratorio Central" tone="neutral" />
            <Chip label="Chequeo anual" tone="neutral" />
          </View>
        ),
      }}
    />
  );
}

function fold(s: string): string {
  return s.normalize("NFD").replace(/[̀-ͯ]/g, "").toLowerCase();
}

function distance(a: string, b: string): number {
  const row = Array.from({ length: b.length + 1 }, (_, i) => i);
  for (let i = 1; i <= a.length; i++) {
    let prev = row[0]!;
    row[0] = i;
    for (let j = 1; j <= b.length; j++) {
      const tmp = row[j]!;
      row[j] = Math.min(row[j]! + 1, row[j - 1]! + 1, prev + (a[i - 1] === b[j - 1] ? 0 : 1));
      prev = tmp;
    }
  }
  return row[b.length]!;
}

/** A word from the user's own titles and tags that is one or two typos away from the search. */
function suggestWord(query: string, docs: Document[]): { word: string; count: number } | null {
  const q = fold(query.trim());
  if (q.length < 4) return null;
  const counts = new Map<string, { word: string; docs: Set<string> }>();
  for (const doc of docs) {
    const words = [doc.title, ...doc.customTags.map((x) => x.value)].join(" ").split(/[^\p{L}\p{N}]+/u);
    for (const w of words) {
      if (w.length < 4) continue;
      const key = fold(w);
      const entry = counts.get(key) ?? { word: w.toLowerCase(), docs: new Set<string>() };
      entry.docs.add(doc.id);
      counts.set(key, entry);
    }
  }
  let best: { word: string; count: number; d: number } | null = null;
  for (const [key, { word, docs: ids }] of counts) {
    if (key === q) continue;
    const d = distance(q, key);
    if (d > 2) continue;
    if (!best || d < best.d || (d === best.d && ids.size > best.count)) best = { word, count: ids.size, d };
  }
  return best ? { word: best.word, count: best.count } : null;
}

/**
 * m9 «Búsqueda sin resultados»: says what was searched and where, offers the spelling fix and
 * related tags or types with their counts, and keeps the way out to upload it.
 */
export function DocumentsSearchEmpty({
  query,
  allDocuments,
  tagCategories,
  onSearch,
  onPickTag,
  onPickCategory,
  onUpload,
}: {
  query: string;
  allDocuments: Document[];
  tagCategories: TagCategoryOption[];
  onSearch: (q: string) => void;
  onPickTag: (valueId: string) => void;
  onPickCategory: (c: DocumentCategory) => void;
  onUpload: () => void;
}) {
  const t = useAppTheme();
  const styles = useMemo(() => makeStyles(t), [t]);
  const suggestion = useMemo(() => suggestWord(query, allDocuments), [query, allDocuments]);

  const related = useMemo(() => {
    const q = fold(query.trim());
    const out: { key: string; icon: ReactNode; title: string; count: number; onPress: () => void }[] = [];
    if (q.length < 2) return out;
    for (const cat of tagCategories) {
      for (const v of cat.values) {
        if (!fold(v.value).includes(q) && !q.includes(fold(v.value))) continue;
        const count = allDocuments.filter((d) => d.customTags.some((x) => x.id === v.id)).length;
        if (count > 0) {
          out.push({
            key: v.id,
            icon: <Tag size={18} strokeWidth={2.2} color={t.accent.aiFg} />,
            title: `Etiqueta «${v.value}»`,
            count,
            onPress: () => onPickTag(v.id),
          });
        }
      }
    }
    for (const [c, meta] of Object.entries(CATEGORY_META) as [DocumentCategory, (typeof CATEGORY_META)[DocumentCategory]][]) {
      if (!fold(meta.plural).includes(q) && !fold(meta.label).includes(q)) continue;
      const count = allDocuments.filter((d) => categoryOf(d) === c).length;
      if (count > 0) {
        const Icon = meta.icon;
        out.push({
          key: c,
          icon: <Icon size={18} strokeWidth={2.2} color={t.accent.docFg} />,
          title: `Tipo «${meta.label}»`,
          count,
          onPress: () => onPickCategory(c),
        });
      }
    }
    return out.slice(0, 3);
  }, [query, tagCategories, allDocuments, t, onPickTag, onPickCategory]);

  return (
    <View style={styles.wrap}>
      <View style={styles.hero}>
        <Mascot pose="think" size={100} />
        <Text style={styles.h2} accessibilityRole="header">{`No encontramos «${query.trim()}»`}</Text>
        <Text style={styles.sub}>Buscamos en los títulos, los médicos y las etiquetas.</Text>
      </View>

      {suggestion ? (
        <PressableScale
          onPress={() => onSearch(suggestion.word)}
          accessibilityRole="button"
          accessibilityLabel={`¿Quisiste decir ${suggestion.word}? ${suggestion.count} documentos`}
          style={[styles.card, styles.suggest]}
        >
          <IconTile tone="brand" icon={<Search size={18} strokeWidth={2.2} color={t.brand.text} />} />
          <View style={styles.copy}>
            <Text style={styles.rowTitle}>
              ¿Quisiste decir <Text style={styles.bold}>{suggestion.word}</Text>?
            </Text>
            <Text style={styles.meta}>{suggestion.count === 1 ? "1 documento" : `${suggestion.count} documentos`}</Text>
          </View>
          <ChevronRight size={18} color={t.text.muted} />
        </PressableScale>
      ) : null}

      {related.length > 0 ? (
        <View style={styles.card}>
          <Text style={styles.eyebrow}>Relacionados</Text>
          {related.map((r) => (
            <Pressable key={r.key} onPress={r.onPress} accessibilityRole="button" style={styles.relRow}>
              <IconTile tone={r.key in CATEGORY_META ? "document" : "ai"} icon={r.icon} />
              <View style={styles.copy}>
                <Text style={styles.rowTitle}>{r.title}</Text>
                <Text style={styles.meta}>{r.count === 1 ? "1 documento" : `${r.count} documentos`}</Text>
              </View>
              <ChevronRight size={18} color={t.text.muted} />
            </Pressable>
          ))}
        </View>
      ) : null}

      <Text style={[styles.meta, styles.center]}>
        ¿No lo tienes todavía?{" "}
        <Text style={styles.link} onPress={onUpload} accessibilityRole="link">
          Súbelo ahora
        </Text>
      </Text>
    </View>
  );
}

type Removal = { label: string; next: DocumentListFilters; docs: Document[] };

/** The single active filter whose removal brings back the most documents. */
function bestRemoval(
  filters: DocumentListFilters,
  allDocuments: Document[],
  tagCategories: TagCategoryOption[],
  valueToCategory: Map<string, string>,
): Removal | null {
  const tagName = new Map(tagCategories.flatMap((c) => c.values.map((v) => [v.id, v.value] as const)));
  const candidates: { label: string; next: DocumentListFilters }[] = [
    ...filters.categories.map((c) => ({
      label: CATEGORY_META[c].plural,
      next: { ...filters, categories: filters.categories.filter((x) => x !== c) },
    })),
    ...filters.tagValueIds.map((id) => ({
      label: tagName.get(id) ?? "Etiqueta",
      next: { ...filters, tagValueIds: filters.tagValueIds.filter((x) => x !== id) },
    })),
  ];
  if (filters.startDate || filters.endDate) {
    candidates.push({ label: "Fechas", next: { ...filters, startDate: null, endDate: null } });
  }
  let best: Removal | null = null;
  for (const c of candidates) {
    // Dates are applied by the API; on the client, check them against each document's own date.
    const docs = applyClientFilters(allDocuments, c.next, valueToCategory).filter((d) => inRange(d, c.next));
    if (docs.length > 0 && (!best || docs.length > best.docs.length)) best = { ...c, docs };
  }
  return best;
}

/** «de otros tipos» / «con otras etiquetas» / «en otras fechas»: what the single active filter leaves out. */
function otherThan(f: DocumentListFilters): string {
  if (f.categories.length > 0) return "de otros tipos";
  if (f.tagValueIds.length > 0) return "con otras etiquetas";
  return "en otras fechas";
}

/** A document the user can open from an empty state: same tile and meta as the list, with «›». */
function DocumentPreviewRow({ doc, onPress }: { doc: Document; onPress: () => void }) {
  const t = useAppTheme();
  const styles = useMemo(() => makeStyles(t), [t]);
  const meta = CATEGORY_META[categoryOf(doc)];
  const Icon = meta.icon;
  const line = `${documentDateLabel(doc)} · ${meta.label}`;
  return (
    <PressableScale onPress={onPress} accessibilityRole="button" accessibilityLabel={`${doc.title}, ${line}`} style={styles.relRow}>
      <IconTile tone="document" icon={<Icon size={18} strokeWidth={2.2} color={t.accent.docFg} />} />
      <View style={styles.copy}>
        <Text style={styles.rowTitle} numberOfLines={1}>
          {doc.title}
        </Text>
        <Text style={styles.meta}>{line}</Text>
      </View>
      <ChevronRight size={18} color={t.text.muted} />
    </PressableScale>
  );
}

/** Documents whose title or tags contain the query (accents and case ignored), to tell a filter apart from «no hay». */
export function documentsMatching(query: string, docs: Document[]): Document[] {
  const q = fold(query.trim());
  if (q.length < 2) return [];
  return docs.filter((d) => fold(d.title).includes(q) || d.customTags.some((tag) => fold(tag.value ?? "").includes(q)));
}

/**
 * v2.13 «Búsqueda · sin resultados por el filtro»: the query has results, but the active filter hides
 * them. Say so («en Fórmulas»), offer to search everything and show what would appear.
 */
export function DocumentsSearchFilteredEmpty({
  query,
  filters,
  matches,
  onSearchAll,
  onOpen,
}: {
  query: string;
  filters: DocumentListFilters;
  matches: Document[];
  onSearchAll: () => void;
  onOpen: (doc: Document) => void;
}) {
  const t = useAppTheme();
  const styles = useMemo(() => makeStyles(t), [t]);
  const onlyCategory = filters.categories.length === 1 && filters.tagValueIds.length === 0 && !filters.startDate && !filters.endDate;
  const where = onlyCategory ? `en ${CATEGORY_META[filters.categories[0]!].plural}` : "con tus filtros";
  const n = matches.length;
  return (
    <View style={styles.wrap}>
      <View style={styles.hero}>
        <Mascot pose="think" size={100} />
        <Text style={styles.h2} accessibilityRole="header">{`No encontramos «${query.trim()}» ${where}`}</Text>
        <Text style={styles.sub}>
          {onlyCategory
            ? `Hay ${n === 1 ? "1 documento" : `${n} documentos`} con «${query.trim()}» en otros tipos.`
            : `Hay ${n === 1 ? "1 documento" : `${n} documentos`} con «${query.trim()}» si quitas los filtros.`}
        </Text>
        {/* Longer label than the other empty states: a wider button so it never truncates. */}
        <View style={[styles.action, { width: "100%", maxWidth: 320 }]}>
          <Button fullWidth onPress={onSearchAll}>
            Buscar en todos los documentos
          </Button>
        </View>
      </View>
      <View style={styles.card}>
        <Text style={styles.eyebrow}>{n === 1 ? "Aparece si buscas en todos" : "Aparecen si buscas en todos"}</Text>
        {matches.slice(0, 2).map((d) => (
          <DocumentPreviewRow key={d.id} doc={d} onPress={() => onOpen(d)} />
        ))}
      </View>
    </View>
  );
}

/** m9: say what is empty, «No hay imágenes con «Chequeo anual»», not just «sin resultados». */
function filterTitle(f: DocumentListFilters, tagCategories: TagCategoryOption[]): string {
  const what = f.categories.length === 1 ? CATEGORY_META[f.categories[0]!].plural.toLowerCase() : "documentos";
  const tagName = new Map(tagCategories.flatMap((c) => c.values.map((v) => [v.id, v.value] as const)));
  const tag = f.tagValueIds.length === 1 ? ` con «${tagName.get(f.tagValueIds[0]!) ?? "esa etiqueta"}»` : f.tagValueIds.length > 1 ? " con esas etiquetas" : "";
  const dates = f.startDate || f.endDate ? " en esas fechas" : "";
  return `No hay ${what}${tag}${dates}`;
}

function inRange(doc: Document, f: DocumentListFilters): boolean {
  const day = (doc.documentDate ?? doc.uploadedAt).slice(0, 10);
  return (!f.startDate || day >= f.startDate) && (!f.endDate || day <= f.endDate);
}

/**
 * m9 «Documentos · filtro sin resultados»: names the filter that leaves the list empty and offers to
 * remove just that one, showing what will come back.
 */
export function DocumentsFilterEmpty({
  filters,
  allDocuments,
  tagCategories,
  onChange,
  onOpen,
}: {
  filters: DocumentListFilters;
  allDocuments: Document[];
  tagCategories: TagCategoryOption[];
  onChange: (next: DocumentListFilters) => void;
  onOpen: (doc: Document) => void;
}) {
  const t = useAppTheme();
  const styles = useMemo(() => makeStyles(t), [t]);
  const valueToCategory = useMemo(() => {
    const map = new Map<string, string>();
    for (const cat of tagCategories) for (const v of cat.values) map.set(v.id, cat.id);
    return map;
  }, [tagCategories]);
  const removal = useMemo(
    () => (hasActiveDocumentFilters(filters) ? bestRemoval(filters, allDocuments, tagCategories, valueToCategory) : null),
    [filters, allDocuments, tagCategories, valueToCategory],
  );

  // v2.13: with one filter, removing it brings the whole list back; listing two random documents
  // under it only confused. Show what comes back only when another filter stays on.
  const stillFiltered = removal ? hasActiveDocumentFilters(removal.next) : false;
  const n = removal?.docs.length ?? 0;
  const sub = !removal
    ? "Prueba con otros filtros."
    : stillFiltered
      ? `Si quitas «${removal.label}», ${n === 1 ? "aparece 1 documento" : `aparecen ${n} documentos`}.`
      : `Tienes ${n === 1 ? "1 documento" : `${n} documentos`} ${otherThan(filters)}.`;

  return (
    <View style={styles.wrap}>
      <View style={styles.hero}>
        <Mascot pose="think" size={100} />
        <Text style={styles.h2} accessibilityRole="header">
          {filterTitle(filters, tagCategories)}
        </Text>
        <Text style={styles.sub}>{sub}</Text>
        <View style={styles.action}>
          <Button fullWidth onPress={() => onChange(removal ? removal.next : { categories: [], tagValueIds: [], startDate: null, endDate: null })}>
            {removal ? `Quitar el filtro «${removal.label}»` : "Limpiar filtros"}
          </Button>
        </View>
      </View>

      {removal && stillFiltered ? (
        <View style={styles.card}>
          <Text style={styles.eyebrow}>{`${n === 1 ? "Aparece" : "Aparecen"} si quitas «${removal.label}»`}</Text>
          {removal.docs.slice(0, 2).map((d) => (
            <DocumentPreviewRow key={d.id} doc={d} onPress={() => onOpen(d)} />
          ))}
        </View>
      ) : null}
    </View>
  );
}

function makeStyles(t: ThemeContextValue) {
  return StyleSheet.create({
    wrap: { gap: spacing[4], paddingTop: spacing[4], paddingHorizontal: spacing[4], paddingBottom: spacing[8] },
    hero: { alignItems: "center", gap: 10, paddingHorizontal: spacing[3], paddingTop: spacing[2] },
    h2: { fontSize: 21, lineHeight: 26, fontFamily: nativeFont("heading", 900), color: t.text.primary, textAlign: "center" },
    sub: { maxWidth: 290, fontSize: 14, lineHeight: 21, fontFamily: nativeFont("body", 400), color: t.text.secondary, textAlign: "center" },
    action: { width: 270, marginTop: 6 },
    card: {
      gap: spacing[3],
      padding: 14,
      borderRadius: radii.card,
      borderWidth: 1,
      borderBottomWidth: 4,
      borderColor: t.border.default,
      backgroundColor: t.surface.bgCard,
    },
    suggest: { flexDirection: "row", alignItems: "center", backgroundColor: t.brand.tint, borderColor: t.brand.tintBorder },
    relRow: { flexDirection: "row", alignItems: "center", gap: spacing[3], minHeight: 44 },
    copy: { flex: 1, minWidth: 0, gap: 2 },
    eyebrow: {
      fontSize: 11,
      fontFamily: nativeFont("heading", 900),
      letterSpacing: 0.9,
      textTransform: "uppercase",
      color: t.text.secondary,
    },
    rowTitle: { fontSize: 14, lineHeight: 18, fontFamily: nativeFont("body", 600), color: t.text.primary },
    bold: { fontFamily: nativeFont("body", 700) },
    meta: { fontSize: 13, lineHeight: 18, fontFamily: nativeFont("body", 400), color: t.text.secondary },
    center: { textAlign: "center" },
    link: { fontFamily: nativeFont("heading", 800), color: t.brand.text },
  });
}

