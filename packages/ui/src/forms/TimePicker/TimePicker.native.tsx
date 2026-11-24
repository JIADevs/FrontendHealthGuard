import { useState } from 'react';
import { View, Text, Pressable, Modal, Platform, StyleSheet } from 'react-native';
import RNDateTimePicker from '@react-native-community/datetimepicker';
import { Clock } from 'lucide-react-native';
import { colors, palette, spacing, fontSize, fontWeight, radii } from '../../tokens/tokens';
import { useAppTheme } from '../../tokens/ThemeProvider';
import { fieldBox, FieldLabel, FieldErrorText, fieldTextStyle } from '../fieldKit.native';
import { formatClock, formatShortDay } from '../../utils/formatters';
import type { TimePickerProps } from './TimePicker.types';

/** An empty field opens on the next full hour, not on midnight. */
function toDate(value: string): Date {
  const d = new Date();
  if (!value) {
    d.setHours(d.getHours() + 1, 0, 0, 0);
    return d;
  }
  const [hours, minutes] = value.split(':').map(Number);
  d.setHours(hours, minutes, 0, 0);
  return d;
}

function toTimeString(date: Date): string {
  const pad = (n: number) => String(n).padStart(2, '0');
  return `${pad(date.getHours())}:${pad(date.getMinutes())}`;
}


export function TimePicker({
  label,
  value,
  onChange,
  placeholder,
  error,
  disabled,
  required,
}: TimePickerProps) {
  const t = useAppTheme();
  const [show, setShow] = useState(false);
  const [tempDate, setTempDate] = useState<Date>(toDate(value));


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
      onChange(toTimeString(selected));
    } else {
      setTempDate(selected);
    }
  }

  function confirmIOS() {
    setShow(false);
    onChange(toTimeString(tempDate));
  }

  return (
    <View style={{ gap: 6 }}>
      {label ? <FieldLabel t={t} label={label} /> : null}

      <Pressable
        onPress={open}
        accessibilityRole="button"
        accessibilityLabel={label}
        accessibilityHint={error}
        style={[
          fieldBox(t, { error: !!error, disabled }),
          { flexDirection: 'row', alignItems: 'center', gap: 10 },
        ]}
      >
        <Clock size={18} color={t.text.muted} />
        <Text style={[fieldTextStyle(t, !!value), { flex: 1 }]} numberOfLines={1}>
          {value ? formatClock(value) : (placeholder ?? 'Elige la hora')}
        </Text>
      </Pressable>

      <FieldErrorText t={t} message={error} />

      {/* iOS — bottom sheet con spinner */}
      {show && Platform.OS === 'ios' && (
        <Modal transparent animationType="slide" onRequestClose={() => setShow(false)}>
          <View style={styles.overlay}>
            <View style={[styles.sheet, { backgroundColor: t.surface.bgCard }]}>
              <View style={styles.sheetHeader}>
                <Pressable onPress={() => setShow(false)} hitSlop={8}>
                  <Text style={[styles.sheetAction, { color: palette.status.error[700] }]}>Cancelar</Text>
                </Pressable>
                <Text style={[styles.sheetTitle, { color: t.text.primary }]}>Hora</Text>
                <Pressable onPress={confirmIOS} hitSlop={8}>
                  <Text style={[styles.sheetAction, { color: palette.brand[700] }]}>Confirmar</Text>
                </Pressable>
              </View>
              <RNDateTimePicker
                value={tempDate}
                mode="time"
                display="spinner"
                onChange={(_e, d) => d && setTempDate(d)}
                locale="es-ES"
                themeVariant={t.mode}
                textColor={t.text.primary}
                style={styles.spinner}
              />
            </View>
          </View>
        </Modal>
      )}

      {/* Android — diálogo nativo */}
      {show && Platform.OS === 'android' && (
        <RNDateTimePicker
          value={tempDate}
          mode="time"
          display="default"
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
    color: palette.status.error[700],
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
  spinner: {
    width: '100%',
    height: 216,
  },
});
