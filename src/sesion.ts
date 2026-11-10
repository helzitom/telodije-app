import * as SecureStore from "expo-secure-store";

const CLAVE_TOKEN = "telodije_access_token";

export async function guardarToken(token: string): Promise<void> {
  await SecureStore.setItemAsync(CLAVE_TOKEN, token);
}

export async function obtenerToken(): Promise<string | null> {
  return SecureStore.getItemAsync(CLAVE_TOKEN);
}

export async function cerrarSesion(): Promise<void> {
  await SecureStore.deleteItemAsync(CLAVE_TOKEN);
}
