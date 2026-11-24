import { useCallback, useMemo, useState, type ReactNode } from "react";
import { Pressable, ScrollView, StyleSheet, Text, View } from "react-native";
import Animated, { FadeIn } from "react-native-reanimated";
import { SafeAreaView } from "react-native-safe-area-context";
import { useFocusEffect } from "@react-navigation/native";
import { useQueryClient } from "@tanstack/react-query";
import { Activity, Bell, ChevronRight, LogOut, Pill, Route, Settings as SettingsIcon, Share2, Users } from "lucide-react-native";
import { useAuthStore, useUnreadCount } from "@helu/stores";
import { isDelegationInbound, useUserProgressQuery } from "@helu/api";
import { useManagedUsersQuery, useManagersQuery, useProfileQuery } from "@helu/api/hooks";
import {
  Button,
  Chip,
  ConfirmModal,
  IconTile,
  PressableScale,
  Skeleton,
  SkeletonGroup,
  colors,
  fontSize,
  motion,
  nativeFont,
  radii,
  spacing,
  useAppTheme,
  type ThemeContextValue,
} from "@helu/ui";
import { initialsOf } from "../dependientes/PersonCard";
import { unregisterDevicePushToken } from "../../services/pushTokenRegistration";
import { LevelChip, ProfileStats } from "../motivation/ProfileProgress";

export interface MoreProps {
  onProfile: () => void;
  onMissions: () => void;
  onMedications: () => void;
  onTreatments: () => void;
  onShared: () => void;
  onDependents: () => void;
  onNotifications: () => void;
  onSettings: () => void;
}

/**
 * Mockup «Más» (module 9): the title, the profile card, «TU SALUD» and «CUENTA Y AYUDA» groups and
 * «Cerrar sesión». «Misiones» opens the TU SALUD group (DU-37). «Mi plan» and «Ayuda y contacto» wait for the backend or product
 * (#65); «Privacidad y seguridad» leaves the menu, as in the mockup.
 */
export function More(props: MoreProps) {
  const t = useAppTheme();
  const styles = useMemo(() => makeStyles(t), [t]);
  const profile = useProfileQuery();
  const progress = useUserProgressQuery();
  const storeEmail = useAuthStore((s) => s.user?.email);
  const logout = useAuthStore((s) => s.logout);
  const managingSomeone = useAuthStore((s) => s.isManaging && !!s.activePatientId);
  const qc = useQueryClient();
  const unread = useUnreadCount();
  const managed = useManagedUsersQuery();
  const managers = useManagersQuery();
  const [confirmLogout, setConfirmLogout] = useState(false);
  const [loggingOut, setLoggingOut] = useState(false);

  const { refetch: refetchManaged } = managed;
  const { refetch: refetchManagers } = managers;
  useFocusEffect(
    useCallback(() => {
      void refetchManaged();
      void refetchManagers();
    }, [refetchManaged, refetchManagers]),
  );

  const email = (profile.data?.email ?? storeEmail ?? "").toLowerCase();
  const name = profile.data?.name?.trim() || "Sin nombre";
  const pendingRequests = [...(managed.data ?? []), ...(managers.data ?? [])].filter(
    (d) => d.status === "PENDING" && isDelegationInbound(d, email),
  ).length;

  const doLogout = () => {
    setLoggingOut(true);
    // Unregister while the auth header is still there; logout always succeeds locally.
    void unregisterDevicePushToken().finally(() => {
      qc.clear();
      logout();
    });
  };

  return (
    <SafeAreaView style={styles.container} edges={["top"]}>
      <ScrollView contentContainerStyle={styles.content}>
        <Text style={styles.title} accessibilityRole="header">
          Más
        </Text>

        {profile.isPending && !profile.data ? (
          <SkeletonGroup label="Cargando tu perfil" style={[styles.card, styles.profileRow]}>
            <Skeleton width={56} height={56} radius={28} />
            <View style={{ flex: 1, gap: 8 }}>
              <Skeleton width="55%" height={16} />
              <Skeleton width="70%" height={12} />
            </View>
          </SkeletonGroup>
        ) : (
          // Mockup m6 «Más»: the profile card carries the level chip and the three boxes (v2.24).
          <PressableScale onPress={props.onProfile} accessibilityRole="button" accessibilityLabel={`Perfil de ${name}`} style={[styles.card, { gap: spacing[4] }]}>
            <View style={styles.profileRow}>
              <View style={[styles.avatar, { backgroundColor: t.brand.solid }]}>
                <Text style={styles.avatarText}>{initialsOf(profile.data?.name?.trim() || email || "?")}</Text>
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
              <ChevronRight size={18} color={t.text.muted} />
            </View>
            {progress.isError ? null : <ProfileStats progress={progress.data} />}
          </PressableScale>
        )}

        <Group title={managingSomeone ? "Su salud" : "Tu salud"}>
          <MenuRow icon={<Route size={18} color={t.text.onMuted} />} label="Misiones" onPress={props.onMissions} />
          <MenuRow icon={<Activity size={18} color={t.text.onMuted} />} label="Tratamientos" onPress={props.onTreatments} />
          <MenuRow icon={<Pill size={18} color={t.text.onMuted} />} label="Medicamentos" onPress={props.onMedications} />
          <MenuRow icon={<Share2 size={18} color={t.text.onMuted} />} label="Compartidos" onPress={props.onShared} />
          <MenuRow
            icon={<Users size={18} color={t.text.onMuted} />}
            label="Dependientes"
            onPress={props.onDependents}
            trailing={pendingRequests > 0 ? <Chip label={pendingRequests === 1 ? "1 solicitud" : `${pendingRequests} solicitudes`} tone="danger" /> : undefined}
          />
        </Group>

        <Group title="Cuenta y ayuda">
          <MenuRow
            icon={<Bell size={18} color={t.text.onMuted} />}
            label="Notificaciones"
            onPress={props.onNotifications}
            trailing={unread > 0 ? <Chip label={unread === 1 ? "1 nueva" : `${unread} nuevas`} tone="danger" /> : undefined}
          />
          <MenuRow icon={<SettingsIcon size={18} color={t.text.onMuted} />} label="Configuración" onPress={props.onSettings} />
        </Group>

        <Button
          variant="ghost"
          fullWidth
          icon={<LogOut size={18} color={t.text.secondary} />}
          onPress={() => setConfirmLogout(true)}
          loading={loggingOut}
          loadingLabel="Cerrando sesión…"
        >
          Cerrar sesión
        </Button>
      </ScrollView>

      {confirmLogout ? (
        <ConfirmModal
          title="¿Cerrar sesión?"
          message="Tus datos quedan guardados. Vuelves a entrar con tu correo y contraseña."
          keepLabel="Seguir aquí"
          confirmLabel="Cerrar sesión"
          confirmVariant="danger"
          onConfirm={() => {
            setConfirmLogout(false);
            doLogout();
          }}
          onCancel={() => setConfirmLogout(false)}
        />
      ) : null}
    </SafeAreaView>
  );
}

