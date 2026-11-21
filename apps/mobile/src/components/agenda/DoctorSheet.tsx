import { useEffect, useRef, useState } from "react";
import { View } from "react-native";
import { Phone, Stethoscope, User } from "lucide-react-native";
import {
  BottomSheet,
  Button,
  IconTile,
  TextField,
  spacing,
  useAppTheme,
  type BottomSheetHandle,
} from "@helu/ui";
import { useAppointmentOptionsQuery, useDoctorFormCore } from "@helu/api/hooks";
import { SelectField } from "../SelectField";
import { notify } from "../../lib/notify";
import { haptics } from "../../lib/haptics";

export interface DoctorSheetProps {
  /** Called with the new professional's name, so the appointment can pick it */
  onSaved: (name: string) => void;
  onClose: () => void;
}

/**
 * Mockup «Nuevo profesional»: a sheet over «Nueva cita» (five fields or fewer, formularios.md §1).
 * Saving goes back to the appointment with the professional already chosen.
 */
export function DoctorSheet({ onSaved, onClose }: DoctorSheetProps) {
  const t = useAppTheme();
  const sheetRef = useRef<BottomSheetHandle>(null);
  const savedName = useRef("");
  const form = useDoctorFormCore({
    initial: null,
    adapters: {
      onSaveSuccess: () => haptics.success(),
      afterSave: () =>
        sheetRef.current?.close(() => {
          onSaved(savedName.current);
          onClose();
          notify({ message: "Profesional agregado", description: savedName.current });
        }),
    },
  });
  savedName.current = form.name.trim();
  const specialties = useAppointmentOptionsQuery().data?.specialties ?? [];

  const [submitted, setSubmitted] = useState(false);
  const nameError = submitted && !form.name.trim() ? "Escribe el nombre del profesional." : undefined;
  const dirty = Boolean(form.name.trim() || form.specialty || form.clinic || form.phone || form.notes);

  const save = () => {
    setSubmitted(true);
    if (!form.name.trim()) return haptics.warning();
    form.handleSave();
  };

  useEffect(() => {
    if (!form.error || !form.name.trim()) return;
    haptics.error();
    notify({
      tone: "error",
      message: "No se pudo guardar el profesional",
      description: "Revisa tu conexión e intenta de nuevo.",
      action: { label: "Reintentar", onPress: save },
    });
    form.clearError();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [form.error]);

  return (
    <BottomSheet
      ref={sheetRef}
      eyebrow="NUEVA CITA"
      title="Nuevo profesional"
      icon={<IconTile tone="appointment" size="lg" round icon={<Stethoscope size={24} strokeWidth={2.4} color={t.accent.calFg} />} />}
      dirty={dirty}
      onClose={onClose}
    >
      <View style={{ gap: spacing[4] }}>
        <TextField
          label="Nombre"
          value={form.name}
          onChange={form.setName}
          placeholder="Ej: Dr. Juan Pérez"
          leadingIcon={<User size={18} color={t.text.secondary} />}
          autoCapitalize="words"
          autoFocus
          error={nameError}
        />
        <SelectField
          label="Especialidad"
          value={form.specialty}
          placeholder="Seleccionar especialidad"
          options={specialties}
          onChange={form.setSpecialty}
        />
        <TextField
          label="Clínica / Hospital / IPS (opcional)"
          value={form.clinic}
          onChange={form.setClinic}
          placeholder="Ej: Clínica del Country"
        />
        <TextField
          label="Teléfono (opcional)"
          value={form.phone}
          onChange={form.setPhone}
          placeholder="Ej: +57 300 123 4567"
          keyboardType="phone-pad"
          leadingIcon={<Phone size={18} color={t.text.secondary} />}
        />
        <TextField
          label="Notas (opcional)"
          value={form.notes}
          onChange={form.setNotes}
          placeholder="Ej: Atiende martes y jueves"
          multiline
          numberOfLines={3}
        />
      </View>
      <View style={{ marginTop: spacing[5] }}>
        <Button size="lg" fullWidth onPress={save} loading={form.saving} loadingLabel="Guardando…" disabled={form.saving}>
          Guardar profesional
        </Button>
      </View>
    </BottomSheet>
  );
}
