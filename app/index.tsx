import { useCallback, useEffect, useRef, useState } from "react";
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
import MapView, { Marker, PROVIDER_GOOGLE } from "react-native-maps";
import { router, useFocusEffect } from "expo-router";
import { obtenerJson } from "../src/api/cliente";
import type { Hospedaje } from "../src/tipos";
import { colores, radios, sombra, tipografia } from "../src/tema";
import { cerrarSesion, obtenerToken } from "../src/sesion";
import { geohash } from "../src/geohash";
import {
  obtenerUbicacion,
  CENTRO_POR_DEFECTO,
  type Coordenadas,
} from "../src/ubicacion";
import { estiloMapa } from "../src/mapaEstilo";

const FRANJAS = [
  { id: "H4", etiqueta: "4 h" },
  { id: "H6", etiqueta: "6 h" },
  { id: "H8", etiqueta: "8 h" },
  { id: "H12", etiqueta: "12 h" },
  { id: "NOCHE_COMPLETA", etiqueta: "Noche" },
];

const ORDENES = [
  { id: "precio", etiqueta: "Más barato" },
  { id: "distancia", etiqueta: "Más cerca" },
] as const;

type Orden = (typeof ORDENES)[number]["id"];

function precioCorto(precio: number | null): string {
  return precio !== null ? `S/ ${precio.toFixed(0)}` : "Sin precio";
}

function precioLargo(precio: number | null): string {
  return precio !== null ? `S/ ${precio.toFixed(2)}` : "Sin precio";
}

