import { useMemo } from "react";
import { View, Text, StyleSheet } from "react-native";
import { fontSize, fontWeight, radii, spacing, useAppTheme } from "@helu/ui";
import type { ThemeContextValue, DocumentCategoryTheme } from "@helu/ui";
import type { DocumentDetailTag } from "./utils/documentDetailMeta";

interface DocumentDetailTagsProps {
  tags: DocumentDetailTag[];
  theme: DocumentCategoryTheme;
}

export function DocumentDetailTags({ tags, theme }: DocumentDetailTagsProps) {
  const t = useAppTheme();
  const styles = useMemo(() => makeStyles(t), [t]);

  if (tags.length === 0) return null;

  return (
    <View style={styles.row}>
      {tags.map((tag) => {
        const isCategory = tag.variant === "category";
        return (
          <View
            key={tag.id}
            style={[
              styles.chip,
              {
                backgroundColor: isCategory ? theme.tagBg : t.brand.tint,
              },
            ]}
          >
            <Text
              style={[
                styles.chipText,
                { color: isCategory ? theme.tagText : t.brand.tintText },
              ]}
            >
              {tag.label}
            </Text>
          </View>
        );
      })}
    </View>
  );
}

function makeStyles(_t: ThemeContextValue) {
  return StyleSheet.create({
    row: {
      flexDirection: "row",
      flexWrap: "wrap",
      gap: spacing[2],
    },
    chip: {
      paddingHorizontal: spacing[3],
      paddingVertical: spacing[1],
      borderRadius: radii.full,
    },
    chipText: {
      fontSize: fontSize.sm,
      fontWeight: fontWeight.medium,
    },
  });
}
