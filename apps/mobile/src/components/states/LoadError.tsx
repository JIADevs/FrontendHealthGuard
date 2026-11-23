import { RefreshCw } from "lucide-react-native";
import { Button, useAppTheme } from "@helu/ui";
import { EmptyHero } from "./EmptyHero";

/**
 * Mockup m7 «Error al cargar», for any list: Helu thinking, «No se pudieron cargar …», the likely
 * cause and «Reintentar», in the place of the content (never a blank screen or a false «vacío»).
 * `title` is the whole sentence, so the verb agrees: «No se pudieron cargar tus citas», «No se pudo cargar tu día».
 */
export function LoadError({ title, onRetry, retrying = false, top }: { title: string; onRetry: () => void; retrying?: boolean; top?: number }) {
  const t = useAppTheme();
  return (
    <EmptyHero pose="think" top={top} title={title} description="Revisa tu conexión e intenta de nuevo.">
      <Button
        fullWidth
        icon={<RefreshCw size={17} strokeWidth={2.4} color={t.text.onSolid} />}
        onPress={onRetry}
        loading={retrying}
        loadingLabel="Cargando…"
      >
        Reintentar
      </Button>
    </EmptyHero>
  );
}
