import { useEffect, useState } from "react";
import {
  ActivityIndicator,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from "react-native";
import { Stack, router, useLocalSearchParams } from "expo-router";
import * as Haptics from "expo-haptics";
import { enviarJson, obtenerJson, ErrorApi } from "../../src/api/cliente";
import { obtenerToken } from "../../src/sesion";
import type { ServicioCatalogo, VisitaMia } from "../../src/tipos";
import { colores, radios, sombra, tipografia } from "../../src/tema";
import { etiquetaFranja, fechaCorta, soles } from "../../src/formato";

type EstadoServicio = "PRESENTE" | "AUSENTE" | "DESCONOCIDO";

const OPCIONES_SERVICIO: { valor: EstadoServicio; etiqueta: string }[] = [
  { valor: "PRESENTE", etiqueta: "Tiene" },
  { valor: "AUSENTE", etiqueta: "No tiene" },
  { valor: "DESCONOCIDO", etiqueta: "No sé" },
];

export default function ResenarScreen() {
  const { id: alojamientoId } = useLocalSearchParams<{ id: string }>();
  const [visitas, setVisitas] = useState<VisitaMia[] | null>(null);
  const [servicios, setServicios] = useState<ServicioCatalogo[]>([]);
  const [visitaElegida, setVisitaElegida] = useState<string | null>(null);
  const [calificacion, setCalificacion] = useState(0);
  const [volveria, setVolveria] = useState<boolean | null>(null);
  const [comentario, setComentario] = useState("");
  const [estados, setEstados] = useState<Record<number, EstadoServicio>>({});
  const [enviando, setEnviando] = useState(false);
  const [mensaje, setMensaje] = useState<string | null>(null);
  const [sinSesion, setSinSesion] = useState(false);

  useEffect(() => {
    (async () => {
      const token = await obtenerToken();
      if (!token) {
        setSinSesion(true);
        return;
      }
      try {
        const headers = { Authorization: `Bearer ${token}` };
        const respuesta = await fetch(
          `${(await import("../../src/api/cliente")).API_BASE}/api/v1/visitas/mias`,
          { headers },
        );
        if (!respuesta.ok) throw new Error();
        const todas: VisitaMia[] = await respuesta.json();
        setVisitas(todas.filter((v) => v.alojamientoId === alojamientoId));
      } catch {
        setVisitas([]);
      }
      try {
        setServicios(
          await obtenerJson<ServicioCatalogo[]>("/api/v1/servicios"),
        );
      } catch {
        setServicios([]);
      }
    })();
  }, [alojamientoId]);

  function tocarEstrella(n: number) {
    Haptics.selectionAsync();
    setCalificacion(n);
  }

  function elegirServicio(servicioId: number, estado: EstadoServicio) {
    Haptics.selectionAsync();
    setEstados((previo) => ({ ...previo, [servicioId]: estado }));
  }

  async function enviar() {
    setMensaje(null);
    if (!visitaElegida)
      return setMensaje("Elige la visita que quieres calificar.");
    if (calificacion === 0)
      return setMensaje("Toca las estrellas para calificar.");
    if (volveria === null) return setMensaje("Dinos si volverías.");

    setEnviando(true);
    try {
      const token = await obtenerToken();
      const cuerpo = {
        visitaId: visitaElegida,
        calificacion,
        volveria,
        comentario: comentario.trim() || null,
        servicios: Object.entries(estados).map(([servicioId, estado]) => ({
          servicioId: Number(servicioId),
          estado,
        })),
      };
      await enviarJson("/api/v1/resenas", cuerpo, true);
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      setMensaje("¡Gracias! Tu reseña quedó publicada de forma anónima.");
      setTimeout(() => router.back(), 1200);
    } catch (e) {
      const texto =
        e instanceof ErrorApi && e.estado === 409
          ? "Ya calificaste esta visita o este hospedaje."
          : e instanceof ErrorApi
            ? e.message
            : "No pudimos enviar tu reseña. Intenta de nuevo.";
      setMensaje(texto);
    } finally {
      setEnviando(false);
    }
  }

  if (sinSesion) {
    return (
      <View style={styles.centro}>
        <Stack.Screen options={{ title: "Dejar reseña" }} />
        <Text style={styles.titulo}>Inicia sesión para opinar</Text>
        <Text style={styles.subtitulo}>
          Tu reseña es anónima. Solo pedimos la cuenta para confirmar que
          estuviste ahí.
        </Text>
        <Pressable style={styles.boton} onPress={() => router.push("/acceso")}>
          <Text style={styles.botonTexto}>Iniciar sesión</Text>
        </Pressable>
      </View>
    );
  }

  if (visitas === null) {
    return (
      <View style={styles.centro}>
        <ActivityIndicator color={colores.marca} />
      </View>
    );
  }

  if (visitas.length === 0) {
    return (
      <View style={styles.centro}>
        <Stack.Screen options={{ title: "Dejar reseña" }} />
        <Text style={styles.titulo}>Aún no tienes visitas aquí</Text>
        <Text style={styles.subtitulo}>
          Solo puedes opinar sobre lugares donde estuviste. Registra tu visita
          primero.
        </Text>
      </View>
    );
  }

  return (
    <ScrollView
      style={styles.contenedor}
      contentContainerStyle={styles.contenido}
      keyboardShouldPersistTaps="handled"
    >
      <Stack.Screen options={{ title: "Dejar reseña" }} />

      <View style={styles.bloque}>
        <Text style={styles.tituloBloque}>¿Cuál visita quieres calificar?</Text>
        {visitas.map((v) => {
          const activa = visitaElegida === v.id;
          return (
            <Pressable
              key={v.id}
              onPress={() => {
                Haptics.selectionAsync();
                setVisitaElegida(v.id);
              }}
              style={[styles.visita, activa && styles.visitaActiva]}
            >
              <Text style={[styles.visitaTitulo, activa && styles.textoClaro]}>
                {etiquetaFranja(v.franja)} · {soles(v.montoPagadoPen)}
              </Text>
              <Text style={[styles.visitaFecha, activa && styles.textoClaro]}>
                {fechaCorta(v.llegadaEn)}
              </Text>
            </Pressable>
          );
        })}
      </View>

      <View style={styles.bloque}>
        <Text style={styles.tituloBloque}>Tu calificación</Text>
        <View style={styles.estrellas}>
          {[1, 2, 3, 4, 5].map((n) => (
            <Pressable key={n} onPress={() => tocarEstrella(n)} hitSlop={6}>
              <Text
                style={[
                  styles.estrella,
                  n <= calificacion
                    ? styles.estrellaActiva
                    : styles.estrellaInactiva,
                ]}
              >
                ★
              </Text>
            </Pressable>
          ))}
        </View>
      </View>

      <View style={styles.bloque}>
        <Text style={styles.tituloBloque}>¿Volverías?</Text>
        <View style={styles.dosBotones}>
          <Pressable
            onPress={() => setVolveria(true)}
            style={[styles.opcion, volveria === true && styles.opcionSi]}
          >
            <Text
              style={[
                styles.opcionTexto,
                volveria === true && styles.textoClaro,
              ]}
            >
              Sí, volvería
            </Text>
          </Pressable>
          <Pressable
            onPress={() => setVolveria(false)}
            style={[styles.opcion, volveria === false && styles.opcionNo]}
          >
            <Text
              style={[
                styles.opcionTexto,
                volveria === false && styles.textoClaro,
              ]}
            >
              No volvería
            </Text>
          </Pressable>
        </View>
      </View>

      <View style={styles.bloque}>
        <Text style={styles.tituloBloque}>Servicios</Text>
        <Text style={styles.ayuda}>Opcional. Marca lo que encontraste.</Text>
        {servicios.map((s) => (
          <View key={s.id} style={styles.servicioFila}>
            <Text style={styles.servicioNombre}>{s.nombre}</Text>
            <View style={styles.segmentos}>
              {OPCIONES_SERVICIO.map((o) => {
                const activo = estados[s.id] === o.valor;
                return (
                  <Pressable
                    key={o.valor}
                    onPress={() => elegirServicio(s.id, o.valor)}
                    style={[styles.segmento, activo && styles.segmentoActivo]}
                  >
                    <Text
                      style={[
                        styles.segmentoTexto,
                        activo && styles.textoClaro,
                      ]}
                    >
                      {o.etiqueta}
                    </Text>
                  </Pressable>
                );
              })}
            </View>
          </View>
        ))}
      </View>

      <View style={styles.bloque}>
        <Text style={styles.tituloBloque}>Comentario</Text>
        <TextInput
          style={styles.comentario}
          placeholder="Cuéntanos cómo fue tu estadía (opcional)"
          placeholderTextColor={colores.textoSuave}
          multiline
          maxLength={1000}
          value={comentario}
          onChangeText={setComentario}
        />
        <Text style={styles.ayuda}>{comentario.length}/1000</Text>
      </View>

      {mensaje && <Text style={styles.mensaje}>{mensaje}</Text>}

      <Pressable
        style={[styles.boton, enviando && styles.botonDeshabilitado]}
        onPress={enviar}
        disabled={enviando}
      >
        {enviando ? (
          <ActivityIndicator color={colores.textoSobreAcento} />
        ) : (
          <Text style={styles.botonTexto}>Publicar reseña</Text>
        )}
      </Pressable>

      <Text style={styles.pie}>
        Tu nombre nunca se muestra. Solo se publica tu opinión.
      </Text>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  contenedor: { flex: 1, backgroundColor: colores.fondo },
  contenido: { padding: 20, paddingBottom: 56 },
  centro: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    padding: 28,
    backgroundColor: colores.fondo,
  },
  titulo: {
    fontFamily: tipografia.titulo,
    fontSize: 24,
    color: colores.texto,
    textAlign: "center",
  },
  subtitulo: {
    fontFamily: tipografia.cuerpo,
    color: colores.textoSuave,
    textAlign: "center",
    marginTop: 8,
    marginBottom: 24,
    lineHeight: 21,
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
    fontSize: 17,
    color: colores.texto,
    marginBottom: 12,
  },
  ayuda: {
    fontFamily: tipografia.cuerpo,
    color: colores.textoSuave,
    fontSize: 12,
    marginTop: 4,
  },

  visita: {
    borderRadius: radios.boton,
    borderWidth: 1,
    borderColor: colores.borde,
    padding: 14,
    marginBottom: 8,
    backgroundColor: colores.fondo,
  },
  visitaActiva: { backgroundColor: colores.marca, borderColor: colores.marca },
  visitaTitulo: {
    fontFamily: tipografia.enfasis,
    color: colores.texto,
    fontSize: 15,
  },
  visitaFecha: {
    fontFamily: tipografia.cuerpo,
    color: colores.textoSuave,
    fontSize: 12,
    marginTop: 2,
  },

  estrellas: {
    flexDirection: "row",
    justifyContent: "space-between",
    paddingHorizontal: 4,
  },
  estrella: { fontSize: 40 },
  estrellaActiva: { color: colores.acento },
  estrellaInactiva: { color: colores.borde },

  dosBotones: { flexDirection: "row", gap: 10 },
  opcion: {
    flex: 1,
    borderRadius: radios.boton,
    borderWidth: 1,
    borderColor: colores.borde,
    paddingVertical: 14,
    alignItems: "center",
    backgroundColor: colores.fondo,
  },
  opcionSi: { backgroundColor: colores.marca, borderColor: colores.marca },
  opcionNo: { backgroundColor: colores.acento, borderColor: colores.acento },
  opcionTexto: { fontFamily: tipografia.enfasis, color: colores.texto },

  servicioFila: { marginTop: 12 },
  servicioNombre: {
    fontFamily: tipografia.cuerpoMedio,
    color: colores.texto,
    marginBottom: 6,
  },
  segmentos: {
    flexDirection: "row",
    backgroundColor: colores.fondo,
    borderRadius: radios.pildora,
    padding: 3,
  },
  segmento: {
    flex: 1,
    borderRadius: radios.pildora,
    paddingVertical: 8,
    alignItems: "center",
  },
  segmentoActivo: { backgroundColor: colores.marca },
  segmentoTexto: {
    fontFamily: tipografia.enfasis,
    fontSize: 12,
    color: colores.texto,
  },

  comentario: {
    fontFamily: tipografia.cuerpo,
    fontSize: 15,
    color: colores.texto,
    backgroundColor: colores.fondo,
    borderRadius: radios.boton,
    padding: 14,
    minHeight: 100,
    textAlignVertical: "top",
    borderWidth: 1,
    borderColor: colores.borde,
  },

  mensaje: {
    fontFamily: tipografia.cuerpoMedio,
    color: colores.acento,
    textAlign: "center",
    marginTop: 16,
  },
  boton: {
    backgroundColor: colores.marca,
    borderRadius: radios.boton,
    paddingVertical: 16,
    alignItems: "center",
    marginTop: 20,
  },
  botonDeshabilitado: { opacity: 0.6 },
  botonTexto: {
    fontFamily: tipografia.enfasis,
    color: colores.textoSobreAcento,
    fontSize: 16,
  },
  textoClaro: { color: colores.textoSobreAcento },
  pie: {
    fontFamily: tipografia.cuerpo,
    color: colores.textoSuave,
    fontSize: 12,
    textAlign: "center",
    marginTop: 14,
  },
});
