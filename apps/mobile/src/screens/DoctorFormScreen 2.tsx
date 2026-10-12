import { View, Text, StyleSheet, ScrollView } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useNavigation } from "@react-navigation/native";
import { useMemo } from "react";
import {
  useAppTheme,
  Button,
  TextField,
  spacing,
} from "@helu/ui";
import type { ThemeContextValue } from "@helu/ui";
import { useDoctorForm } from "../hooks/useDoctorForm";
import { useAppointmentOptionsQuery } from "@helu/api/hooks";
import { SelectField } from "../components/SelectField";

export function DoctorFormScreen() {
  const t = useAppTheme();
  const styles = useMemo(() => makeStyles(t), [t]);
  const navigation = useNavigation();

  const form = useDoctorForm({
    initial: null,
    onClose: () => navigation.goBack(),
  });

  // Query appointment options from backend to get specialties
  const optionsQuery = useAppointmentOptionsQuery();
  const specialties = optionsQuery.data?.specialties ?? [];

  return (
    <SafeAreaView style={styles.container} edges={["bottom"]}>
      <ScrollView style={styles.scroll} contentContainerStyle={styles.content}>
        <TextField
          label="Nombre *"
          value={form.name}
          onChange={form.setName}
          placeholder="Dr. Juan Pérez"
          required
        />

        <SelectField
          label="Especialidad"
          value={form.specialty}
          placeholder="Seleccionar especialidad"
          options={specialties}
          onChange={form.setSpecialty}
        />

        <TextField
          label="Clínica / Hospital / IPS"
          value={form.clinic}
          onChange={form.setClinic}
          placeholder="Ej: Clínica del Country"
        />

        <TextField
          label="Teléfono"
          value={form.phone}
          onChange={form.setPhone}
          placeholder="Ej: 3001234567"
          keyboardType="phone-pad"
        />

        <TextField
          label="Notas"
          value={form.notes}
          onChange={form.setNotes}
          placeholder="Información adicional sobre el doctor"
          multiline
          numberOfLines={4}
        />

        {form.error && <Text style={styles.errorText}>{form.error}</Text>}
      </ScrollView>

      <View style={styles.footer}>
        <Button
          onPress={form.handleSave}
          disabled={form.saving}
          loading={form.saving}
        >
          Guardar
        </Button>
      </View>
    </SafeAreaView>
  );
}

const makeStyles = (t: ThemeContextValue) =>
  StyleSheet.create({
    container: {
      flex: 1,
      backgroundColor: t.surface.bg,
    },
    scroll: {
      flex: 1,
    },
    content: {
      padding: spacing[4],
      gap: spacing[4],
    },
    footer: {
      padding: spacing[4],
      backgroundColor: t.surface.bgCard,
      borderTopWidth: 1,
      borderTopColor: t.border.light,
    },
    errorText: {
      color: t.status.errorFg,
      fontSize: 14,
    },
  });
