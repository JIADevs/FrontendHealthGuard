import { useCallback, useMemo, useRef, useState, type ComponentRef, type ReactNode } from "react";
import { Keyboard, Pressable, ScrollView, StyleSheet, Text, View } from "react-native";
import Animated, { FadeIn, FadeOut, LinearTransition } from "react-native-reanimated";
import { SafeAreaView } from "react-native-safe-area-context";
import { useFocusEffect } from "@react-navigation/native";
import { MoreVertical, Palette, UserPlus, Users, X } from "lucide-react-native";
import { useAuthStore } from "@helu/stores";
import {
  useDelegationContextColorsQuery,
  useManagedUsersQuery,
  useManagersQuery,
  useProfileQuery,
  useRespondDelegationMutation,
  useRevokeDelegationMutation,
  useUpdateDelegationColorsMutation,
} from "@helu/api/hooks";
import { isApiError, isDelegationInbound } from "@helu/api";
import {
  Button,
  ConfirmModal,
  Skeleton,
  SkeletonGroup,
  fontSize,
  motion,
  nativeFont,
  spacing,
  useAppTheme,
  useSkeletonVisible,
  type ThemeContextValue,
} from "@helu/ui";
import { ScreenHeader } from "../ScreenHeader";
import { AgendaRowActionsMenu, measureAgendaRowActionsMenuLeft } from "../agenda/AgendaRowActionsMenu";
import { EmptyHero } from "../backpacks/BackpacksEmpty";
import { notify } from "../../lib/notify";
import { ContextColorPicker } from "./ContextColorPicker";
import { InviteSheet } from "./InviteSheet";
import { PersonCard } from "./PersonCard";
import { resolveDelegationRingColor } from "./colorTokens";

const MONTHS_SHORT = ["ene", "feb", "mar", "abr", "may", "jun", "jul", "ago", "sept", "oct", "nov", "dic"];
const since = (iso: string) => {
  const d = new Date(iso);
  return `desde ${d.getDate()} ${MONTHS_SHORT[d.getMonth()]}`;
};

type Revoke = { id: string; name: string; kind: "dependent" | "carer" | "invite"; patientId?: string };

export interface DependientesProps {
  /** «Gestionar»: switch to that person's account and go to Inicio. */
  onManage: (patientId: string) => void;
  /** «Volver a mi cuenta» on the person being managed: back to my own account. */
  onExitManaging: () => void;
}

/**
 * Mockup «Dependientes» (module 8) with m7 «Dependientes · vacío» and «¿Revocar delegación?»:
 * people I manage («Gestionar»), who manages my account («Quitar acceso»), pending requests
 * («Aceptar» / «Rechazar», or my own invitations with «Cancelar») and «Invitar» in the header.
 */
