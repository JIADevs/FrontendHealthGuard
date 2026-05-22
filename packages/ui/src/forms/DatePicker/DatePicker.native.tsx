import { useState } from 'react';
import { View, Text, Pressable, Modal, Platform, StyleSheet } from 'react-native';
import RNDateTimePicker from '@react-native-community/datetimepicker';
import { CalendarDays } from 'lucide-react-native';
import { colors, palette, spacing, fontSize, fontWeight, radii } from '../../tokens/tokens';
import { useAppTheme } from '../../tokens/ThemeProvider';
import type { DatePickerProps } from './DatePicker.types';

function toDate(value: string): Date {
  return value ? new Date(`${value}T00:00:00`) : new Date();
}

function toDateString(date: Date): string {
  const pad = (n: number) => String(n).padStart(2, '0');
  return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}`;
}

function formatDisplay(value: string): string {
  if (!value) return '';
  const d = new Date(`${value}T00:00:00`);
  return d.toLocaleDateString('es-ES', { dateStyle: 'medium' });
}

export function DatePicker({
  label,
  value,
  onChange,
  placeholder,
  error,
  disabled,
  required,
  minDate,
  maxDate,
}: DatePickerProps) {
  const t = useAppTheme();
  const [show, setShow] = useState(false);
  const [tempDate, setTempDate] = useState<Date>(toDate(value));

  const borderColor = error ? palette.status.error[500] : t.border.medium;

  function open() {
    if (disabled) return;
    setTempDate(toDate(value));
    setShow(true);
  }

  function handleChange(_event: unknown, selected?: Date) {
    if (!selected) {
      setShow(false);
      return;
    }
    if (Platform.OS === 'android') {
      setShow(false);
      onChange(toDateString(selected));
    } else {
      setTempDate(selected);
    }
  }

  function confirmIOS() {
    setShow(false);
    onChange(toDateString(tempDate));
  }

  return (
    <View style={styles.container}>
      {label && (
        <Text style={[styles.label, { color: t.text.primary }]}>
          {label}
          {required ? <Text style={{ color: palette.status.error[500] }}> *</Text> : null}
        </Text>
      )}

      <Pressable
        onPress={open}
        accessibilityRole="button"
        accessibilityLabel={label}
        style={[
          styles.field,
          {
            borderColor,
            backgroundColor: disabled ? t.border.light : t.surface.bgCard,
          },
          disabled && styles.disabled,
        ]}
      >
        <Text style={[styles.fieldText, { color: value ? t.text.primary : t.text.tertiary }]}>
          {value ? formatDisplay(value) : (placeholder ?? 'Seleccionar fecha')}
        </Text>
        <CalendarDays size={18} color={t.text.tertiary} />
      </Pressable>

      {error && <Text style={styles.error}>{error}</Text>}

      {/* iOS — bottom sheet con spinner */}
      {show && Platform.OS === 'ios' && (
        <Modal transparent animationType="slide" onRequestClose={() => setShow(false)}>
          <View style={styles.overlay}>
            <View style={[styles.sheet, { backgroundColor: t.surface.bgCard }]}>
              <View style={styles.sheetHeader}>
                <Pressable onPress={() => setShow(false)} hitSlop={8}>
                  <Text style={[styles.sheetAction, { color: palette.status.error[500] }]}>Cancelar</Text>
                </Pressable>
                <Text style={[styles.sheetTitle, { color: t.text.primary }]}>Fecha</Text>
                <Pressable onPress={confirmIOS} hitSlop={8}>
                  <Text style={[styles.sheetAction, { color: palette.brand[500] }]}>Confirmar</Text>
                </Pressable>
              </View>
              <RNDateTimePicker
                value={tempDate}
                mode="date"
                display="spinner"
                minimumDate={minDate ? new Date(`${minDate}T00:00:00`) : undefined}
                maximumDate={maxDate ? new Date(`${maxDate}T00:00:00`) : undefined}
                onChange={(_e, d) => d && setTempDate(d)}
                locale="es-ES"
                style={{ width: '100%' }}
              />
            </View>
          </View>
        </Modal>
      )}

      {/* Android — diálogo nativo */}
      {show && Platform.OS === 'android' && (
        <RNDateTimePicker
          value={tempDate}
          mode="date"
          display="default"
          minimumDate={minDate ? new Date(`${minDate}T00:00:00`) : undefined}
          maximumDate={maxDate ? new Date(`${maxDate}T00:00:00`) : undefined}
          onChange={handleChange}
        />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    gap: spacing[2],
  },
  label: {
    fontSize: fontSize.sm,
    fontWeight: fontWeight.semibold,
  },
  field: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    borderWidth: 1,
    borderRadius: radii.md,
    paddingHorizontal: spacing[3],
    paddingVertical: spacing[3],
  },
  fieldText: {
    fontSize: fontSize.md,
    flex: 1,
  },
  disabled: {
    opacity: 0.6,
  },
  error: {
    fontSize: fontSize.xs,
    color: palette.status.error[500],
    backgroundColor: palette.status.error[50],
    paddingHorizontal: spacing[2],
    paddingVertical: spacing[1],
    borderRadius: radii.xs,
  },
  overlay: {
    flex: 1,
    justifyContent: 'flex-end',
    backgroundColor: 'rgba(0,0,0,0.4)',
  },
  sheet: {
    borderTopLeftRadius: radii.xl,
    borderTopRightRadius: radii.xl,
    padding: spacing[4],
    paddingBottom: spacing[8],
  },
  sheetHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: spacing[2],
  },
  sheetTitle: {
    fontSize: fontSize.base,
    fontWeight: fontWeight.semibold,
  },
  sheetAction: {
    fontSize: fontSize.base,
  },
});
