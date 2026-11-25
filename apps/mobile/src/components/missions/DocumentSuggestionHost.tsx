import { useEffect, useState } from "react";
import type { MissionSuggestion } from "@helu/api";
import { useDocumentSuggestion } from "../../lib/documentSuggestion";
import { navigateTo } from "../../navigation/navigationRef";
import { DocumentMissionSheet } from "./DocumentMissionSheet";

/** The upload screen slides away over 350 ms (§3): the sheet waits for it, like the system picker. */
const AFTER_SCREEN_EXIT_MS = 450;

/**
 * App-root host of «¿Te acompañamos con esto?» (Misiones RF-68, mockups 4c). «Subir archivo» and
 * «Escanear» leave the suggestion in `useDocumentSuggestion` and close; the sheet opens over whatever is
 * underneath (Documentos or Inicio). Creating or saving opens the mission (mockup «D6», no toast);
 * closing leaves the suggestion in «Sugeridas» (DU-49).
 */
export function DocumentSuggestionHost() {
  const pending = useDocumentSuggestion((s) => s.pending);
  const clear = useDocumentSuggestion((s) => s.clear);
  const [ready, setReady] = useState<string | null>(null);

  useEffect(() => {
    if (!pending) return setReady(null);
    const timer = setTimeout(() => setReady(pending.suggestion.id), AFTER_SCREEN_EXIT_MS);
    return () => clearTimeout(timer);
  }, [pending]);

  if (!pending || ready !== pending.suggestion.id) return null;

  const suggestion: MissionSuggestion = {
    id: pending.suggestion.id,
    type: pending.suggestion.type ?? null,
    status: "pending",
    sourceMission: null,
    sourceDocument: pending.document,
    acceptedMissionId: null,
    createdAt: new Date().toISOString(),
    resolvedAt: null,
  };

  return (
    <DocumentMissionSheet
      key={suggestion.id}
      suggestion={suggestion}
      matches={pending.suggestion.matchingMissions}
      onClose={clear}
      onDone={(missionId) => {
        clear();
        navigateTo("MissionDetail", { id: missionId });
      }}
    />
  );
}