export function Dependientes({ onManage, onExitManaging }: DependientesProps) {
  const t = useAppTheme();
  const managingId = useAuthStore((st) => (st.isManaging ? st.activePatientId : null));
  const styles = useMemo(() => makeStyles(t), [t]);
  const managedQuery = useManagedUsersQuery();
  const managersQuery = useManagersQuery();
  const colorsQuery = useDelegationContextColorsQuery();
  const updateColors = useUpdateDelegationColorsMutation();
  const respond = useRespondDelegationMutation();
  const revoke = useRevokeDelegationMutation();
  const profile = useProfileQuery();
  const storeEmail = useAuthStore((s) => s.user?.email);
  const userEmail = (profile.data?.email ?? storeEmail ?? "").toLowerCase();
  const [inviteOpen, setInviteOpen] = useState(false);
  const [toRevoke, setToRevoke] = useState<Revoke | null>(null);
  const [colorFor, setColorFor] = useState<{ patientId: string; color: string } | null>(null);

  const { refetch: refetchManaged } = managedQuery;
  const { refetch: refetchManagers } = managersQuery;
  useFocusEffect(
    useCallback(() => {
      void refetchManaged();
      void refetchManagers();
    }, [refetchManaged, refetchManagers]),
  );

  const loading = (managedQuery.isPending && !managedQuery.data) || (managersQuery.isPending && !managersQuery.data);
  const showSkeleton = useSkeletonVisible(loading);
  const managed = managedQuery.data ?? [];
  const managers = managersQuery.data ?? [];
  const contextColors = colorsQuery.data ?? {};

  const dependents = managed.filter((d) => d.status === "ACTIVE");
  const carers = managers.filter((m) => m.status === "ACTIVE");
  const pending = [...managed, ...managers].filter((d) => d.status === "PENDING");
  const inbound = pending.filter((d) => isDelegationInbound(d, userEmail));
  // A pending row in «managers» means someone wants to manage me; in «managed», that they want me to manage them.
  const managerIds = new Set(managers.map((m) => m.id));
  const outbound = pending.filter((d) => !isDelegationInbound(d, userEmail));
  const empty = !loading && dependents.length === 0 && carers.length === 0 && pending.length === 0;

  const doRevoke = () => {
    if (!toRevoke) return;
    revoke.mutate(toRevoke.id, {
      onSuccess: () => {
        const { isManaging, activePatientId, switchPatientContext } = useAuthStore.getState();
        if (toRevoke.patientId && isManaging && activePatientId === toRevoke.patientId) switchPatientContext(null);
        notify({
          message: toRevoke.kind === "invite" ? "Invitación cancelada" : toRevoke.kind === "carer" ? "Acceso quitado" : "Delegación revocada",
          description: toRevoke.name,
        });
        setToRevoke(null);
      },
      onError: (err) =>
        notify({ tone: "error", message: "No se pudo completar", description: isApiError(err) ? err.message : "Revisa tu conexión e intenta de nuevo." }),
    });
  };

  const answer = (id: string, action: "accept" | "reject", name: string) =>
    respond.mutate(
      { id, action },
      {
        onSuccess: () => notify({ message: action === "accept" ? "Solicitud aceptada" : "Solicitud rechazada", description: name }),
        onError: () => notify({ tone: "error", message: "No se pudo responder", description: "Revisa tu conexión e intenta de nuevo." }),
      },
    );

  const inviteButton = (
    <Button
      variant="secondary"
      size="sm"
      icon={<UserPlus size={15} strokeWidth={2.4} color={t.brand.text} />}
      onPress={() => {
        Keyboard.dismiss();
        setInviteOpen(true);
      }}
    >
      Invitar
    </Button>
  );

  return (
    <SafeAreaView style={styles.container} edges={["top"]}>
      {/* m7 «Dependientes · vacío»: the empty state carries the one «Invitar». */}
      <ScreenHeader title="Dependientes" right={empty ? undefined : inviteButton} />

      {showSkeleton ? (
        <SkeletonGroup label="Cargando personas" style={styles.content}>
          <Skeleton width={150} height={11} />
          {[0, 1].map((i) => (
            <View key={i} style={styles.skeletonCard}>
              <Skeleton width={44} height={44} radius={22} />
              <View style={{ flex: 1, gap: 6 }}>
                <Skeleton width="55%" height={15} />
                <Skeleton width="40%" height={12} />
              </View>
              <Skeleton width={96} height={44} radius={12} />
            </View>
          ))}
        </SkeletonGroup>
      ) : empty ? (
        <View style={styles.state}>
          <EmptyHero
            pose="wave"
            title="Nadie gestiona tu cuenta todavía"
            description="Invita a un cuidador o empieza a gestionar la cuenta de alguien más."
          >
            <Button fullWidth icon={<UserPlus size={17} strokeWidth={2.4} color={t.text.onSolid} />} onPress={() => setInviteOpen(true)}>
              Invitar
            </Button>
          </EmptyHero>
        </View>
      ) : (
        <ScrollView contentContainerStyle={styles.content}>
          {dependents.length > 0 ? (
            <Section title="Personas que gestiono">
              {dependents.map((d, i) => {
                const patientId = d.dependentUserId ?? d.id;
                const color = resolveDelegationRingColor(contextColors, patientId, i);
                const name = d.linkedUserName ?? d.linkedUserEmail;
                return (
                  <Animated.View key={d.id} entering={FadeIn.duration(motion.base)} exiting={FadeOut.duration(motion.base)} layout={LinearTransition.duration(motion.base)}>
                    <PersonCard
                      name={name}
                      detail={managingId === patientId ? "Gestionando ahora" : `Dependiente · ${since(d.createdAt)}`}
                      color={color}
                      right={
                        <View style={styles.actions}>
                          {managingId === patientId ? (
                            <Button variant="secondary" size="sm" onPress={onExitManaging} accessibilityLabel="Volver a mi cuenta">
                              Salir
                            </Button>
                          ) : (
                            <Button variant="secondary" size="sm" onPress={() => onManage(patientId)} accessibilityLabel={`Gestionar la cuenta de ${name}`}>
                              Gestionar
                            </Button>
                          )}
                          <PersonMenu
                            onColor={() => setColorFor({ patientId, color })}
                            onRevoke={() => setToRevoke({ id: d.id, name, kind: "dependent", patientId })}
                          />
                        </View>
                      }
                    />
                  </Animated.View>
                );
              })}
            </Section>
          ) : null}

          {carers.length > 0 ? (
            <Section title="Quién gestiona mi cuenta">
              {carers.map((m, i) => {
                const name = m.linkedUserName ?? m.linkedUserEmail;
                return (
                  <Animated.View key={m.id} entering={FadeIn.duration(motion.base)} exiting={FadeOut.duration(motion.base)} layout={LinearTransition.duration(motion.base)}>
                    <PersonCard
                      name={name}
                      detail="Cuidador activo · recibe tus recordatorios"
                      color={resolveDelegationRingColor(contextColors, m.managerUserId, i + 3)}
                      right={
                        <Pressable onPress={() => setToRevoke({ id: m.id, name, kind: "carer" })} hitSlop={12} accessibilityRole="button" accessibilityLabel={`Quitar acceso a ${name}`}>
                          <Text style={styles.redLink}>Quitar acceso</Text>
                        </Pressable>
                      }
                    />
                  </Animated.View>
                );
              })}
            </Section>
          ) : null}

          {pending.length > 0 ? (
            <Section title="Solicitudes pendientes">
              {inbound.map((d, i) => {
                const name = d.linkedUserName ?? d.linkedUserEmail;
                const theyManageMe = managerIds.has(d.id);
                return (
                  <Animated.View key={d.id} entering={FadeIn.duration(motion.base)} exiting={FadeOut.duration(motion.base)} layout={LinearTransition.duration(motion.base)}>
                    <PersonCard
                      name={name}
                      detail={theyManageMe ? "Quiere gestionar tu cuenta" : "Quiere que gestiones su cuenta"}
                      color={resolveDelegationRingColor(contextColors, d.id, i + 5)}
                      footer={
                        <View style={styles.answer}>
                          <View style={{ flex: 1 }}>
                            <Button variant="success" fullWidth onPress={() => answer(d.id, "accept", name)} disabled={respond.isPending}>
                              Aceptar
                            </Button>
                          </View>
                          <View style={{ flex: 1 }}>
                            <Button variant="secondary" fullWidth onPress={() => answer(d.id, "reject", name)} disabled={respond.isPending}>
                              Rechazar
                            </Button>
                          </View>
                        </View>
                      }
                    />
                  </Animated.View>
                );
              })}
              {outbound.map((d, i) => {
                const name = d.inviteeEmail || d.linkedUserEmail;
                return (
                  <Animated.View key={d.id} entering={FadeIn.duration(motion.base)} exiting={FadeOut.duration(motion.base)} layout={LinearTransition.duration(motion.base)}>
                    <PersonCard
                      name={name}
                      detail="Invitación enviada · esperando respuesta"
                      color={resolveDelegationRingColor(contextColors, d.id, i + 7)}
                      right={
                        <Pressable onPress={() => setToRevoke({ id: d.id, name, kind: "invite" })} hitSlop={12} accessibilityRole="button" accessibilityLabel={`Cancelar la invitación a ${name}`}>
                          <Text style={styles.redLink}>Cancelar</Text>
                        </Pressable>
                      }
                    />
                  </Animated.View>
                );
              })}
            </Section>
          ) : null}
        </ScrollView>
      )}

      {inviteOpen ? <InviteSheet onClose={() => setInviteOpen(false)} /> : null}

      {colorFor ? (
        <ContextColorPicker
          visible
          currentColor={colorFor.color}
          onClose={() => setColorFor(null)}
          onSelectColor={(color) => {
            updateColors.mutate({ ...contextColors, [colorFor.patientId]: color });
            setColorFor(null);
          }}
        />
      ) : null}

      {toRevoke ? (
        // Revoking waits for the server (#35): access must really be gone before we say so.
        <ConfirmModal
          title={toRevoke.kind === "invite" ? "¿Cancelar la invitación?" : toRevoke.kind === "carer" ? "¿Quitar el acceso?" : "¿Revocar delegación?"}
          message={
            toRevoke.kind === "invite"
              ? `${toRevoke.name} ya no podrá aceptarla.`
              : toRevoke.kind === "carer"
                ? `${toRevoke.name} dejará de gestionar tu cuenta y de recibir tus recordatorios.`
                : `${toRevoke.name} dejará de estar en tu lista y ya no podrás gestionar su cuenta.`
          }
          keepLabel="Mantener"
          confirmLabel={toRevoke.kind === "invite" ? "Cancelar invitación" : toRevoke.kind === "carer" ? "Quitar acceso" : "Revocar delegación"}
          confirmVariant="danger"
          icon={<Users size={26} strokeWidth={2.25} color={t.status.errorFg} />}
          iconTone="danger"
          actionsLayout="stacked"
          loading={revoke.isPending}
          onConfirm={doRevoke}
          onCancel={() => setToRevoke(null)}
        />
      ) : null}
    </SafeAreaView>
  );
}

