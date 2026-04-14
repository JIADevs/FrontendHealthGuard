import { useState } from 'react';
import { View, Text, Pressable, Modal, Platform, StyleSheet } from 'react-native';
import RNDateTimePicker from '@react-native-community/datetimepicker';
import { CalendarDays } from 'lucide-react-native';
import { colors, palette, spacing, fontSize, fontWeight, radii } from '../../tokens/tokens';
import { useAppTheme } from '../../tokens/ThemeProvider';
import type { DateTimePickerProps } from './DateTimePicker.types';

function toDate(value: string): Date {
  return value ? new Date(value) : new Date();
}

function toISOLocal(date: Date): string {
  const pad = (n: number) => String(n).padStart(2, '0');
  return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}T${pad(date.getHours())}:${pad(date.getMinutes())}`;
}

function formatDisplay(value: string): string {
  if (!value) return '';
  const d = new Date(value);
  return d.toLocaleString('es-ES', { dateStyle: 'medium', timeStyle: 'short' });
}

export function DateTimePicker({
  label,
  value,
  onChange,
  placeholder,
  error,
  disabled,
  required,
  minDate,
  maxDate,
}: DateTimePickerProps) {
  const t = useAppTheme();
  const [show, setShow] = useState(false);
  const [androidMode, setAndroidMode] = useState<'date' | 'time'>('date');
  const [tempDate, setTempDate] = useState<Date>(toDate(value));

  const borderColor = error ? colors.error[500] : t.border.medium;

  function open() {
    if (disabled) return;
    setTempDate(toDate(value));
    setAndroidMode('date');
    setShow(true);
  }

  function handleChange(_event: unknown, selected?: Date) {
    if (!selected) {
      setShow(false);
      return;
    }

    if (Platform.OS === 'android') {
      if (androidMode === 'date') {
        const withDate = new Date(selected);
        const current = toDate(value);
        withDate.setHours(current.getHours(), current.getMinutes());
        setTempDate(withDate);
        setAndroidMode('time');
      } else {
        const final = new Date(tempDate);
        final.setHours(selected.getHours(), selected.getMinutes());
        setShow(false);
        onChange(toISOLocal(final));
      }
    } else {
      setTempDate(selected);
    }
  }

  function confirmIOS() {
    setShow(false);
    onChange(toISOLocal(tempDate));
  }

  return (
    <View style={styles.container}>
      {label && (
        <Text style={[styles.label, { color: t.text.primary }]}>
          {label}
          {required ? <Text style={{ color: colors.error[500] }}> *</Text> : null}
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
            backgroundColor: disabled ? t.border.light : t.surface.bg,
          },
          disabled && styles.disabled,
        ]}
      >
        <Text style={[styles.fieldText, { color: value ? t.text.primary : t.text.muted }]}>
          {value ? formatDisplay(value) : (placeholder ?? 'Seleccionar fecha y hora')}
        </Text>
        <CalendarDays size={18} color={t.text.muted} />
      </Pressable>

      {error && <Text style={styles.error}>{error}</Text>}

      {/* iOS — bottom sheet con spinner */}
      {show && Platform.OS === 'ios' && (
        <Modal transparent animationType="slide" onRequestClose={() => setShow(false)}>
          <View style={styles.overlay}>
            <View style={[styles.sheet, { backgroundColor: t.surface.bgCard }]}>
              <View style={styles.sheetHeader}>
                <Pressable onPress={() => setShow(false)} hitSlop={8}>
                  <Text style={[styles.sheetAction, { color: colors.error[500] }]}>Cancelar</Text>
                </Pressable>
                <Text style={[styles.sheetTitle, { color: t.text.primary }]}>Fecha y hora</Text>
                <Pressable onPress={confirmIOS} hitSlop={8}>
                  <Text style={[styles.sheetAction, { color: palette.brand[500] }]}>Confirmar</Text>
                </Pressable>
              </View>
              <RNDateTimePicker
                value={tempDate}
                mode="datetime"
                display="spinner"
                minimumDate={minDate ? new Date(minDate) : undefined}
                maximumDate={maxDate ? new Date(maxDate) : undefined}
                onChange={(_e, d) => d && setTempDate(d)}
                locale="es-ES"
                style={{ width: '100%' }}
              />
            </View>
          </View>
        </Modal>
      )}

      {/* Android — diálogo nativo en dos pasos: primero fecha, luego hora */}
      {show && Platform.OS === 'android' && (
        <RNDateTimePicker
          value={tempDate}
          mode={androidMode}
          display="default"
          minimumDate={minDate ? new Date(minDate) : undefined}
          maximumDate={maxDate ? new Date(maxDate) : undefined}
          onChange={handleChange}
        />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    gap: spacing[1],
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
    color: colors.error[500],
    backgroundColor: colors.error[50],
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
