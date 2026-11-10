import * as SecureStore from "expo-secure-store";

const CLAVE_ACCESO = "telodije_access_token";
const CLAVE_REFRESCO = "telodije_refresh_token";

export async function guardarSesion(
  accessToken: string,
  refreshToken: string,
): Promise<void> {
  await SecureStore.setItemAsync(CLAVE_ACCESO, accessToken);
  await SecureStore.setItemAsync(CLAVE_REFRESCO, refreshToken);
}

export async function obtenerToken(): Promise<string | null> {
  return SecureStore.getItemAsync(CLAVE_ACCESO);
}

export async function obtenerRefresh(): Promise<string | null> {
  return SecureStore.getItemAsync(CLAVE_REFRESCO);
}

export async function cerrarSesion(): Promise<void> {
  await SecureStore.deleteItemAsync(CLAVE_ACCESO);
  await SecureStore.deleteItemAsync(CLAVE_REFRESCO);
}
