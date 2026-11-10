import { useEffect, useRef, useState } from "react";
import {
  ActivityIndicator,
  Animated,
  Easing,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from "react-native";
import MapView, { Marker } from "react-native-maps";
import { router } from "expo-router";
import { obtenerJson } from "../src/api/cliente";
import type { Hospedaje } from "../src/tipos";
import { colores, radios, sombra, tipografia } from "../src/tema";

const FRANJAS = [
  { id: "H4", etiqueta: "4 h" },
  { id: "H6", etiqueta: "6 h" },
  { id: "H8", etiqueta: "8 h" },
  { id: "H12", etiqueta: "12 h" },
  { id: "NOCHE_COMPLETA", etiqueta: "Noche" },
];

function FlechaAnimada() {
  const desplazamiento = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    const bucle = Animated.loop(
      Animated.sequence([
        Animated.timing(desplazamiento, {
          toValue: -6,
          duration: 500,
          easing: Easing.inOut(Easing.quad),
          useNativeDriver: true,
        }),
        Animated.timing(desplazamiento, {
          toValue: 0,
          duration: 500,
          easing: Easing.inOut(Easing.quad),
          useNativeDriver: true,
        }),
      ]),
    );
    bucle.start();
    return () => bucle.stop();
  }, [desplazamiento]);

  return (
    <Animated.View
      style={[styles.flecha, { transform: [{ translateY: desplazamiento }] }]}
    >
      <View style={styles.flechaTriangulo} />
    </Animated.View>
  );
}

