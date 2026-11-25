import { useRef, useState } from "react";
import { StyleSheet, Text, View } from "react-native";
import { Pause, Route, ShieldCheck } from "lucide-react-native";
import {
  useCompleteMissionStepMutation,
  useLinkMissionDocumentMutation,
  type MatchingMission,
  type Mission,
  type MissionSuggestion,
  type MissionType,
} from "@helu/api";
import {
  BottomSheet,
  Button,
  Chip,
  IconTile,
  PressableScale,
  nativeFont,
  spacing,
  useAppTheme,
  type BottomSheetHandle,
} from "@helu/ui";
import { notify } from "../../lib/notify";
import { haptics } from "../../lib/haptics";
import { useIsOnline } from "../states/OfflineBanner";
import { MissionTypeIcon } from "./MissionTypeIcon";
import { MissionTypePicker } from "./MissionTypePicker";
import { SuggestionAcceptSheet } from "./SuggestionAcceptSheet";
import { documentSheetCopy, documentSheetTypeLabels, matchCopy, matchMeta, missionTypeTone } from "./missionCopy";

type Phase = { name: "type" } | { name: "match"; type: MissionType; matches: MatchingMission[] } | { name: "create"; type: MissionType };

/**
 * «¿Te acompañamos con esto?» after saving an order or an authorization (Misiones RF-68, RF-69,
 * mockups 4c «D2», «D2b», «D4», «D5», «D5b» → «D3»). Two sheets, one after the other (DU-46):
 *
 * 1. The four types, the subtype preselecting one (DU-52: nothing marked without it). «Continuar»
 *    without a choice shows the error; «Ahora no» or closing keeps the suggestion in «Sugeridas».
 * 2. For an authorization with missions waiting for theirs (DU-54): «Guardar en esta misión» (one, or a
 *    list with the newest marked) or «Crear otra misión». Otherwise «Crear misión» with the minimum
 *    datum prefilled with the document title (`SuggestionAcceptSheet`).
 */
export function DocumentMissionSheet({
  suggestion,
  matches = [],
  onDone,
  onClose,
}: {
  /** Its `sourceDocument` is the saved order or authorization. */
  suggestion: MissionSuggestion;
  /** Only right after saving an authorization: missions in progress waiting for it. */
  matches?: MatchingMission[];
  /** The mission was created or the authorization saved in one: open it (mockup «D6», no toast). */
  onDone: (missionId: string) => void;
  /** Closed without deciding: the suggestion stays pending in «Sugeridas». */
  onClose: () => void;
}) {
  const typeCode = suggestion.sourceDocument?.typeCode ?? null;
  const [phase, setPhase] = useState<Phase>({ name: "type" });

  const next = (type: MissionType) => {
    const waiting = typeCode === "eps_authorization" ? matches.filter((m) => m.type === type) : [];
    setPhase(waiting.length ? { name: "match", type, matches: waiting } : { name: "create", type });
  };

  if (phase.name === "create") {
    return (
      <SuggestionAcceptSheet
        suggestion={suggestion}
        type={phase.type}
        onCreated={(mission: Mission) => onDone(mission.id)}
        onClose={onClose}
      />
    );
  }
  if (phase.name === "match") {
    return (
      <MatchSheet
        documentId={suggestion.sourceDocument!.id}
        type={phase.type}
        matches={phase.matches}
        onSaved={onDone}
        onCreateAnother={() => setPhase({ name: "create", type: phase.type })}
        onClose={onClose}
      />
    );
  }
  return <TypeSheet suggestion={suggestion} typeCode={typeCode} onContinue={next} onClose={onClose} />;
}

function SugeridasNote() {
  const t = useAppTheme();
  return (
    <Text style={[styles.note, { color: t.text.secondary }]}>
      Si lo decides después, la dejamos en <Text style={{ color: t.text.primary, fontFamily: nativeFont("body", 700) }}>Sugeridas</Text>.
    </Text>
  );
}

function TypeSheet({
  suggestion,
  typeCode,
  onContinue,
  onClose,
}: {
  suggestion: MissionSuggestion;
  typeCode: string | null;
  onContinue: (type: MissionType) => void;
  onClose: () => void;
}) {
  const t = useAppTheme();
  const ref = useRef<BottomSheetHandle>(null);
  const copy = documentSheetCopy(typeCode);
  const preselected = suggestion.type ?? null;
  const [selected, setSelected] = useState<MissionType | null>(preselected);
  const [error, setError] = useState<string | undefined>();
  const Icon = typeCode === "eps_authorization" ? ShieldCheck : Route;
  // `close(after)` also calls `onClose`: moving on to the next sheet is not «Ahora no».
  const handingOff = useRef(false);

  const proceed = () => {
    if (!selected) {
      setError("Elige qué quieres conseguir");
      haptics.warning();
      return;
    }
    // The next sheet opens once this one has slid away (one sheet at a time).
    handingOff.current = true;
    ref.current?.close(() => onContinue(selected));
  };

  return (
    <BottomSheet
      ref={ref}
      eyebrow={copy.eyebrow}
      title={copy.title}
      icon={<IconTile round size="lg" tone="document" icon={<Icon size={22} strokeWidth={2.2} color={t.accent.docFg} />} />}
      onClose={() => {
        if (!handingOff.current) onClose();
      }}
    >
      <View style={styles.body}>
        <Text style={[styles.sub, { color: t.text.primary }]}>{copy.body}</Text>
        <MissionTypePicker
          selected={selected}
          onSelect={(type) => {
            setSelected(type);
            setError(undefined);
          }}
          labels={documentSheetTypeLabels}
          hints={preselected ? { [preselected]: copy.preselected } : undefined}
          error={error}
        />
        <Button variant="primary" fullWidth onPress={proceed}>
          Continuar
        </Button>
        <Button variant="ghost" fullWidth onPress={() => ref.current?.close()}>
          Ahora no
        </Button>
        <SugeridasNote />
      </View>
    </BottomSheet>
  );
}

