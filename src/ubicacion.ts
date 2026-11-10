import * as Location from "expo-location";

export type Coordenadas = { lat: number; lng: number };

// Centro de San Isidro, usado si el usuario no concede el permiso.
export const CENTRO_POR_DEFECTO: Coordenadas = { lat: -12.091, lng: -77.032 };

export async function obtenerUbicacion(): Promise<{
  coordenadas: Coordenadas;
  esReal: boolean;
}> {
  const permiso = await Location.requestForegroundPermissionsAsync();
  if (permiso.status !== "granted") {
    return { coordenadas: CENTRO_POR_DEFECTO, esReal: false };
  }

  const posicion = await Location.getCurrentPositionAsync({
    accuracy: Location.Accuracy.Balanced,
  });

  return {
    coordenadas: {
      lat: posicion.coords.latitude,
      lng: posicion.coords.longitude,
    },
    esReal: true,
  };
}
