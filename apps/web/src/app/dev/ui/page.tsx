import { notFound } from "next/navigation";
import { ComponentsPreview } from "./ComponentsPreview";

/**
 * Vista previa de los componentes v2 de @helu/ui (issue #35, Fase 0.2a).
 * Solo en desarrollo: en producción devuelve 404.
 */
export default function DevUiPage() {
  if (process.env.NODE_ENV === "production") notFound();
  return <ComponentsPreview />;
}
