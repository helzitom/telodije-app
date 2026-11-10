import { useEffect, useMemo, useRef, useState } from "react";
import {
  ActivityIndicator,
  Animated,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from "react-native";
import { Stack, router, useLocalSearchParams } from "expo-router";
import * as Haptics from "expo-haptics";
import {
  enviarPut,
  obtenerJson,
  obtenerJsonAutenticado,
} from "../../src/api/cliente";
import { obtenerToken } from "../../src/sesion";
import type {
  DetalleHospedaje,
  ResenaPublica,
  ServicioEstado,
  Tarifa,
} from "../../src/tipos";
import { colores, radios, sombra, tipografia } from "../../src/tema";
import {
  estrellas,
  etiquetaFranja,
  etiquetaTipo,
  fechaCorta,
  soles,
  textoResenas,
} from "../../src/formato";

const ORDEN_FRANJAS = ["H4", "H6", "H8", "H12", "NOCHE_COMPLETA"];

const ESTADO_SERVICIO = {
  PRESENTE: { icono: "✓", fondo: colores.marcaSuave, color: colores.marca },
  AUSENTE: { icono: "✕", fondo: colores.acentoSuave, color: colores.acento },
  DESCONOCIDO: { icono: "?", fondo: colores.borde, color: colores.textoSuave },
} as const;

function Servicio({ servicio }: { servicio: ServicioEstado }) {
  const estado = ESTADO_SERVICIO[servicio.estado];
  return (
    <View style={styles.servicio}>
      <View style={[styles.servicioIcono, { backgroundColor: estado.fondo }]}>
        <Text style={[styles.servicioIconoTexto, { color: estado.color }]}>
          {estado.icono}
        </Text>
      </View>
      <Text style={styles.servicioNombre} numberOfLines={2}>
        {servicio.nombre}
      </Text>
    </View>
  );
}

function Resena({
  resena,
  esDueno,
  alResponder,
}: {
  resena: ResenaPublica;
  esDueno: boolean;
  alResponder: (resenaId: string, texto: string) => Promise<void>;
}) {
  const [respuesta, setRespuesta] = useState("");
  const [enviando, setEnviando] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function responder() {
    const texto = respuesta.trim();
    if (!texto) return;
    setEnviando(true);
    setError(null);
    try {
      await alResponder(resena.id, texto);
      setRespuesta("");
    } catch {
      setError("No pudimos guardar tu respuesta. Intenta de nuevo.");
    } finally {
      setEnviando(false);
    }
  }

  return (
    <View style={styles.resena}>
      <View style={styles.resenaCabecera}>
        <Text style={styles.resenaEstrellas}>
          {estrellas(resena.calificacion)}
        </Text>
        <Text style={styles.resenaFecha}>{fechaCorta(resena.fechaResena)}</Text>
      </View>

      <View style={styles.resenaMeta}>
        <Text style={styles.resenaAutor}>Anónimo</Text>
        <Text
          style={[
            styles.resenaVuelve,
            resena.volveria ? styles.vuelveSi : styles.vuelveNo,
          ]}
        >
          {resena.volveria ? "Volvería" : "No volvería"}
        </Text>
      </View>

      {resena.comentario && (
        <Text style={styles.resenaComentario}>{resena.comentario}</Text>
      )}

      {resena.respuestaDueno ? (
        <View style={styles.respuesta}>
          <Text style={styles.respuestaEtiqueta}>Respuesta del hospedaje</Text>
          <Text style={styles.respuestaTexto}>{resena.respuestaDueno}</Text>
        </View>
      ) : (
        esDueno && (
          <View style={styles.formularioRespuesta}>
            <TextInput
              style={styles.campoRespuesta}
              placeholder="Responde como hospedaje (máx. 1000 caracteres)"
              placeholderTextColor={colores.textoSuave}
              multiline
              maxLength={1000}
              value={respuesta}
              onChangeText={setRespuesta}
            />
            {error && <Text style={styles.errorRespuesta}>{error}</Text>}
            <Pressable
              onPress={responder}
              disabled={enviando || !respuesta.trim()}
              style={[
                styles.botonResponder,
                (enviando || !respuesta.trim()) && styles.botonDeshabilitado,
              ]}
            >
              {enviando ? (
                <ActivityIndicator color={colores.textoSobreAcento} />
              ) : (
                <Text style={styles.botonResponderTexto}>
                  Publicar respuesta
                </Text>
              )}
            </Pressable>
          </View>
        )
      )}
    </View>
  );
}

export default function DetalleHospedajeScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const [detalle, setDetalle] = useState<DetalleHospedaje | null>(null);
  const [resenas, setResenas] = useState<ResenaPublica[] | null>(null);
  const [errorDetalle, setErrorDetalle] = useState(false);
  const [franjaElegida, setFranjaElegida] = useState<string | null>(null);
  const [esDueno, setEsDueno] = useState(false);
  const escala = useRef(new Animated.Value(1)).current;

  useEffect(() => {
    let cancelado = false;
    setDetalle(null);
    setResenas(null);
    setErrorDetalle(false);

    obtenerJson<DetalleHospedaje>(`/api/v1/alojamientos/${id}/detalle`)
      .then((d) => {
        if (!cancelado) setDetalle(d);
      })
      .catch(() => {
        if (!cancelado) setErrorDetalle(true);
      });

    obtenerJson<ResenaPublica[]>(`/api/v1/alojamientos/${id}/resenas`)
      .then((r) => {
        if (!cancelado) setResenas(r);
      })
      .catch(() => {
        if (!cancelado) setResenas([]);
      });

    return () => {
      cancelado = true;
    };
  }, [id]);

  // Solo se consulta si hay sesión. Sin sesión, nadie es dueño.
  useEffect(() => {
    let cancelado = false;
    obtenerToken().then((token) => {
      if (!token) return;
      obtenerJsonAutenticado<{ dueno: boolean }>(
        `/api/v1/alojamientos/${id}/soy-dueno`,
      )
        .then((r) => {
          if (!cancelado) setEsDueno(r.dueno);
        })
        .catch(() => {
          if (!cancelado) setEsDueno(false);
        });
    });
    return () => {
      cancelado = true;
    };
  }, [id]);

  async function responderResena(resenaId: string, texto: string) {
    await enviarPut(`/api/v1/resenas/${resenaId}/respuesta`, { texto });
    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    // Recarga las reseñas para mostrar la respuesta publicada.
    const actualizadas = await obtenerJson<ResenaPublica[]>(
      `/api/v1/alojamientos/${id}/resenas`,
    );
    setResenas(actualizadas);
  }

  const tarifas = useMemo(() => {
    const porFranja = new Map<string, Tarifa>();
    for (const t of detalle?.tarifas ?? []) {
      const previa = porFranja.get(t.franja);
      if (!previa || t.precioPen < previa.precioPen) {
        porFranja.set(t.franja, t);
      }
    }
    return Array.from(porFranja.values()).sort(
      (a, b) =>
        ORDEN_FRANJAS.indexOf(a.franja) - ORDEN_FRANJAS.indexOf(b.franja),
    );
  }, [detalle]);

  const franjaActual = franjaElegida ?? tarifas[0]?.franja ?? null;
  const tarifaActiva = tarifas.find((t) => t.franja === franjaActual);

  function elegirFranja(franja: string) {
    if (franja === franjaActual) return;
    setFranjaElegida(franja);
    Haptics.selectionAsync();
    escala.setValue(0.94);
    Animated.spring(escala, {
      toValue: 1,
      friction: 5,
      tension: 140,
      useNativeDriver: true,
    }).start();
  }

  if (errorDetalle) {
    return (
      <View style={styles.centro}>
        <Text style={styles.textoCentro}>
          No pudimos cargar este hospedaje. Intenta de nuevo desde el mapa.
        </Text>
      </View>
    );
  }

  if (!detalle) {
    return (
      <View style={styles.centro}>
        <ActivityIndicator color={colores.marca} />
      </View>
    );
  }

  const promedio = detalle.calificacionPromedio;

  return (
    <>
      <Stack.Screen options={{ title: detalle.nombre }} />
      <ScrollView
        style={styles.contenedor}
        contentContainerStyle={styles.contenido}
        showsVerticalScrollIndicator={false}
      >
        <View style={styles.cabecera}>
          <Text style={styles.tipo}>{etiquetaTipo(detalle.tipo)}</Text>
          <Text style={styles.nombre}>{detalle.nombre}</Text>
          <Text style={styles.direccion}>{detalle.direccion}</Text>
          {detalle.verificado && (
            <View style={styles.sello}>
              <Text style={styles.selloTexto}>✓ Verificado por el dueño</Text>
            </View>
          )}
          <View style={styles.chips}>
            {detalle.tieneCochera && <Text style={styles.chip}>Cochera</Text>}
            {promedio !== null && (
              <Text style={styles.chip}>★ {promedio.toFixed(1)}</Text>
            )}
          </View>
        </View>

        <View style={styles.bloque}>
          <Text style={styles.tituloBloque}>Tarifas</Text>

          {tarifas.length === 0 ? (
            <Text style={styles.vacio}>
              Aún no hay precios reportados para este lugar.
            </Text>
          ) : (
            <>
              <View style={styles.selector}>
                {tarifas.map((t) => {
                  const activa = t.franja === franjaActual;
                  return (
                    <Pressable
                      key={t.franja}
                      onPress={() => elegirFranja(t.franja)}
                      style={[styles.franja, activa && styles.franjaActiva]}
                    >
                      <Text
                        style={[
                          styles.franjaTexto,
                          activa && styles.franjaTextoActiva,
                        ]}
                      >
                        {etiquetaFranja(t.franja)}
                      </Text>
                    </Pressable>
                  );
                })}
              </View>

              {tarifaActiva && (
                <Animated.View
                  style={[
                    styles.precioTarjeta,
                    { transform: [{ scale: escala }] },
                  ]}
                >
                  <Text style={styles.precioEtiqueta}>
                    {tarifaActiva.tipoHabitacion}
                  </Text>
                  <Text style={styles.precio}>
                    {soles(tarifaActiva.precioPen)}
                  </Text>
                  <Text style={styles.precioNota}>
                    Reportado por la comunidad. Confírmalo al llegar.
                  </Text>
                </Animated.View>
              )}
            </>
          )}
        </View>

        <View style={styles.bloque}>
          <Text style={styles.tituloBloque}>Servicios</Text>
          <View style={styles.servicios}>
            {detalle.servicios.map((s) => (
              <Servicio key={s.codigo} servicio={s} />
            ))}
          </View>
          <View style={styles.leyenda}>
            <Text style={styles.leyendaTexto}>
              ✓ Tiene ✕ No tiene ? Sin datos
            </Text>
          </View>
        </View>

        <View style={styles.bloque}>
          <Text style={styles.tituloBloque}>Reseñas</Text>

          {resenas === null && (
            <ActivityIndicator
              color={colores.marca}
              style={{ marginVertical: 12 }}
            />
          )}

          {resenas !== null && (
            <>
              <View style={styles.resumen}>
                <Text style={styles.resumenNumero}>
                  {promedio !== null ? promedio.toFixed(1) : "—"}
                </Text>
                <View style={{ flex: 1 }}>
                  {promedio !== null ? (
                    <Text style={styles.resumenEstrellas}>
                      {estrellas(promedio)}
                    </Text>
                  ) : (
                    <Text style={styles.resumenSinDatos}>
                      Sin calificaciones aún
                    </Text>
                  )}
                  <Text style={styles.resumenTexto}>
                    {textoResenas(detalle.totalResenas)}
                  </Text>
                </View>
              </View>

              {resenas.length === 0 ? (
                <Text style={styles.vacio}>
                  Todavía no hay reseñas. Sé el primero en contar tu
                  experiencia.
                </Text>
              ) : (
                resenas.map((r) => (
                  <Resena
                    key={r.id}
                    resena={r}
                    esDueno={esDueno}
                    alResponder={responderResena}
                  />
                ))
              )}
            </>
          )}
        </View>

        <Pressable
          onPress={() => router.push(`/resenar/${id}`)}
          style={styles.botonTemporal}
        >
          <Text style={styles.botonTemporalTexto}>Dejar reseña</Text>
        </Pressable>
        <Pressable
          onPress={() => {
            const precios = Object.fromEntries(
              tarifas.map((t) => [t.franja, t.precioPen]),
            );
            router.push({
              pathname: "/visitar/[id]",
              params: { id, precios: JSON.stringify(precios) },
            });
          }}
          style={styles.botonTemporal}
        >
          <Text style={styles.botonTemporalTexto}>Registrar mi visita</Text>
        </Pressable>
      </ScrollView>
    </>
  );
}

