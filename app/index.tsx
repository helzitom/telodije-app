import { useEffect, useState } from "react";
import { ActivityIndicator, StyleSheet, Text, View } from "react-native";
import MapView, { Marker } from "react-native-maps";
import { obtenerJson } from "../src/api/cliente";
import type { Hospedaje } from "../src/tipos";

export default function Mapa() {
  const [hospedajes, setHospedajes] = useState<Hospedaje[] | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    obtenerJson<Hospedaje[]>(
      "/api/v1/alojamientos/cercanos?lat=-12.0910&lng=-77.0320&radioMetros=2000&limite=50"
    )
      .then(setHospedajes)
      .catch((e: Error) => setError(e.message));
  }, []);

  if (error) {
    return (
      <View style={styles.centro}>
        <Text>No pudimos cargar los hospedajes: {error}</Text>
      </View>
    );
  }

  if (!hospedajes) {
    return (
      <View style={styles.centro}>
        <ActivityIndicator />
      </View>
    );
  }

  return (
    <MapView
      style={styles.mapa}
      initialRegion={{
        latitude: -12.0910,
        longitude: -77.0320,
        latitudeDelta: 0.03,
        longitudeDelta: 0.03,
      }}
    >
      {hospedajes.map((h) => (
        <Marker
          key={h.id}
          coordinate={{ latitude: h.latitud, longitude: h.longitud }}
          title={h.nombre}
          description={`Desde S/ ${h.precioDesde.toFixed(2)}`}
        />
      ))}
    </MapView>
  );
}

const styles = StyleSheet.create({
  mapa: { flex: 1 },
  centro: { flex: 1, alignItems: "center", justifyContent: "center", padding: 24 },
});