function Section({ title, children }: { title: string; children: ReactNode }) {
  const t = useAppTheme();
  const styles = useMemo(() => makeStyles(t), [t]);
  return (
    <View style={styles.section}>
      <Text style={styles.eyebrow} accessibilityRole="header">
        {title}
      </Text>
      {children}
    </View>
  );
}

/** «⋯» of a person I manage: change their color, or revoke. */
function PersonMenu({ onColor, onRevoke }: { onColor: () => void; onRevoke: () => void }) {
  const t = useAppTheme();
  const ref = useRef<ComponentRef<typeof View>>(null);
  const [menu, setMenu] = useState<{ top: number; left: number } | null>(null);
  return (
    <>
      <View ref={ref} collapsable={false}>
        <Pressable
          onPress={() =>
            ref.current?.measureInWindow((x, y, w, h) => setMenu({ top: y + h + spacing[1], left: measureAgendaRowActionsMenuLeft(x, w) }))
          }
          style={{ width: 44, height: 44, alignItems: "center", justifyContent: "center" }}
          accessibilityRole="button"
          accessibilityLabel="Más opciones"
        >
          <MoreVertical size={18} color={t.text.muted} />
        </Pressable>
      </View>
      <AgendaRowActionsMenu
        visible={menu !== null}
        top={menu?.top ?? 0}
        left={menu?.left ?? 0}
        onClose={() => setMenu(null)}
        actions={[
          { icon: Palette, label: "Cambiar color", onPress: onColor },
          { icon: X, label: "Revocar delegación", onPress: onRevoke, destructive: true },
        ]}
      />
    </>
  );
}

function makeStyles(t: ThemeContextValue) {
  return StyleSheet.create({
    container: { flex: 1, backgroundColor: t.surface.bg },
    content: { padding: spacing[4], paddingTop: spacing[2], gap: spacing[5], paddingBottom: spacing[10] },
    state: { flex: 1, paddingHorizontal: spacing[4] },
    section: { gap: spacing[3] },
    eyebrow: {
      fontSize: fontSize.xs,
      fontFamily: nativeFont("heading", 900),
      letterSpacing: 0.9,
      textTransform: "uppercase",
      color: t.text.secondary,
    },
    actions: { flexDirection: "row", alignItems: "center", gap: 2 },
    answer: { flexDirection: "row", gap: 10 },
    redLink: { fontSize: 13, fontFamily: nativeFont("heading", 800), color: t.status.errorFg },
    skeletonCard: {
      flexDirection: "row",
      alignItems: "center",
      gap: spacing[3],
      padding: 14,
      borderRadius: 18,
      borderWidth: 1,
      borderBottomWidth: 4,
      borderColor: t.border.default,
      backgroundColor: t.surface.bgCard,
    },
  });
}
