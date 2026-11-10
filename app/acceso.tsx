import { useState } from "react";
import {
  ActivityIndicator,
  KeyboardAvoidingView,
  Platform,
  Pressable,
  StyleSheet,
  Text,
  TextInput,
  View,
} from "react-native";
import { router } from "expo-router";
import { enviarJson, ErrorApi } from "../src/api/cliente";
import { guardarSesion } from "../src/sesion";
import type { RespuestaLogin } from "../src/tipos";
import { colores, radios, sombra, tipografia } from "../src/tema";

export default function Acceso() {
  const [modo, setModo] = useState<"entrar" | "registrarse">("entrar");
  const [alias, setAlias] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [cargando, setCargando] = useState(false);
  const [mensaje, setMensaje] = useState<string | null>(null);

  async function enviar() {
    setMensaje(null);
    const aliasLimpio = alias.trim();
    const correoLimpio = email.trim();

    if (registrando && (!aliasLimpio || !correoLimpio)) {
      setMensaje("Escribe tu alias y tu correo.");
      return;
    }
    if (!aliasLimpio && !correoLimpio) {
      setMensaje("Escribe tu alias o correo.");
      return;
    }
    if (password.length < 10) {
      setMensaje("La contraseña debe tener al menos 10 caracteres.");
      return;
    }

    setCargando(true);
    try {
      if (registrando) {
        await enviarJson("/api/v1/auth/registro", {
          alias: aliasLimpio,
          email: correoLimpio,
          password,
        });
      }
      const sesion = await enviarJson<RespuestaLogin>("/api/v1/auth/login", {
        identificador: registrando ? aliasLimpio : aliasLimpio || correoLimpio,
        password,
      });
      await guardarSesion(sesion.accessToken, sesion.refreshToken);
      router.dismissTo("/");
    } catch (e) {
      console.log("Error de login:", e);
      setMensaje(
        e instanceof ErrorApi
          ? e.message
          : "Revisa tu conexión e intenta de nuevo.",
      );
    } finally {
      setCargando(false);
    }
  }

  const registrando = modo === "registrarse";

  return (
    <KeyboardAvoidingView
      behavior={Platform.OS === "ios" ? "padding" : undefined}
      style={styles.contenedor}
    >
      <View style={styles.tarjeta}>
        <Text style={styles.titulo}>
          {registrando ? "Crea tu cuenta" : "Bienvenido de nuevo"}
        </Text>
        <Text style={styles.subtitulo}>
          {registrando
            ? "Solo para dejar reseñas. Tu nombre nunca se muestra."
            : "Entra para dejar tu reseña."}
        </Text>

        {registrando && (
          <TextInput
            style={styles.input}
            placeholder="Alias (ej. viajero_lima)"
            placeholderTextColor={colores.textoSuave}
            autoCapitalize="none"
            value={alias}
            onChangeText={setAlias}
          />
        )}

        <TextInput
          style={styles.input}
          placeholder={registrando ? "Correo electrónico" : "Alias o correo"}
          placeholderTextColor={colores.textoSuave}
          autoCapitalize="none"
          keyboardType={registrando ? "email-address" : "default"}
          value={registrando ? email : alias}
          onChangeText={registrando ? setEmail : setAlias}
        />

        <TextInput
          style={styles.input}
          placeholder="Contraseña"
          placeholderTextColor={colores.textoSuave}
          secureTextEntry
          value={password}
          onChangeText={setPassword}
        />

        {mensaje && <Text style={styles.error}>{mensaje}</Text>}

        <Pressable
          style={[styles.boton, cargando && styles.botonDeshabilitado]}
          onPress={enviar}
          disabled={cargando}
        >
          {cargando ? (
            <ActivityIndicator color={colores.textoSobreAcento} />
          ) : (
            <Text style={styles.botonTexto}>
              {registrando ? "Crear cuenta" : "Entrar"}
            </Text>
          )}
        </Pressable>

        <Pressable
          onPress={() => {
            setMensaje(null);
            setModo(registrando ? "entrar" : "registrarse");
          }}
        >
          <Text style={styles.cambio}>
            {registrando
              ? "¿Ya tienes cuenta? Entra aquí"
              : "¿Eres nuevo? Crea tu cuenta"}
          </Text>
        </Pressable>
      </View>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  contenedor: {
    flex: 1,
    backgroundColor: colores.fondo,
    justifyContent: "center",
    padding: 20,
  },
  tarjeta: {
    backgroundColor: colores.superficie,
    borderRadius: radios.tarjeta,
    padding: 24,
    ...sombra,
  },
  titulo: {
    fontFamily: tipografia.titulo,
    fontSize: 26,
    color: colores.texto,
  },
  subtitulo: {
    fontFamily: tipografia.cuerpo,
    color: colores.textoSuave,
    marginTop: 6,
    marginBottom: 20,
    lineHeight: 20,
  },
  input: {
    fontFamily: tipografia.cuerpo,
    fontSize: 16,
    color: colores.texto,
    backgroundColor: colores.fondo,
    borderRadius: radios.boton,
    paddingHorizontal: 16,
    paddingVertical: 14,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: colores.borde,
  },
  error: {
    fontFamily: tipografia.cuerpoMedio,
    color: colores.acento,
    marginBottom: 10,
  },
  boton: {
    backgroundColor: colores.marca,
    borderRadius: radios.boton,
    paddingVertical: 16,
    alignItems: "center",
    marginTop: 8,
  },
  botonDeshabilitado: { opacity: 0.6 },
  botonTexto: {
    fontFamily: tipografia.enfasis,
    color: colores.textoSobreAcento,
    fontSize: 16,
  },
  cambio: {
    fontFamily: tipografia.cuerpoMedio,
    color: colores.marca,
    textAlign: "center",
    marginTop: 18,
  },
  precioNota: {
    fontFamily: tipografia.cuerpo,
    color: colores.textoSuave,
    fontSize: 12,
    marginTop: 6,
    textAlign: "center",
  },
});
