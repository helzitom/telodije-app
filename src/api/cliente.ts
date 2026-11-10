import { obtenerToken } from "../sesion";

export const API_BASE = "http://192.168.18.84:8080";

export class ErrorApi extends Error {
  constructor(
    public estado: number,
    mensaje: string,
  ) {
    super(mensaje);
  }
}

async function peticion<T>(
  metodo: "GET" | "POST",
  ruta: string,
  cuerpo?: unknown,
  autenticada = false,
): Promise<T> {
  const cabeceras: Record<string, string> = {};
  if (cuerpo !== undefined) cabeceras["Content-Type"] = "application/json";
  if (autenticada) {
    const token = await obtenerToken();
    if (token) cabeceras["Authorization"] = `Bearer ${token}`;
  }

  const respuesta = await fetch(`${API_BASE}${ruta}`, {
    method: metodo,
    headers: cabeceras,
    body: cuerpo !== undefined ? JSON.stringify(cuerpo) : undefined,
  });

  if (!respuesta.ok) {
    let mensaje = `Error ${respuesta.status}`;
    try {
      const datos = await respuesta.json();
      if (datos?.error) mensaje = datos.error;
    } catch {
      // La respuesta no tiene cuerpo JSON; se usa el mensaje genérico.
    }
    throw new ErrorApi(respuesta.status, mensaje);
  }

  return respuesta.json() as Promise<T>;
}

export function obtenerJson<T>(ruta: string): Promise<T> {
  return peticion<T>("GET", ruta);
}

export function enviarJson<T>(
  ruta: string,
  cuerpo: unknown,
  autenticada = false,
): Promise<T> {
  return peticion<T>("POST", ruta, cuerpo, autenticada);
}
