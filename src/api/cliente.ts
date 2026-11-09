// IP de tu PC en la red local (confirmada desde el teléfono).
export const API_BASE = "http://192.168.18.84:8080";

export async function obtenerJson<T>(ruta: string): Promise<T> {
  const respuesta = await fetch(`${API_BASE}${ruta}`);
  if (!respuesta.ok) {
    throw new Error(`La API respondió ${respuesta.status}`);
  }
  return respuesta.json() as Promise<T>;
}