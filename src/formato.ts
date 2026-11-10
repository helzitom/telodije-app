const ETIQUETAS_TIPO: Record<string, string> = {
  HOTEL: "Hotel",
  HOSTAL: "Hostal",
  HOSPEDAJE: "Hospedaje",
  OTRO: "Alojamiento",
};

const ETIQUETAS_FRANJA: Record<string, string> = {
  H4: "4 horas",
  H6: "6 horas",
  H8: "8 horas",
  H12: "12 horas",
  NOCHE_COMPLETA: "Noche",
};

export function etiquetaTipo(tipo: string): string {
  return ETIQUETAS_TIPO[tipo] ?? "Alojamiento";
}

export function etiquetaFranja(franja: string): string {
  return ETIQUETAS_FRANJA[franja] ?? franja;
}

export function soles(monto: number): string {
  return `S/ ${monto.toFixed(2)}`;
}

export function estrellas(valor: number): string {
  const n = Math.max(0, Math.min(5, Math.round(valor)));
  return "★".repeat(n) + "☆".repeat(5 - n);
}

export function fechaCorta(iso: string): string {
  // "2026-11-06T20:58:20Z" -> "06/11/2026". Evita depender de Intl en Hermes.
  const [anio, mes, dia] = iso.slice(0, 10).split("-");
  return `${dia}/${mes}/${anio}`;
}

export function textoResenas(total: number): string {
  return total === 1 ? "1 reseña" : `${total} reseñas`;
}
