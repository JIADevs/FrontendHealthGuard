import { StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { ChevronLeft, ChevronRight } from 'lucide-react-native';
import { colors, palette, radii, spacing, fontSize, fontWeight } from '../../tokens/tokens';
import type { PaginationProps } from './Pagination.types';

export function Pagination({ page, totalPages, onPageChange }: PaginationProps) {
  if (totalPages <= 1) return null;

  const canPrev = page > 1;
  const canNext = page < totalPages;

  return (
    <View style={styles.container}>
      <TouchableOpacity
        style={[styles.btn, !canPrev && styles.btnDisabled]}
        disabled={!canPrev}
        onPress={() => onPageChange(page - 1)}
        accessibilityLabel="Página anterior"
      >
        <ChevronLeft size={18} color={canPrev ? palette.brand[500] : colors.gray[300]} />
      </TouchableOpacity>

      <Text style={styles.label}>{page} / {totalPages}</Text>

      <TouchableOpacity
        style={[styles.btn, !canNext && styles.btnDisabled]}
        disabled={!canNext}
        onPress={() => onPageChange(page + 1)}
        accessibilityLabel="Página siguiente"
      >
        <ChevronRight size={18} color={canNext ? palette.brand[500] : colors.gray[300]} />
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  container:   { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: spacing[4], paddingVertical: spacing[4] },
  btn:         { width: 36, height: 36, borderRadius: radii.full, alignItems: 'center', justifyContent: 'center', backgroundColor: colors.white, borderWidth: 1, borderColor: colors.gray[200] },
  btnDisabled: { opacity: 0.4 },
  label:       { fontSize: fontSize.sm, color: colors.gray[500], fontWeight: fontWeight.semibold, minWidth: 48, textAlign: 'center' },
});