function FlechaAnimada({ color }: { color: string }) {
  const desplazamiento = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    const bucle = Animated.loop(
      Animated.sequence([
        Animated.timing(desplazamiento, {
          toValue: -5,
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
      <View style={[styles.flechaTriangulo, { borderTopColor: color }]} />
    </Animated.View>
  );
}

export default function Mapa() {
  const [franja, setFranja] = useState("H4");
  const [orden, setOrden] = useState<Orden>("precio");
  const [hospedajes, setHospedajes] = useState<Hospedaje[] | null>(null);
  const [seleccionado, setSeleccionado] = useState<Hospedaje | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [conSesion, setConSesion] = useState(false);
  const [demanda, setDemanda] = useState<string | null>(null);

  const [centro, setCentro] = useState<Coordenadas>(CENTRO_POR_DEFECTO);
  const [ubicacionReal, setUbicacionReal] = useState(false);
  const [listo, setListo] = useState(false);

  // Espera la ubicación antes de mostrar el mapa, para no mostrar San Isidro por un instante.
  useEffect(() => {
    let activo = true;
    obtenerUbicacion().then(({ coordenadas, esReal }) => {
      if (!activo) return;
      setCentro(coordenadas);
      setUbicacionReal(esReal);
      setListo(true);
    });
    return () => {
      activo = false;
    };
  }, []);

  const ordenados = hospedajes
    ? [...hospedajes].sort((a, b) => {
        if (orden === "distancia") return a.distanciaMetros - b.distanciaMetros;
        if (a.precioDesde === null && b.precioDesde === null) return 0;
        if (a.precioDesde === null) return 1;
        if (b.precioDesde === null) return -1;
        return a.precioDesde - b.precioDesde;
      })
    : null;

  useFocusEffect(
    useCallback(() => {
      obtenerToken().then((t) => setConSesion(!!t));
    }, []),
  );

  useEffect(() => {
    if (!listo) return;
    setHospedajes(null);
    setSeleccionado(null);
    setError(null);
    obtenerJson<Hospedaje[]>(
      `/api/v1/alojamientos/cercanos?lat=${centro.lat}&lng=${centro.lng}&radioMetros=2000&limite=50&franja=${franja}`,
    )
      .then(setHospedajes)
      .catch((e: Error) => setError(e.message));
  }, [franja, centro, listo]);

  useEffect(() => {
    if (!listo) return;
    obtenerJson<{ nivel: string }>(
      `/api/v1/concurrencia?geohash=${geohash(centro.lat, centro.lng)}`,
    )
      .then((r) => setDemanda(r.nivel))
      .catch(() => setDemanda(null));
  }, [centro, listo]);

  async function salir() {
    await cerrarSesion();
    setConSesion(false);
  }

  if (!listo) {
    return (
      <View style={styles.centroCarga}>
        <ActivityIndicator color={colores.marca} size="large" />
        <Text style={styles.textoCarga}>Buscando tu ubicación…</Text>
      </View>
    );
  }

  return (
    <View style={styles.contenedor}>
      <MapView
        style={StyleSheet.absoluteFill}
        customMapStyle={estiloMapa}
        showsUserLocation={ubicacionReal}
        showsMyLocationButton
        showsPointsOfInterests={false}
        showsBuildings={false}
        initialRegion={{
          latitude: centro.lat,
          longitude: centro.lng,
          latitudeDelta: 0.03,
          longitudeDelta: 0.03,
        }}
      >
        {ordenados?.map((h) => {
          const activo = seleccionado?.id === h.id;
          return (
            <Marker
              key={`${h.id}-${activo ? "on" : "off"}`}
              coordinate={{ latitude: h.latitud, longitude: h.longitud }}
              anchor={{ x: 0.5, y: 1 }}
              tracksViewChanges={activo}
              onPress={() => setSeleccionado(h)}
            >
              <View style={styles.marcadorContenedor}>
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
                    {precioCorto(h.precioDesde)}
                  </Text>
                </View>
                {activo ? (
                  <FlechaAnimada color={colores.marca} />
                ) : (
                  <View style={styles.flechaFija} />
                )}
              </View>
            </Marker>
          );
        })}
      </MapView>

      <View style={styles.cabecera}>
        <View style={styles.filtrosBloque}>
          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={styles.chipsContenido}
          >
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

          <View style={styles.ordenFila}>
            {ORDENES.map((o) => {
              const activo = orden === o.id;
              return (
                <Pressable
                  key={o.id}
                  onPress={() => setOrden(o.id)}
                  style={[styles.orden, activo && styles.ordenActivo]}
                >
                  <Text
                    style={[
                      styles.ordenTexto,
                      activo && styles.ordenTextoActivo,
                    ]}
                  >
                    {o.etiqueta}
                  </Text>
                </Pressable>
              );
            })}
          </View>
        </View>

        <View style={styles.sesionBloque}>
          <Pressable
            onPress={
              conSesion
                ? () => router.push("/perfil")
                : () => router.push("/acceso")
            }
            style={styles.botonSesion}
          >
            <Text style={styles.botonSesionTexto}>
              {conSesion ? "Cuenta" : "Entrar"}
            </Text>
          </Pressable>
          {conSesion && (
            <Pressable onPress={salir} style={styles.botonSalir}>
              <Text style={styles.botonSalirTexto}>Salir</Text>
            </Pressable>
          )}
        </View>
      </View>

      {demanda === "ALTA" && (
        <View style={styles.avisoDemanda}>
          <Text style={styles.avisoDemandaTexto}>
            Alta demanda en este horario. Es posible que algunos lugares estén
            ocupados.
          </Text>
        </View>
      )}

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

      {seleccionado ? (
        <View style={styles.tarjeta}>
          <View style={styles.tarjetaCabecera}>
            <Text style={styles.tarjetaNombre} numberOfLines={1}>
              {seleccionado.nombre}
            </Text>
            <Text style={styles.tarjetaPrecio}>
              {precioLargo(seleccionado.precioDesde)}
            </Text>
            <Pressable onPress={() => setSeleccionado(null)} hitSlop={10}>
              <Text style={styles.cerrarTarjeta}>✕</Text>
            </Pressable>
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

          {!seleccionado.tienePrecios && (
            <View style={styles.sinPrecios}>
              <Text style={styles.sinPreciosTexto}>
                Sin precios aún. Visítalo y sé el primero en reportarlos.
              </Text>
            </View>
          )}

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
      ) : (
        <View style={styles.atribucion}>
          <Text style={styles.atribucionTexto}>
            © OpenStreetMap contributors
          </Text>
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  contenedor: { flex: 1, backgroundColor: colores.fondo },

  centroCarga: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: colores.fondo,
    gap: 12,
  },
  textoCarga: { fontFamily: tipografia.cuerpoMedio, color: colores.textoSuave },

  cabecera: {
    position: "absolute",
    top: 60,
    left: 16,
    right: 16,
    flexDirection: "row",
    alignItems: "flex-start",
    gap: 10,
  },
  filtrosBloque: { flex: 1 },
  chipsContenido: { gap: 8, paddingRight: 8 },
  chip: {
    backgroundColor: colores.superficie,
    borderRadius: radios.pildora,
    minWidth: 60,
    paddingHorizontal: 16,
    paddingVertical: 9,
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

  ordenFila: { flexDirection: "row", gap: 8, marginTop: 10 },
  orden: {
    backgroundColor: colores.superficie,
    borderRadius: radios.pildora,
    paddingHorizontal: 14,
    paddingVertical: 6,
    borderWidth: 1,
    borderColor: colores.borde,
  },
  ordenActivo: { backgroundColor: colores.marca, borderColor: colores.marca },
  ordenTexto: {
    fontFamily: tipografia.cuerpoMedio,
    fontSize: 12,
    color: colores.texto,
  },
  ordenTextoActivo: { color: colores.textoSobreAcento },

  sesionBloque: { alignItems: "flex-end", gap: 8 },
  botonSesion: {
    backgroundColor: colores.superficie,
    borderRadius: radios.pildora,
    paddingHorizontal: 14,
    paddingVertical: 9,
    borderWidth: 1,
    borderColor: colores.borde,
    ...sombra,
  },
  botonSesionTexto: {
    fontFamily: tipografia.enfasis,
    color: colores.marca,
    fontSize: 13,
  },
  botonSalir: { paddingHorizontal: 6, paddingVertical: 2 },
  botonSalirTexto: {
    fontFamily: tipografia.cuerpo,
    color: colores.textoSuave,
    fontSize: 12,
  },

  avisoDemanda: {
    position: "absolute",
    top: 170,
    left: 16,
    right: 16,
    backgroundColor: colores.acentoSuave,
    borderRadius: radios.boton,
    padding: 10,
  },
  avisoDemandaTexto: {
    fontFamily: tipografia.cuerpoMedio,
    fontSize: 12,
    color: colores.acento,
  },

  marcadorContenedor: { alignItems: "center" },
  marcador: {
    backgroundColor: colores.superficie,
    borderRadius: radios.pildora,
    paddingHorizontal: 12,
    paddingVertical: 7,
    borderWidth: 1.5,
    borderColor: colores.marca,
    shadowColor: colores.texto,
    shadowOpacity: 0.18,
    shadowRadius: 8,
    shadowOffset: { width: 0, height: 4 },
    elevation: 4,
  },
  marcadorActivo: {
    backgroundColor: colores.marca,
    borderColor: colores.marca,
  },
  marcadorTexto: {
    color: colores.marca,
    fontFamily: tipografia.negrita,
    fontSize: 13,
    letterSpacing: 0.2,
  },
  marcadorTextoActivo: { color: colores.superficie },

  flecha: { alignItems: "center", marginTop: 2 },
  flechaTriangulo: {
    width: 0,
    height: 0,
    borderLeftWidth: 7,
    borderRightWidth: 7,
    borderTopWidth: 9,
    borderLeftColor: "transparent",
    borderRightColor: "transparent",
    elevation: 4,
  },
  flechaFija: {
    width: 0,
    height: 0,
    borderLeftWidth: 6,
    borderRightWidth: 6,
    borderTopWidth: 8,
    borderLeftColor: "transparent",
    borderRightColor: "transparent",
    borderTopColor: colores.marca,
    marginTop: 2,
    elevation: 3,
  },

  cargando: { position: "absolute", top: 230, alignSelf: "center" },
  aviso: {
    position: "absolute",
    top: 230,
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
    marginRight: 12,
  },
  cerrarTarjeta: { color: colores.textoSuave, fontSize: 18 },
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
  sinPrecios: {
    backgroundColor: colores.acentoSuave,
    borderRadius: radios.boton,
    padding: 10,
    marginTop: 12,
  },
  sinPreciosTexto: {
    fontFamily: tipografia.cuerpoMedio,
    fontSize: 12,
    color: colores.acento,
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

  atribucion: {
    position: "absolute",
    bottom: 4,
    right: 8,
    backgroundColor: "rgba(255,253,249,0.85)",
    borderRadius: radios.pildora,
    paddingHorizontal: 8,
    paddingVertical: 2,
  },
  atribucionTexto: {
    fontFamily: tipografia.cuerpo,
    fontSize: 10,
    color: colores.textoSuave,
  },
});
