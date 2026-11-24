import { useEffect, useMemo, useRef, useState } from "react";
import { KeyboardAvoidingView, Platform, ScrollView, StyleSheet, Text, View } from "react-native";
import { SafeAreaView, useSafeAreaInsets } from "react-native-safe-area-context";
import { useNavigation } from "@react-navigation/native";
import { MapPin, Phone } from "lucide-react-native";
import { useProfileQuery } from "@helu/api/hooks";
import { useUserProgressQuery } from "@helu/api";
import {
  BOTTOM_ACTION_BAR_HEIGHT,
  BottomActionBar,
  ChoiceChips,
  DatePicker,
  DiscardChangesDialog,
  Skeleton,
  SkeletonGroup,
  TextField,
  colors,
  fontSize,
  nativeFont,
  radii,
  spacing,
  useAppTheme,
  type ThemeContextValue,
} from "@helu/ui";
import { ScreenHeader } from "../ScreenHeader";
import { FormCard, FormLabel } from "../agenda/FormCard";
import { initialsOf } from "../dependientes/PersonCard";
import { useProfileForm } from "../../hooks/useProfileForm";
import { useManagingSomeone } from "../home/useManagingSomeone";
import { BadgesCard } from "../motivation/BadgesCard";
import { LevelCard } from "../motivation/LevelCard";
import { LevelChip, ProfileStats } from "../motivation/ProfileProgress";

const GENDERS = [
  { value: "F", label: "Femenino" },
  { value: "M", label: "Masculino" },
  { value: "O", label: "Otro" },
  { value: "", label: "Sin especificar" },
];

/** «No sé» is stored as `UNKNOWN`: the backend keeps blood type as free text (#65). */
const BLOOD_TYPES = ["A+", "A-", "B+", "B-", "AB+", "AB-", "O+", "O-"].map((v) => ({ value: v, label: v.replace("-", "−") }));
BLOOD_TYPES.push({ value: "UNKNOWN", label: "No sé" });

const FIELDS = [
  "name",
  "documentId",
  "birthDate",
  "gender",
  "phone",
  "address",
  "bloodType",
  "emergencyContactName",
  "emergencyContactPhone",
] as const;

/**
 * Mockup «Perfil» (module 9): the profile card, then «Información personal», «Información
 * médica», «Contacto» and «Contacto de emergencia», every field optional, with a fixed «Guardar
 * cambios». Data first, then the level card and the badges (v2, DU-35); «Mostrar racha y nivel»
 * off hides the level chip, the streak box and the level card, never the badges (RF-93). A dirty
 * back asks «¿Descartar los cambios?» (formularios.md §7).
 */
