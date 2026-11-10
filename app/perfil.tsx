import { useCallback, useState } from "react";
import {
  ActivityIndicator,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from "react-native";
import { Stack, router, useFocusEffect } from "expo-router";
import {
  obtenerJson,
  enviarJson,
  ErrorApi,
  obtenerJsonAutenticado,
} from "../src/api/cliente";
import { cerrarSesion, obtenerToken } from "../src/sesion";
import type { VisitaMia } from "../src/tipos";
import { colores, radios, sombra, tipografia } from "../src/tema";
import { etiquetaFranja, fechaCorta, soles } from "../src/formato";

export default function Perfil() {
  const [visitas, setVisitas] = useState<VisitaMia[] | null>(null);
  const [sinSesion, setSinSesion] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useFocusEffect(
    useCallback(() => {
      let activo = true;
      (async () => {
        const token = await obtenerToken();
        if (!token) {
          if (activo) setSinSesion(true);
          return;
        }
        try {
          const lista = await obtenerJsonAutenticado<VisitaMia[]>(
            "/api/v1/visitas/mias",
          );
          if (activo) setVisitas(lista);
        } catch (e) {
          if (activo)
            setError(
              e instanceof ErrorApi
                ? e.message
                : "No pudimos cargar tu historial.",
            );
        }
      })();
      return () => {
        activo = false;
      };
    }, []),
  );

  async function salir() {
    await cerrarSesion();
    router.replace("/");
  }

  if (sinSesion) {
    return (
      <View style={styles.centro}>
        <Stack.Screen options={{ title: "Tu cuenta" }} />
        <Text style={styles.titulo}>Entra para ver tus visitas</Text>
        <Pressable style={styles.boton} onPress={() => router.push("/acceso")}>
          <Text style={styles.botonTexto}>Entrar o crear cuenta</Text>
        </Pressable>
      </View>
    );
  }

  return (
    <ScrollView
      style={styles.contenedor}
      contentContainerStyle={styles.contenido}
    >
      <Stack.Screen options={{ title: "Tu cuenta" }} />
      <Text style={styles.titulo}>Tus visitas</Text>
      <Text style={styles.subtitulo}>
        Cada visita te permite dejar una reseña. Son privadas: solo tú las ves.
      </Text>

      {visitas === null && !error && (
        <ActivityIndicator color={colores.marca} style={{ marginTop: 24 }} />
      )}

      {error && <Text style={styles.error}>{error}</Text>}

      {visitas !== null && visitas.length === 0 && (
        <Text style={styles.vacio}>
          Aún no registras visitas. Abre un hospedaje y registra tu estadía.
        </Text>
      )}

      {visitas?.map((v) => (
        <View key={v.id} style={styles.visita}>
          <View style={styles.visitaCabecera}>
            <Text style={styles.visitaFecha}>{fechaCorta(v.llegadaEn)}</Text>
            <Text style={styles.visitaMonto}>{soles(v.montoPagadoPen)}</Text>
          </View>
          <Text style={styles.visitaDetalle}>
            {etiquetaFranja(v.franja)} · {v.horas} h
          </Text>
          <Pressable
            style={styles.reseñar}
            onPress={() => router.push(`/resenar/${v.alojamientoId}`)}
          >
            <Text style={styles.reseñarTexto}>Dejar reseña</Text>
          </Pressable>
        </View>
      ))}

      <Pressable style={styles.salir} onPress={salir}>
        <Text style={styles.salirTexto}>Cerrar sesión</Text>
      </Pressable>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  contenedor: { flex: 1, backgroundColor: colores.fondo },
  contenido: { padding: 20, paddingBottom: 48 },
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
    marginTop: 6,
    marginBottom: 20,
    lineHeight: 21,
  },
  vacio: {
    fontFamily: tipografia.cuerpo,
    color: colores.textoSuave,
    lineHeight: 21,
    marginTop: 12,
  },
  error: {
    fontFamily: tipografia.cuerpoMedio,
    color: colores.acento,
    marginTop: 12,
  },

  visita: {
    backgroundColor: colores.superficie,
    borderRadius: radios.tarjeta,
    padding: 18,
    marginBottom: 12,
    ...sombra,
  },
  visitaCabecera: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  visitaFecha: {
    fontFamily: tipografia.subtitulo,
    fontSize: 16,
    color: colores.texto,
  },
  visitaMonto: {
    fontFamily: tipografia.titulo,
    fontSize: 18,
    color: colores.acento,
  },
  visitaDetalle: {
    fontFamily: tipografia.cuerpo,
    color: colores.textoSuave,
    marginTop: 4,
  },
  reseñar: {
    marginTop: 12,
    borderRadius: radios.boton,
    borderWidth: 1,
    borderColor: colores.marca,
    paddingVertical: 10,
    alignItems: "center",
  },
  reseñarTexto: { fontFamily: tipografia.enfasis, color: colores.marca },

  boton: {
    backgroundColor: colores.marca,
    borderRadius: radios.boton,
    paddingVertical: 16,
    paddingHorizontal: 24,
  },
  botonTexto: {
    fontFamily: tipografia.enfasis,
    color: colores.textoSobreAcento,
  },
  salir: { alignItems: "center", marginTop: 28 },
  salirTexto: { fontFamily: tipografia.cuerpoMedio, color: colores.textoSuave },
});
