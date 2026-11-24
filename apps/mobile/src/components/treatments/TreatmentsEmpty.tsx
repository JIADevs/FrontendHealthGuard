import { Plus } from "lucide-react-native";
import { Button, useAppTheme } from "@helu/ui";
import { EmptyHero } from "../states/EmptyHero";
import { TREATMENT_STATUS, type TreatmentStatus } from "./treatmentFormat";

/** Where the treatments are when the selected tab shows none: the tab with the most of them. */
export interface TreatmentsElsewhere {
  status: TreatmentStatus;
  count: number;
}

/**
 * m7 «Tratamientos · vacío»: waving Helu, what a treatment is for and «Crear tratamiento» as the only
 * action. Built on the shared `EmptyHero` (kit `empty`), like every list's empty state.
 */
export function TreatmentsEmpty({ onCreate }: { onCreate: () => void }) {
  const t = useAppTheme();
  return (
    <EmptyHero
      pose="wave"
      title="Todavía no tienes tratamientos"
      description="Agrupa medicamentos, citas y documentos de una misma condición."
    >
      <Button fullWidth icon={<Plus size={17} strokeWidth={2.6} color={t.text.onSolid} />} onPress={onCreate}>
        Crear tratamiento
      </Button>
    </EmptyHero>
  );
}

/**
 * A tab with nothing in it, like m9 «Documentos · filtro sin resultados (un filtro)»: thinking Helu,
 * the title, how many there are in another tab and the way there. Secondary button: «Crear» in the
 * header stays the screen's one primary action.
 */
export function TreatmentsTabEmpty({
  status,
  elsewhere,
  onShowTab,
}: {
  status: TreatmentStatus;
  elsewhere: TreatmentsElsewhere | null;
  onShowTab: (status: TreatmentStatus) => void;
}) {
  const other = elsewhere ? TREATMENT_STATUS[elsewhere.status] : null;
  return (
    <EmptyHero
      pose="think"
      title={`No tienes tratamientos ${TREATMENT_STATUS[status].many}`}
      description={
        elsewhere && other
          ? `Tienes ${elsewhere.count} ${elsewhere.count === 1 ? `tratamiento ${other.one}` : `tratamientos ${other.many}`}.`
          : "Cambia de pestaña para ver tus otros tratamientos."
      }
    >
      {elsewhere && other ? (
        <Button variant="secondary" fullWidth onPress={() => onShowTab(elsewhere.status)}>
          {`Ver ${other.tab}`}
        </Button>
      ) : null}
    </EmptyHero>
  );
}

/**
 * The search finds nothing in the selected tab (decision 9, v2.13; m7 «Búsqueda sin resultados»).
 * When another tab has matches it says where and goes there; otherwise it offers to clear the search.
 */
export function TreatmentsSearchEmpty({
  query,
  status,
  elsewhere,
  onShowTab,
  onClearSearch,
}: {
  query: string;
  status: TreatmentStatus;
  elsewhere: TreatmentsElsewhere | null;
  onShowTab: (status: TreatmentStatus) => void;
  onClearSearch: () => void;
}) {
  const q = query.trim();
  if (elsewhere) {
    const other = TREATMENT_STATUS[elsewhere.status];
    return (
      <EmptyHero
        pose="think"
        title={`No encontramos «${q}» en ${TREATMENT_STATUS[status].tab}`}
        description={
          elsewhere.count === 1 ? `Hay 1 resultado en ${other.tab}.` : `Hay ${elsewhere.count} resultados en ${other.tab}.`
        }
      >
        <Button variant="secondary" fullWidth onPress={() => onShowTab(elsewhere.status)}>
          {`Ver en ${other.tab}`}
        </Button>
      </EmptyHero>
    );
  }
  return (
    <EmptyHero pose="think" title={`No encontramos «${q}»`} description="Busca por el nombre o la descripción del tratamiento.">
      <Button variant="secondary" fullWidth onPress={onClearSearch}>
        Borrar la búsqueda
      </Button>
    </EmptyHero>
  );
}
