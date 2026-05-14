/** Oculta la ruta interna del PDF de CURP en todas las respuestas JSON (solo bandera). El archivo se abre vía URL firmada para admin. */
export function sanitizePlayerRecordForApi(row: Record<string, unknown>): Record<string, unknown> {
  if (!Object.prototype.hasOwnProperty.call(row, 'curp_document_path')) return { ...row };
  const { curp_document_path: _path, ...rest } = row;
  return {
    ...rest,
    curp_document_registered: Boolean(_path),
  };
}