function MatchSheet({
  documentId,
  type,
  matches,
  onSaved,
  onCreateAnother,
  onClose,
}: {
  documentId: string;
  type: MissionType;
  matches: MatchingMission[];
  onSaved: (missionId: string) => void;
  onCreateAnother: () => void;
  onClose: () => void;
}) {
  const t = useAppTheme();
  const online = useIsOnline();
  const ref = useRef<BottomSheetHandle>(null);
  const link = useLinkMissionDocumentMutation();
  const complete = useCompleteMissionStepMutation();
  // The newest is marked; the person may pick another (D5b).
  const [selected, setSelected] = useState(matches[0]!.id);
  const [saving, setSaving] = useState(false);
  const copy = matchCopy(type, matches.length);
  const anyPaused = matches.some((m) => m.status === "paused");
  // `close(after)` also calls `onClose`: saving or moving to «Crear otra misión» is not «Ahora no».
  const handingOff = useRef(false);

  const save = async () => {
    if (!online) return notify({ tone: "warning", message: "Sin conexión", description: "Revisa tu conexión y vuelve a intentarlo." });
    setSaving(true);
    try {
      // Same as attaching it in the step and saving it there: the step completes, a paused mission resumes.
      await link.mutateAsync({ missionId: selected, documentId, stepKey: "authorization" });
      await complete.mutateAsync({ missionId: selected, stepKey: "authorization", data: { status: "authorized" } });
      haptics.success();
      handingOff.current = true;
      ref.current?.close(() => onSaved(selected));
    } catch {
      notify({ tone: "error", message: "No se pudo guardar en la misión", action: { label: "Reintentar", onPress: () => void save() } });
    } finally {
      setSaving(false);
    }
  };

  return (
    <BottomSheet
      ref={ref}
      eyebrow="AUTORIZACIÓN GUARDADA"
      title={copy.title}
      icon={<IconTile round size="lg" tone="document" icon={<ShieldCheck size={22} strokeWidth={2.2} color={t.accent.docFg} />} />}
      onClose={() => {
        if (!handingOff.current) onClose();
      }}
    >
      <View style={styles.body}>
        {copy.sub ? <Text style={[styles.sub, { color: t.text.primary }]}>{copy.sub}</Text> : null}
        <View accessibilityRole="radiogroup" style={{ gap: spacing[2] }}>
          {matches.map((m) => {
            const on = m.id === selected;
            return (
              <PressableScale
                key={m.id}
                onPress={() => setSelected(m.id)}
                accessibilityRole="radio"
                accessibilityState={{ selected: on }}
                accessibilityLabel={`${m.title}, ${matchMeta(m.stepPosition, m.stepTotal, m.createdAt)}${m.status === "paused" ? ", pausada" : ""}`}
                style={[
                  styles.option,
                  { borderColor: on ? t.brand.solid : t.border.default, backgroundColor: on ? t.brand.tint : t.surface.bgCard },
                ]}
              >
                <IconTile tone={missionTypeTone[m.type]} icon={<MissionTypeIcon type={m.type} size={19} color={t.text.secondary} />} />
                <View style={{ flex: 1, gap: 2 }}>
                  <Text style={[styles.optionTitle, { color: t.text.primary }]} numberOfLines={2}>
                    {m.title}
                  </Text>
                  <Text style={[styles.optionHint, { color: t.text.secondary }]}>{matchMeta(m.stepPosition, m.stepTotal, m.createdAt)}</Text>
                </View>
                {m.status === "paused" ? (
                  <Chip label="Pausada" tone="neutral" icon={<Pause size={12} strokeWidth={2.6} color={t.text.secondary} />} />
                ) : null}
                <View style={[styles.radio, { borderColor: on ? t.brand.solid : t.border.default }]}>
                  {on ? <View style={[styles.radioDot, { backgroundColor: t.brand.solid }]} /> : null}
                </View>
              </PressableScale>
            );
          })}
        </View>
        <Text style={[styles.meta, { color: t.text.secondary }]}>
          {anyPaused
            ? "La guardamos en su paso «Autorización». Si la misión está en pausa, la reanudamos."
            : "La guardamos en su paso «Autorización»."}
        </Text>
        <Button variant="primary" fullWidth onPress={() => void save()} loading={saving} loadingLabel="Guardando…">
          Guardar en esta misión
        </Button>
        <Button
          variant="ghost"
          fullWidth
          disabled={saving}
          onPress={() => {
            handingOff.current = true;
            ref.current?.close(onCreateAnother);
          }}
        >
          Crear otra misión
        </Button>
        <SugeridasNote />
      </View>
    </BottomSheet>
  );
}

const styles = StyleSheet.create({
  body: { gap: spacing[3] },
  sub: { fontSize: 15, lineHeight: 21, fontFamily: nativeFont("body", 400) },
  meta: { fontSize: 13, lineHeight: 18, fontFamily: nativeFont("body", 400) },
  note: { fontSize: 13, lineHeight: 18, textAlign: "center", fontFamily: nativeFont("body", 400) },
  option: { flexDirection: "row", alignItems: "center", gap: spacing[3], padding: 12, borderRadius: 16, borderWidth: 1.5, minHeight: 44 },
  optionTitle: { fontSize: 15, fontFamily: nativeFont("body", 600) },
  optionHint: { fontSize: 13, fontFamily: nativeFont("body", 400) },
  radio: { width: 22, height: 22, borderRadius: 11, borderWidth: 2, alignItems: "center", justifyContent: "center" },
  radioDot: { width: 12, height: 12, borderRadius: 6 },
});