function Group({ title, children }: { title: string; children: ReactNode }) {
  const t = useAppTheme();
  const styles = useMemo(() => makeStyles(t), [t]);
  return (
    <View style={{ gap: spacing[2] }}>
      <Text style={styles.eyebrow} accessibilityRole="header">
        {title}
      </Text>
      <View style={styles.tightCard}>{children}</View>
    </View>
  );
}

/** Kit `mrow`: grey 18 px tile, label and a chevron (or a chip). */
function MenuRow({ icon, label, onPress, trailing }: { icon: ReactNode; label: string; onPress: () => void; trailing?: ReactNode }) {
  const t = useAppTheme();
  const styles = useMemo(() => makeStyles(t), [t]);
  return (
    <Pressable onPress={onPress} style={({ pressed }) => [styles.row, pressed && { opacity: 0.7 }]} accessibilityRole="button" accessibilityLabel={label}>
      <IconTile tone="neutral" icon={icon} />
      <Text style={styles.rowLabel}>{label}</Text>
      {trailing ? (
        // Counts arrive after the delegation/notification queries load: fade in instead of popping.
        <Animated.View entering={FadeIn.duration(motion.base)} style={styles.trailing}>
          {trailing}
        </Animated.View>
      ) : (
        <ChevronRight size={18} color={t.text.muted} />
      )}
    </Pressable>
  );
}

function makeStyles(t: ThemeContextValue) {
  return StyleSheet.create({
    container: { flex: 1, backgroundColor: t.surface.bg },
    content: { padding: spacing[4], paddingTop: spacing[3], gap: spacing[4], paddingBottom: spacing[12] + 40 },
    title: { fontSize: 26, lineHeight: 30, fontFamily: nativeFont("heading", 900), color: t.text.primary },
    card: {
      backgroundColor: t.surface.bgCard,
      borderColor: t.border.default,
      borderRadius: radii.card,
      borderWidth: 1,
      borderBottomWidth: 4,
      padding: spacing[4],
    },
    tightCard: {
      backgroundColor: t.surface.bgCard,
      borderColor: t.border.default,
      borderRadius: 18,
      borderWidth: 1,
      borderBottomWidth: 4,
      paddingHorizontal: 14,
      paddingVertical: 6,
    },
    profileRow: { flexDirection: "row", alignItems: "center", gap: spacing[4] },
    avatar: { width: 56, height: 56, borderRadius: 28, alignItems: "center", justifyContent: "center" },
    avatarText: { color: colors.white, fontSize: 20, fontFamily: nativeFont("heading", 900) },
    name: { fontSize: 17, fontFamily: nativeFont("heading", 800), color: t.text.primary },
    meta: { fontSize: fontSize.sm, fontFamily: nativeFont("body", 400), color: t.text.secondary },
    eyebrow: {
      fontSize: fontSize.xs,
      fontFamily: nativeFont("heading", 900),
      letterSpacing: 0.9,
      textTransform: "uppercase",
      color: t.text.secondary,
    },
    row: { flexDirection: "row", alignItems: "center", gap: spacing[3], minHeight: 52, paddingVertical: 4 },
    trailing: { alignSelf: "center", flexDirection: "row", alignItems: "center" },
    rowLabel: { flex: 1, fontSize: 15, fontFamily: nativeFont("body", 600), color: t.text.primary },
  });
}