export function Profile() {
  const t = useAppTheme();
  const styles = useMemo(() => makeStyles(t), [t]);
  const insets = useSafeAreaInsets();
  const navigation = useNavigation();
  const profile = useProfileQuery();
  const progress = useUserProgressQuery();
  const managing = useManagingSomeone();
  const form = useProfileForm();

  const saved = profile.data;
  const dirty = Boolean(saved) && FIELDS.some((k) => (form[k] ?? "") !== ((saved?.[k] as string | null | undefined) ?? ""));
  const allowLeave = useRef(false);
  const [askDiscard, setAskDiscard] = useState(false);
  const pendingAction = useRef<Parameters<typeof navigation.dispatch>[0] | null>(null);

  useEffect(
    () =>
      navigation.addListener("beforeRemove", (e) => {
        if (!dirty || allowLeave.current || form.saving) return;
        e.preventDefault();
        pendingAction.current = e.data.action;
        setAskDiscard(true);
      }),
    [navigation, dirty, form.saving],
  );

  const save = () => {
    allowLeave.current = true;
    form.handleSave();
  };
  // A failed save keeps the screen; arm the guard again.
  useEffect(() => {
    if (!form.saving) allowLeave.current = false;
  }, [form.saving]);

  const name = saved?.name?.trim() || "Sin nombre";
  const email = saved?.email ?? "";

  return (
    <SafeAreaView style={styles.container} edges={["top"]}>
      <ScreenHeader title="Perfil" />
      {form.loading ? (
        <View style={styles.content}>
          <SkeletonGroup label="Cargando tu perfil" style={{ gap: spacing[4] }}>
            <View style={[styles.card, styles.profileRow]}>
              <Skeleton width={56} height={56} radius={28} />
              <View style={{ flex: 1, gap: 8 }}>
                <Skeleton width="55%" height={16} />
                <Skeleton width="70%" height={12} />
              </View>
            </View>
            <View style={[styles.card, { gap: 14 }]}>
              <Skeleton width="45%" height={18} />
              <Skeleton width="100%" height={48} radius={14} />
              <Skeleton width="100%" height={48} radius={14} />
            </View>
          </SkeletonGroup>
        </View>
      ) : (
        <KeyboardAvoidingView
          style={{ flex: 1 }}
          behavior={Platform.OS === "ios" ? "padding" : "height"}
          keyboardVerticalOffset={Platform.OS === "ios" ? 64 : 0}
        >
          <ScrollView
            keyboardShouldPersistTaps="handled"
            contentContainerStyle={[styles.content, { paddingBottom: BOTTOM_ACTION_BAR_HEIGHT + insets.bottom + spacing[8] }]}
          >
            <View style={[styles.card, { gap: spacing[4] }]}>
              <View style={styles.profileRow}>
                <View style={[styles.avatar, { backgroundColor: t.brand.solid }]}>
                  <Text style={styles.avatarText}>{initialsOf(saved?.name?.trim() || email || "?")}</Text>
                </View>
                <View style={{ flex: 1, minWidth: 0, gap: 2 }}>
                  <Text style={styles.name} numberOfLines={1}>
                    {name}
                  </Text>
                  <Text style={styles.meta} numberOfLines={1}>
                    {email}
                  </Text>
                </View>
                <LevelChip progress={progress.data} />
              </View>
              {progress.isError ? null : <ProfileStats progress={progress.data} />}
            </View>

            <FormCard title="Información personal">
              <TextField label="Nombre completo (opcional)" value={form.name} onChange={form.setName} placeholder="Ej: Alejandra Gómez" autoCapitalize="words" textContentType="name" />
              <DatePicker label="Fecha de nacimiento (opcional)" value={form.birthDate} onChange={form.setBirthDate} />
              <View style={styles.group}>
                <FormLabel>Género (opcional)</FormLabel>
                <ChoiceChips options={GENDERS} value={form.gender} onChange={form.setGender} />
              </View>
              <TextField label="Documento de identidad (opcional)" value={form.documentId} onChange={form.setDocumentId} placeholder="Ej: CC 1.020.456.789" autoCapitalize="characters" />
            </FormCard>

            <FormCard title="Información médica">
              <View style={styles.group}>
                <FormLabel>Tipo de sangre (opcional)</FormLabel>
                <ChoiceChips options={BLOOD_TYPES} value={form.bloodType || null} onChange={form.setBloodType} />
              </View>
            </FormCard>

            <FormCard title="Contacto">
              <TextField
                label="Teléfono (opcional)"
                value={form.phone}
                onChange={form.setPhone}
                placeholder="Ej: +57 300 123 4567"
                keyboardType="phone-pad"
                textContentType="telephoneNumber"
                leadingIcon={<Phone size={18} color={t.text.muted} />}
              />
              <TextField
                label="Dirección (opcional)"
                value={form.address}
                onChange={form.setAddress}
                placeholder="Ej: Bogotá, Calle 93 #15-20"
                autoCorrect={false}
                leadingIcon={<MapPin size={18} color={t.text.muted} />}
              />
            </FormCard>

            <FormCard title="Contacto de emergencia">
              <TextField label="Nombre (opcional)" value={form.emergencyContactName} onChange={form.setEmergencyContactName} placeholder="Ej: Carlos Rincón" autoCapitalize="words" />
              <TextField
                label="Teléfono (opcional)"
                value={form.emergencyContactPhone}
                onChange={form.setEmergencyContactPhone}
                placeholder="Ej: +57 310 555 0101"
                keyboardType="phone-pad"
                leadingIcon={<Phone size={18} color={t.text.muted} />}
              />
            </FormCard>

            {progress.data ? (
              <>
                {progress.data.showProgress ? (
                  <LevelCard points={progress.data.points} level={progress.data.level} managedName={managing ? name : null} />
                ) : null}
                <BadgesCard badges={progress.data.badges} earned={progress.data.badgesEarned} total={progress.data.badgesTotal} />
              </>
            ) : progress.isPending ? (
              <SkeletonGroup label="Cargando tu progreso" style={{ gap: spacing[4] }}>
                <Skeleton height={112} radius={radii.card} />
                <Skeleton height={190} radius={radii.card} />
              </SkeletonGroup>
            ) : null}
          </ScrollView>
        </KeyboardAvoidingView>
      )}

      <BottomActionBar
        primary={{
          label: "Guardar cambios",
          onPress: save,
          loading: form.saving,
          loadingLabel: "Guardando…",
          disabled: form.loading || form.saving,
        }}
      />

      {askDiscard ? (
        <DiscardChangesDialog
          onKeep={() => setAskDiscard(false)}
          onDiscard={() => {
            setAskDiscard(false);
            allowLeave.current = true;
            if (pendingAction.current) navigation.dispatch(pendingAction.current);
            else navigation.goBack();
          }}
        />
      ) : null}
    </SafeAreaView>
  );
}

function makeStyles(t: ThemeContextValue) {
  return StyleSheet.create({
    container: { flex: 1, backgroundColor: t.surface.bg },
    content: { padding: spacing[4], paddingTop: spacing[2], gap: spacing[4] },
    card: {
      backgroundColor: t.surface.bgCard,
      borderColor: t.border.default,
      borderRadius: radii.card,
      borderWidth: 1,
      borderBottomWidth: 4,
      padding: spacing[4],
    },
    profileRow: { flexDirection: "row", alignItems: "center", gap: spacing[4] },
    avatar: { width: 56, height: 56, borderRadius: 28, alignItems: "center", justifyContent: "center" },
    avatarText: { color: colors.white, fontSize: 20, fontFamily: nativeFont("heading", 900) },
    name: { fontSize: 17, fontFamily: nativeFont("heading", 800), color: t.text.primary },
    meta: { fontSize: fontSize.sm, fontFamily: nativeFont("body", 400), color: t.text.secondary },
    group: { gap: spacing[2] },
  });
}