const styles = StyleSheet.create({
  contenedor: { flex: 1, backgroundColor: colores.fondo },
  contenido: { padding: 20, paddingBottom: 56 },
  centro: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    padding: 24,
    backgroundColor: colores.fondo,
  },
  textoCentro: {
    fontFamily: tipografia.cuerpo,
    color: colores.texto,
    textAlign: "center",
    lineHeight: 22,
  },

  cabecera: { marginBottom: 4 },
  tipo: {
    fontFamily: tipografia.enfasis,
    color: colores.acento,
    fontSize: 12,
    letterSpacing: 1.2,
    textTransform: "uppercase",
  },
  nombre: {
    fontFamily: tipografia.titulo,
    fontSize: 30,
    color: colores.texto,
    marginTop: 4,
    lineHeight: 36,
  },
  direccion: {
    fontFamily: tipografia.cuerpo,
    color: colores.textoSuave,
    marginTop: 6,
    fontSize: 14,
  },
  sello: {
    alignSelf: "flex-start",
    backgroundColor: colores.marcaSuave,
    borderRadius: radios.pildora,
    paddingHorizontal: 10,
    paddingVertical: 5,
    marginTop: 10,
  },
  selloTexto: {
    fontFamily: tipografia.enfasis,
    fontSize: 12,
    color: colores.marca,
  },
  chips: { flexDirection: "row", flexWrap: "wrap", gap: 8, marginTop: 14 },
  chip: {
    backgroundColor: colores.marcaSuave,
    color: colores.marca,
    borderRadius: radios.pildora,
    paddingHorizontal: 12,
    paddingVertical: 5,
    fontSize: 13,
    fontFamily: tipografia.cuerpoMedio,
    overflow: "hidden",
  },

  bloque: {
    backgroundColor: colores.superficie,
    borderRadius: radios.tarjeta,
    padding: 20,
    marginTop: 16,
    ...sombra,
  },
  tituloBloque: {
    fontFamily: tipografia.subtitulo,
    fontSize: 18,
    color: colores.texto,
    marginBottom: 14,
  },
  vacio: {
    fontFamily: tipografia.cuerpo,
    color: colores.textoSuave,
    lineHeight: 21,
  },

  selector: { flexDirection: "row", flexWrap: "wrap", gap: 8 },
  franja: {
    borderRadius: radios.pildora,
    paddingHorizontal: 14,
    paddingVertical: 9,
    borderWidth: 1,
    borderColor: colores.borde,
    backgroundColor: colores.superficie,
  },
  franjaActiva: { backgroundColor: colores.marca, borderColor: colores.marca },
  franjaTexto: {
    fontFamily: tipografia.enfasis,
    color: colores.texto,
    fontSize: 13,
  },
  franjaTextoActiva: { color: colores.textoSobreAcento },

  precioTarjeta: {
    marginTop: 18,
    backgroundColor: colores.fondo,
    borderRadius: radios.boton,
    padding: 18,
    alignItems: "center",
  },
  precioEtiqueta: {
    fontFamily: tipografia.cuerpoMedio,
    color: colores.textoSuave,
    fontSize: 13,
  },
  precio: {
    fontFamily: tipografia.titulo,
    fontSize: 40,
    color: colores.acento,
    marginTop: 4,
  },
  precioNota: {
    fontFamily: tipografia.cuerpo,
    color: colores.textoSuave,
    fontSize: 12,
    marginTop: 6,
    textAlign: "center",
  },

  servicios: { flexDirection: "row", flexWrap: "wrap", rowGap: 16 },
  servicio: { width: "33.33%", alignItems: "center", gap: 8 },
  servicioIcono: {
    width: 50,
    height: 50,
    borderRadius: 25,
    alignItems: "center",
    justifyContent: "center",
  },
  servicioIconoTexto: { fontFamily: tipografia.negrita, fontSize: 18 },
  servicioNombre: {
    fontFamily: tipografia.cuerpoMedio,
    fontSize: 12,
    color: colores.texto,
    textAlign: "center",
    minHeight: 30,
  },
  leyenda: { marginTop: 14 },
  leyendaTexto: {
    fontFamily: tipografia.cuerpo,
    fontSize: 12,
    color: colores.textoSuave,
    textAlign: "center",
  },

  resumen: {
    flexDirection: "row",
    alignItems: "center",
    gap: 16,
    backgroundColor: colores.fondo,
    borderRadius: radios.boton,
    padding: 16,
    marginBottom: 6,
  },
  resumenNumero: {
    fontFamily: tipografia.titulo,
    fontSize: 42,
    color: colores.texto,
  },
  resumenEstrellas: { color: colores.marca, fontSize: 18, letterSpacing: 2 },
  resumenSinDatos: {
    fontFamily: tipografia.cuerpoMedio,
    color: colores.textoSuave,
  },
  resumenTexto: {
    fontFamily: tipografia.cuerpo,
    color: colores.textoSuave,
    marginTop: 2,
  },

  resena: {
    borderTopWidth: 1,
    borderTopColor: colores.borde,
    paddingTop: 16,
    marginTop: 14,
  },
  resenaCabecera: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  resenaEstrellas: { color: colores.marca, fontSize: 15, letterSpacing: 1 },
  resenaFecha: {
    fontFamily: tipografia.cuerpo,
    color: colores.textoSuave,
    fontSize: 12,
  },
  resenaMeta: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginTop: 6,
  },
  resenaAutor: {
    fontFamily: tipografia.cuerpoMedio,
    color: colores.textoSuave,
    fontSize: 12,
  },
  resenaVuelve: {
    fontFamily: tipografia.enfasis,
    fontSize: 12,
    paddingHorizontal: 10,
    paddingVertical: 3,
    borderRadius: radios.pildora,
    overflow: "hidden",
  },
  vuelveSi: { backgroundColor: colores.marcaSuave, color: colores.marca },
  vuelveNo: { backgroundColor: colores.acentoSuave, color: colores.acento },
  resenaComentario: {
    fontFamily: tipografia.cuerpo,
    color: colores.texto,
    marginTop: 10,
    lineHeight: 21,
  },
  respuesta: {
    backgroundColor: colores.marcaSuave,
    borderRadius: radios.boton,
    padding: 12,
    marginTop: 12,
  },
  respuestaEtiqueta: {
    fontFamily: tipografia.enfasis,
    color: colores.marca,
    fontSize: 12,
  },
  respuestaTexto: {
    fontFamily: tipografia.cuerpo,
    color: colores.texto,
    marginTop: 4,
    lineHeight: 20,
  },

  formularioRespuesta: { marginTop: 12, gap: 8 },
  campoRespuesta: {
    fontFamily: tipografia.cuerpo,
    fontSize: 14,
    color: colores.texto,
    backgroundColor: colores.fondo,
    borderRadius: radios.boton,
    borderWidth: 1,
    borderColor: colores.borde,
    padding: 12,
    minHeight: 80,
    textAlignVertical: "top",
  },
  errorRespuesta: {
    fontFamily: tipografia.cuerpoMedio,
    color: colores.acento,
    fontSize: 12,
  },
  botonResponder: {
    backgroundColor: colores.marca,
    borderRadius: radios.boton,
    paddingVertical: 12,
    alignItems: "center",
  },
  botonDeshabilitado: { opacity: 0.5 },
  botonResponderTexto: {
    fontFamily: tipografia.enfasis,
    color: colores.textoSobreAcento,
  },

  botonTemporal: {
    backgroundColor: colores.marca,
    borderRadius: radios.boton,
    padding: 14,
    marginTop: 16,
    alignItems: "center",
  },
  botonTemporalTexto: {
    color: colores.textoSobreAcento,
    fontFamily: tipografia.enfasis,
  },
});
