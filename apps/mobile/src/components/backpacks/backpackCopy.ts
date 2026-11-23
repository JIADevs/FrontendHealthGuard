/** «1 documento», «3 documentos», «0 documentos». */
export function documentCountLabel(n: number): string {
  return `${n} ${n === 1 ? "documento" : "documentos"}`;
}

/** «Crear mochila con 2 documentos» / «Agregar 1 documento». */
export function withDocuments(verb: string, n: number): string {
  return `${verb} ${documentCountLabel(n)}`;
}
