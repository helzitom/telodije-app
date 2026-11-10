import * as FileSystem from "expo-file-system/legacy";
import { API_BASE, enviarJson, ErrorApi } from "./cliente";
import { obtenerToken } from "../sesion";
import type { VisitaMia } from "../tipos";

type IntentoFoto = { clave: string; urlSubida: string };

const ALFABETO =
  "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789+/";

// Convierte base64 a bytes sin depender de atob, que no siempre existe en Hermes.
function base64ABytes(base64: string): Uint8Array {
  const limpio = base64.replace(/[^A-Za-z0-9+/]/g, "");
  const longitud = Math.floor((limpio.length * 3) / 4);
  const bytes = new Uint8Array(longitud);
  let buffer = 0;
  let bits = 0;
  let indice = 0;

  for (const caracter of limpio) {
    buffer = (buffer << 6) | ALFABETO.indexOf(caracter);
    bits += 6;
    if (bits >= 8) {
      bits -= 8;
      bytes[indice++] = (buffer >> bits) & 0xff;
    }
  }
  return bytes;
}

export async function registrarVisitaConFoto(params: {
  alojamientoId: string;
  franja: string;
  horas: number;
  montoPagadoPen: number;
  fotoUri: string;
}): Promise<VisitaMia> {
  const token = await obtenerToken();
  if (!token) {
    throw new ErrorApi(401, "Inicia sesión para registrar tu visita.");
  }
  const cabecera = { Authorization: `Bearer ${token}` };

  // 1. Pedir la clave de la foto
  const intento = await enviarJson<IntentoFoto>(
    "/api/v1/fotos/llegada/intento",
    {},
    true,
  );

  // 2. Subir la foto como bytes reales
  const base64 = await FileSystem.readAsStringAsync(params.fotoUri, {
    encoding: FileSystem.EncodingType.Base64,
  });
  const bytes = base64ABytes(base64);

  const subida = await fetch(`${API_BASE}${intento.urlSubida}`, {
    method: "PUT",
    headers: { ...cabecera, "Content-Type": "image/jpeg" },
    body: bytes.buffer as ArrayBuffer,
  });
  if (!subida.ok) {
    throw new ErrorApi(
      subida.status,
      `Subida rechazada (${subida.status}). Intenta de nuevo.`,
    );
  }

  // 3. Registrar la visita con la clave
  return enviarJson<VisitaMia>(
    "/api/v1/visitas",
    {
      alojamientoId: params.alojamientoId,
      franja: params.franja,
      horas: params.horas,
      montoPagadoPen: params.montoPagadoPen,
      llegadaEn: new Date().toISOString(),
      claveFoto: intento.clave,
    },
    true,
  );
}