export default function Mapa() {
  const [franja, setFranja] = useState("H4");
  const [hospedajes, setHospedajes] = useState<Hospedaje[] | null>(null);
  const [seleccionado, setSeleccionado] = useState<Hospedaje | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    setHospedajes(null);
    setSeleccionado(null);
    setError(null);
    obtenerJson<Hospedaje[]>(
      `/api/v1/alojamientos/cercanos?lat=-12.0910&lng=-77.0320&radioMetros=2000&limite=50&franja=${franja}`,
    )
      .then(setHospedajes)
      .catch((e: Error) => setError(e.message));
  }, [franja]);

  return (
    <View style={styles.contenedor}>
      <MapView
        style={StyleSheet.absoluteFill}
        initialRegion={{
          latitude: -12.091,
          longitude: -77.032,
          latitudeDelta: 0.03,
          longitudeDelta: 0.03,
        }}
      >
        {hospedajes?.map((h) => {
          const activo = seleccionado?.id === h.id;
          return (
            <Marker
              key={h.id}
              coordinate={{ latitude: h.latitud, longitude: h.longitud }}
              anchor={{ x: 0.5, y: 1 }}
              tracksViewChanges={activo}
              onPress={() => setSeleccionado(h)}
            >
              <Pressable
                onPress={() => setSeleccionado(h)}
                hitSlop={{ top: 12, bottom: 12, left: 12, right: 12 }}
              >
                <View style={styles.marcadorContenedor}>
                  {activo && <FlechaAnimada />}
                  <View
                    style={[styles.marcador, activo && styles.marcadorActivo]}
                  >
                    <Text
                      numberOfLines={1}
                      style={[
                        styles.marcadorTexto,
                        activo && styles.marcadorTextoActivo,
                      ]}
                    >
                      S/ {h.precioDesde.toFixed(0)}
                    </Text>
                  </View>
                </View>
              </Pressable>
            </Marker>
          );
        })}
      </MapView>

      <View style={styles.filtros}>
        <ScrollView horizontal showsHorizontalScrollIndicator={false}>
          {FRANJAS.map((f) => {
            const activo = franja === f.id;
            return (
              <Pressable
                key={f.id}
                onPress={() => setFranja(f.id)}
                style={[styles.chip, activo && styles.chipActivo]}
              >
                <Text
                  numberOfLines={1}
                  style={[styles.chipTexto, activo && styles.chipTextoActivo]}
                >
                  {f.etiqueta}
                </Text>
              </Pressable>
            );
          })}
        </ScrollView>
      </View>

      {!hospedajes && !error && (
        <View style={styles.cargando}>
          <ActivityIndicator color={colores.marca} />
        </View>
      )}

      {error && (
        <View style={styles.aviso}>
          <Text style={styles.avisoTexto}>
            No pudimos cargar los lugares cercanos.
          </Text>
        </View>
      )}

      {seleccionado && (
        <View style={styles.tarjeta}>
          <View style={styles.tarjetaCabecera}>
            <Text style={styles.tarjetaNombre} numberOfLines={1}>
              {seleccionado.nombre}
            </Text>
            <Pressable onPress={() => setSeleccionado(null)} hitSlop={10}>
              <Text
                style={{
                  color: colores.textoSuave,
                  fontSize: 18,
                  marginLeft: 12,
                }}
              >
                ✕
              </Text>
            </Pressable>
            <Text style={styles.tarjetaPrecio}>
              S/ {seleccionado.precioDesde.toFixed(2)}
            </Text>
          </View>

          <View style={styles.etiquetas}>
            <Text style={styles.etiqueta}>
              {Math.round(seleccionado.distanciaMetros)} m
            </Text>
            {seleccionado.tieneCochera && (
              <Text style={styles.etiqueta}>Cochera</Text>
            )}
            {seleccionado.calificacionPromedio !== null && (
              <Text style={styles.etiqueta}>
                ★ {seleccionado.calificacionPromedio.toFixed(1)}
              </Text>
            )}
          </View>

          <View style={styles.acciones}>
            <Pressable
              style={[styles.boton, styles.botonPrimario]}
              onPress={() => router.push(`/hospedaje/${seleccionado.id}`)}
            >
              <Text style={styles.botonPrimarioTexto}>
                Ver tarifas y reseñas
              </Text>
            </Pressable>
            <Pressable
              style={[styles.boton, styles.botonSecundario]}
              onPress={() => router.push(`/hospedaje/${seleccionado.id}`)}
            >
              <Text style={styles.botonSecundarioTexto}>Cómo llegar</Text>
            </Pressable>
          </View>
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  contenedor: { flex: 1, backgroundColor: colores.fondo },

  filtros: {
    position: "absolute",
    top: 60,
    left: 0,
    right: 0,
    paddingHorizontal: 16,
  },
  chip: {
    backgroundColor: colores.superficie,
    borderRadius: radios.pildora,
    minWidth: 64,
    paddingHorizontal: 18,
    paddingVertical: 10,
    marginRight: 8,
    alignItems: "center",
    borderWidth: 1,
    borderColor: colores.borde,
    ...sombra,
  },
  chipActivo: { backgroundColor: colores.marca, borderColor: colores.marca },
  chipTexto: {
    color: colores.texto,
    fontFamily: tipografia.enfasis,
    fontSize: 14,
  },
  chipTextoActivo: { color: colores.textoSobreAcento },

  marcadorContenedor: { alignItems: "center" },
  marcador: {
    backgroundColor: colores.superficie,
    borderRadius: radios.pildora,
    paddingHorizontal: 12,
    paddingVertical: 7,
    borderWidth: 2,
    borderColor: colores.marca,
    ...sombra,
  },
  marcadorActivo: {
    backgroundColor: colores.acento,
    borderColor: colores.acento,
  },
  marcadorTexto: {
    color: colores.marca,
    fontFamily: tipografia.negrita,
    fontSize: 13,
  },
  marcadorTextoActivo: { color: colores.textoSobreAcento },

  flecha: { alignItems: "center", marginBottom: 4 },
  flechaTriangulo: {
    width: 0,
    height: 0,
    borderLeftWidth: 8,
    borderRightWidth: 8,
    borderTopWidth: 10,
    borderLeftColor: "transparent",
    borderRightColor: "transparent",
    borderTopColor: colores.acento,
  },

  cargando: { position: "absolute", top: 130, alignSelf: "center" },
  aviso: {
    position: "absolute",
    top: 130,
    left: 16,
    right: 16,
    backgroundColor: colores.superficie,
    borderRadius: radios.tarjeta,
    padding: 14,
    ...sombra,
  },
  avisoTexto: {
    color: colores.texto,
    textAlign: "center",
    fontFamily: tipografia.cuerpo,
  },

  tarjeta: {
    position: "absolute",
    bottom: 24,
    left: 16,
    right: 16,
    backgroundColor: colores.superficie,
    borderRadius: radios.tarjeta,
    padding: 20,
    ...sombra,
  },
  tarjetaCabecera: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  tarjetaNombre: {
    flex: 1,
    marginRight: 12,
    fontSize: 18,
    color: colores.texto,
    fontFamily: tipografia.subtitulo,
  },
  tarjetaPrecio: {
    fontSize: 18,
    color: colores.acento,
    fontFamily: tipografia.titulo,
  },
  etiquetas: { flexDirection: "row", flexWrap: "wrap", gap: 8, marginTop: 10 },
  etiqueta: {
    backgroundColor: colores.marcaSuave,
    color: colores.marca,
    borderRadius: radios.pildora,
    paddingHorizontal: 10,
    paddingVertical: 4,
    fontSize: 12,
    fontFamily: tipografia.cuerpoMedio,
    overflow: "hidden",
  },

  acciones: { flexDirection: "row", gap: 10, marginTop: 16 },
  boton: {
    flex: 1,
    borderRadius: radios.boton,
    paddingVertical: 14,
    alignItems: "center",
  },
  botonPrimario: { backgroundColor: colores.marca },
  botonPrimarioTexto: {
    color: colores.textoSobreAcento,
    fontSize: 14,
    fontFamily: tipografia.enfasis,
  },
  botonSecundario: {
    backgroundColor: colores.superficie,
    borderWidth: 1,
    borderColor: colores.borde,
  },
  botonSecundarioTexto: {
    color: colores.marca,
    fontSize: 14,
    fontFamily: tipografia.enfasis,
  },
});
