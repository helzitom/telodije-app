import {
  guardarSesion,
  obtenerRefresh,
  obtenerToken,
  cerrarSesion,
} from "../sesion";
import type { RespuestaLogin } from "../tipos";

export const API_BASE =
  process.env.EXPO_PUBLIC_API_BASE ?? "https://telodije-api.onrender.com";

export class ErrorApi extends Error {
  constructor(
    public estado: number,
    mensaje: string,
  ) {
    super(mensaje);
  }
}

// Evita que varias peticiones pidan renovación al mismo tiempo.
let renovando: Promise<boolean> | null = null;

async function renovarSesion(): Promise<boolean> {
  if (renovando) return renovando;

  renovando = (async () => {
    const refresh = await obtenerRefresh();
    if (!refresh) return false;

    const respuesta = await fetch(`${API_BASE}/api/v1/auth/refresh`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ refreshToken: refresh }),
    });

    if (!respuesta.ok) {
      // El refresh también venció o fue revocado: hay que volver a entrar.
      await cerrarSesion();
      return false;
    }

    const nueva = (await respuesta.json()) as RespuestaLogin;
    await guardarSesion(nueva.accessToken, nueva.refreshToken);
    return true;
  })();

  try {
    return await renovando;
  } finally {
    renovando = null;
  }
}

async function peticion<T>(
  metodo: "GET" | "POST",
  ruta: string,
  cuerpo?: unknown,
  autenticada = false,
  reintento = false,
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

  if (respuesta.status === 401 && autenticada && !reintento) {
    const renovado = await renovarSesion();
    if (renovado) return peticion<T>(metodo, ruta, cuerpo, autenticada, true);
  }

  if (!respuesta.ok) {
    let mensaje = `Error ${respuesta.status}`;
    try {
      const datos = await respuesta.json();
      if (datos?.error) mensaje = datos.error;
    } catch {
      // Sin cuerpo JSON: se usa el mensaje genérico.
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

export function obtenerJsonAutenticado<T>(ruta: string): Promise<T> {
  return peticion<T>("GET", ruta, undefined, true);
}

export async function enviarPut(ruta: string, cuerpo: unknown): Promise<void> {
  const token = await obtenerToken();
  const respuesta = await fetch(`${API_BASE}${ruta}`, {
    method: "PUT",
    headers: {
      "Content-Type": "application/json",
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
    },
    body: JSON.stringify(cuerpo),
  });
  if (!respuesta.ok) {
    throw new ErrorApi(respuesta.status, `Error ${respuesta.status}`);
  }
}
