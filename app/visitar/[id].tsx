import { useRef, useState } from "react";
import {
  ActivityIndicator,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from "react-native";
import { CameraView, useCameraPermissions } from "expo-camera";
import * as ImageManipulator from "expo-image-manipulator";
import * as Haptics from "expo-haptics";
import { Stack, router, useLocalSearchParams } from "expo-router";
import { registrarVisitaConFoto } from "../../src/api/visitas";
import { ErrorApi } from "../../src/api/cliente";
import { obtenerToken } from "../../src/sesion";
import { colores, radios, sombra, tipografia } from "../../src/tema";
import { etiquetaFranja, soles } from "../../src/formato";

type Paso = "tarifa" | "foto" | "confirmar" | "enviando" | "listo";

const OPCIONES = [
  { franja: "H4", horas: 4 },
  { franja: "H6", horas: 6 },
  { franja: "H8", horas: 8 },
  { franja: "H12", horas: 12 },
  { franja: "NOCHE_COMPLETA", horas: 12 },
];

export default function VisitarScreen() {
  const { id, precios } = useLocalSearchParams<{
    id: string;
    precios: string;
  }>();
  const tarifas: Record<string, number> = precios ? JSON.parse(precios) : {};
  const opciones = OPCIONES.filter((o) => tarifas[o.franja] !== undefined);

  const [paso, setPaso] = useState<Paso>("tarifa");
  const [seleccion, setSeleccion] = useState<(typeof OPCIONES)[number] | null>(
    null,
  );
  const [fotoUri, setFotoUri] = useState<string | null>(null);
  const [mensaje, setMensaje] = useState<string | null>(null);
  const [permiso, pedirPermiso] = useCameraPermissions();
  const camara = useRef<CameraView>(null);

  async function tomarFoto() {
    if (!camara.current) return;
    const foto = await camara.current.takePictureAsync({ quality: 0.8 });
    if (!foto) return;
    // Reducimos el tamaño antes de subir: menos datos y carga más rápida.
    const reducida = await ImageManipulator.manipulateAsync(
      foto.uri,
      [{ resize: { width: 1080 } }],
      { compress: 0.75, format: ImageManipulator.SaveFormat.JPEG },
    );
    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    setFotoUri(reducida.uri);
    setPaso("confirmar");
  }

  async function confirmar() {
    if (!seleccion || !fotoUri) return;
    setPaso("enviando");
    setMensaje(null);
    try {
      await registrarVisitaConFoto({
        alojamientoId: id,
        franja: seleccion.franja,
        horas: seleccion.horas,
        montoPagadoPen: tarifas[seleccion.franja],
        fotoUri,
      });
      setPaso("listo");
      setTimeout(() => router.back(), 1400);
    } catch (e) {
      setMensaje(
        e instanceof ErrorApi && e.estado === 409
          ? "Esta foto ya fue usada. Toma una nueva."
          : e instanceof Error
            ? e.message
            : "No pudimos registrar tu visita.",
      );
      setPaso("foto");
    }
  }

  // Sin sesión, no tiene sentido abrir la cámara.
  async function iniciarFoto() {
    const token = await obtenerToken();
    if (!token) {
      router.push("/acceso");
      return;
    }
    if (!permiso?.granted) {
      const r = await pedirPermiso();
      if (!r.granted) {
        setMensaje("Necesitamos la cámara para registrar tu foto de llegada.");
        return;
      }
    }
    setPaso("foto");
  }

  if (paso === "tarifa") {
    return (
      <ScrollView
        style={styles.contenedor}
        contentContainerStyle={styles.contenido}
      >
        <Stack.Screen options={{ title: "Registrar visita" }} />
        <Text style={styles.titulo}>¿Cuánto tiempo te quedaste?</Text>
        <Text style={styles.subtitulo}>
          Elige la estadía. El monto sale de la tarifa de ese lugar.
        </Text>

        {opciones.map((o) => {
          const activa = seleccion?.franja === o.franja;
          return (
            <Pressable
              key={o.franja}
              onPress={() => {
                Haptics.selectionAsync();
                setSeleccion(o);
              }}
              style={[styles.opcion, activa && styles.opcionActiva]}
            >
              <Text style={[styles.opcionTitulo, activa && styles.textoClaro]}>
                {etiquetaFranja(o.franja)}
              </Text>
              <Text style={[styles.opcionMonto, activa && styles.textoClaro]}>
                {soles(tarifas[o.franja])}
              </Text>
            </Pressable>
          );
        })}

        <Pressable
          style={[styles.boton, !seleccion && styles.botonDeshabilitado]}
          disabled={!seleccion}
          onPress={iniciarFoto}
        >
          <Text style={styles.botonTexto}>Continuar a la foto</Text>
        </Pressable>

        {mensaje && <Text style={styles.mensaje}>{mensaje}</Text>}
      </ScrollView>
    );
  }

  if (paso === "foto") {
    return (
      <View style={styles.camaraContenedor}>
        <Stack.Screen options={{ title: "Foto de llegada" }} />
        <CameraView
          ref={camara}
          style={StyleSheet.absoluteFill}
          facing="back"
        />
        <View style={styles.guia}>
          <Text style={styles.guiaTexto}>
            Encuadra la habitación. Es tu prueba de que estuviste aquí.
          </Text>
        </View>
        {mensaje && <Text style={styles.mensajeCamara}>{mensaje}</Text>}
        <Pressable style={styles.disparador} onPress={tomarFoto}>
          <View style={styles.disparadorInterior} />
        </Pressable>
      </View>
    );
  }

  if (paso === "confirmar" && fotoUri) {
    return (
      <View style={styles.centro}>
        <Stack.Screen options={{ title: "Confirmar" }} />
        <View style={styles.resumen}>
          <Text style={styles.resumenFranja}>
            {seleccion && etiquetaFranja(seleccion.franja)}
          </Text>
          <Text style={styles.resumenMonto}>
            {seleccion && soles(tarifas[seleccion.franja])}
          </Text>
          <Text style={styles.resumenNota}>
            Revisa que la foto muestre la habitación.
          </Text>
        </View>
        <Pressable style={styles.boton} onPress={confirmar}>
          <Text style={styles.botonTexto}>Registrar mi visita</Text>
        </Pressable>
        <Pressable onPress={() => setPaso("foto")}>
          <Text style={styles.enlace}>Tomar otra foto</Text>
        </Pressable>
      </View>
    );
  }

  if (paso === "enviando") {
    return (
      <View style={styles.centro}>
        <ActivityIndicator size="large" color={colores.marca} />
        <Text style={styles.subtitulo}>Guardando tu visita…</Text>
      </View>
    );
  }

  return (
    <View style={styles.centro}>
      <Text style={styles.titulo}>¡Visita registrada!</Text>
      <Text style={styles.subtitulo}>Ya puedes dejar tu reseña.</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  contenedor: { flex: 1, backgroundColor: colores.fondo },
  contenido: { padding: 24, paddingBottom: 48 },
  centro: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    padding: 28,
    backgroundColor: colores.fondo,
    gap: 16,
  },
  titulo: { fontFamily: tipografia.titulo, fontSize: 26, color: colores.texto },
  subtitulo: {
    fontFamily: tipografia.cuerpo,
    color: colores.textoSuave,
    marginTop: 8,
    marginBottom: 20,
    lineHeight: 21,
    textAlign: "center",
  },

  opcion: {
    backgroundColor: colores.superficie,
    borderRadius: radios.tarjeta,
    padding: 20,
    marginBottom: 12,
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    borderWidth: 1,
    borderColor: colores.borde,
    ...sombra,
  },
  opcionActiva: { backgroundColor: colores.marca, borderColor: colores.marca },
  opcionTitulo: {
    fontFamily: tipografia.subtitulo,
    fontSize: 17,
    color: colores.texto,
  },
  opcionMonto: {
    fontFamily: tipografia.titulo,
    fontSize: 20,
    color: colores.acento,
  },
  textoClaro: { color: colores.textoSobreAcento },

  boton: {
    backgroundColor: colores.marca,
    borderRadius: radios.boton,
    paddingVertical: 16,
    alignItems: "center",
    marginTop: 16,
  },
  botonDeshabilitado: { opacity: 0.4 },
  botonTexto: {
    fontFamily: tipografia.enfasis,
    color: colores.textoSobreAcento,
    fontSize: 16,
  },
  enlace: {
    fontFamily: tipografia.cuerpoMedio,
    color: colores.marca,
    marginTop: 18,
  },
  mensaje: {
    fontFamily: tipografia.cuerpoMedio,
    color: colores.acento,
    textAlign: "center",
    marginTop: 14,
  },

  camaraContenedor: { flex: 1, backgroundColor: "#000" },
  guia: {
    position: "absolute",
    top: 120,
    left: 24,
    right: 24,
    backgroundColor: "rgba(0,0,0,0.45)",
    borderRadius: radios.boton,
    padding: 14,
  },
  guiaTexto: {
    color: colores.textoSobreAcento,
    textAlign: "center",
    fontFamily: tipografia.cuerpoMedio,
  },
  mensajeCamara: {
    position: "absolute",
    bottom: 150,
    alignSelf: "center",
    color: colores.textoSobreAcento,
    backgroundColor: colores.acento,
    borderRadius: radios.pildora,
    paddingHorizontal: 14,
    paddingVertical: 6,
    overflow: "hidden",
  },
  disparador: {
    position: "absolute",
    bottom: 48,
    alignSelf: "center",
    width: 76,
    height: 76,
    borderRadius: 38,
    borderWidth: 4,
    borderColor: colores.textoSobreAcento,
    alignItems: "center",
    justifyContent: "center",
  },
  disparadorInterior: {
    width: 60,
    height: 60,
    borderRadius: 30,
    backgroundColor: colores.textoSobreAcento,
  },

  resumen: {
    backgroundColor: colores.superficie,
    borderRadius: radios.tarjeta,
    padding: 28,
    alignItems: "center",
    width: "100%",
    ...sombra,
  },
  resumenFranja: {
    fontFamily: tipografia.subtitulo,
    fontSize: 18,
    color: colores.texto,
  },
  resumenMonto: {
    fontFamily: tipografia.titulo,
    fontSize: 36,
    color: colores.acento,
    marginTop: 6,
  },
  resumenNota: {
    fontFamily: tipografia.cuerpo,
    color: colores.textoSuave,
    marginTop: 10,
    textAlign: "center",
  },
});
