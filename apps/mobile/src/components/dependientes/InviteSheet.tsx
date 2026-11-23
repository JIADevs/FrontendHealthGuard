import { useMemo, useRef, useState, type ComponentRef } from "react";
import { StyleSheet, Text, TextInput, View } from "react-native";
import { Mail, Send, UserPlus, Users } from "lucide-react-native";
import { useCreateDelegationMutation } from "@helu/api/hooks";
import { isApiError, type DelegationRelationship } from "@helu/api";
import {
  BottomSheet,
  Button,
  IconTile,
  PressableScale,
  TextField,
  fontSize,
  nativeFont,
  spacing,
  toneColors,
  useAppTheme,
  type BottomSheetHandle,
  type ThemeContextValue,
} from "@helu/ui";
import { notify } from "../../lib/notify";

const EMAIL = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

const OPTIONS: { value: DelegationRelationship; title: string; sub: string; tone: "success" | "ai"; icon: typeof Users }[] = [
  { value: "THEY_WILL_MANAGE_ME", title: "Invitar cuidador", sub: "Alguien que gestione tu cuenta", tone: "success", icon: Users },
  { value: "I_WANT_TO_MANAGE_THEM", title: "Invitar dependiente", sub: "Alguien cuya cuenta gestionarás", tone: "ai", icon: UserPlus },
];

/**
 * Mockup «Invitar» (module 8): one sheet with «¿A quién quieres invitar?», two radio cards, the
 * email and «Enviar invitación». The email is checked on submit and then while typing (formularios §5).
 */
export function InviteSheet({ onClose }: { onClose: () => void }) {
  const t = useAppTheme();
  const styles = useMemo(() => makeStyles(t), [t]);
  const sheetRef = useRef<BottomSheetHandle>(null);
  const emailRef = useRef<ComponentRef<typeof TextInput>>(null);
  const [relationship, setRelationship] = useState<DelegationRelationship>("THEY_WILL_MANAGE_ME");
  const [email, setEmail] = useState("");
  const [submitted, setSubmitted] = useState(false);
  const create = useCreateDelegationMutation();
  const carer = relationship === "THEY_WILL_MANAGE_ME";

  const value = email.trim();
  const error = !submitted ? undefined : !value ? "Escribe el correo de la persona." : !EMAIL.test(value) ? "Revisa el correo: falta algo (ej: nombre@ejemplo.com)." : undefined;

  const send = () => {
    setSubmitted(true);
    if (!value || !EMAIL.test(value)) {
      emailRef.current?.focus();
      return;
    }
    // mutateAsync, not mutate callbacks: if the sheet is closed while sending, the toast still shows.
    create
      .mutateAsync({ email: value.toLowerCase(), relationship, permissions: "FULL_ACCESS" })
      .then(() => {
        notify({ message: "Invitación enviada", description: `Le avisamos a ${value}.` });
        sheetRef.current ? sheetRef.current.close() : onClose();
      })
      .catch((err) =>
        notify({
          tone: "error",
          message: "No se pudo enviar la invitación",
          description: isApiError(err) ? err.message : "Revisa tu conexión e intenta de nuevo.",
        }),
      );
  };

  return (
    <BottomSheet
      ref={sheetRef}
      eyebrow="DEPENDIENTES"
      title="¿A quién quieres invitar?"
      icon={<IconTile tone="mission" size="lg" round icon={<UserPlus size={24} strokeWidth={2.4} color={t.brand.solid} />} />}
      // Nothing to discard once it is on its way.
      dirty={value.length > 0 && !create.isPending}
      onClose={onClose}
    >
      <View style={styles.body}>
        <View style={styles.options} accessibilityRole="radiogroup">
          {OPTIONS.map((o) => {
            const on = relationship === o.value;
            const Icon = o.icon;
            return (
              <PressableScale
                key={o.value}
                onPress={() => setRelationship(o.value)}
                accessibilityRole="radio"
                accessibilityState={{ checked: on }}
                accessibilityLabel={`${o.title}. ${o.sub}`}
                style={[styles.option, on && { borderColor: t.brand.focus, backgroundColor: t.brand.tint }]}
              >
                <IconTile tone={o.tone} icon={<Icon size={19} strokeWidth={2.2} color={toneColors(o.tone, t.mode).fg} />} />
                <View style={styles.copy}>
                  <Text style={styles.title}>{o.title}</Text>
                  <Text style={styles.meta}>{o.sub}</Text>
                </View>
                <View style={[styles.radio, { borderColor: on ? t.brand.solid : t.border.medium }]}>
                  {on ? <View style={[styles.dot, { backgroundColor: t.brand.solid }]} /> : null}
                </View>
              </PressableScale>
            );
          })}
        </View>
        <TextField
          label={carer ? "Correo del cuidador" : "Correo del dependiente"}
          value={email}
          onChange={setEmail}
          placeholder="Ej: nombre@ejemplo.com"
          keyboardType="email-address"
          autoCapitalize="none"
          autoCorrect={false}
          textContentType="emailAddress"
          leadingIcon={<Mail size={18} color={t.text.muted} />}
          error={error}
          inputRef={emailRef}
          returnKeyType="send"
          onSubmitEditing={send}
        />
        <Text style={styles.meta}>
          {carer
            ? "Ingresa el correo de la persona que va a gestionar tu cuenta."
            : "Ingresa el correo de la persona cuya cuenta vas a gestionar."}
        </Text>
        <Button
          fullWidth
          icon={<Send size={16} strokeWidth={2.2} color={t.text.onSolid} />}
          onPress={send}
          loading={create.isPending}
          loadingLabel="Enviando…"
        >
          Enviar invitación
        </Button>
      </View>
    </BottomSheet>
  );
}

function makeStyles(t: ThemeContextValue) {
  return StyleSheet.create({
    body: { gap: spacing[3] },
    options: { gap: spacing[2] },
    option: {
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
    copy: { flex: 1, minWidth: 0, gap: 2 },
    title: { fontSize: 14, lineHeight: 18, fontFamily: nativeFont("body", 600), color: t.text.primary },
    meta: { fontSize: fontSize.sm, lineHeight: 18, fontFamily: nativeFont("body", 400), color: t.text.secondary },
    radio: { width: 22, height: 22, borderRadius: 11, borderWidth: 2, alignItems: "center", justifyContent: "center" },
    dot: { width: 10, height: 10, borderRadius: 5 },
  });
}
