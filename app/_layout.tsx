import {
  useFonts,
  Fraunces_600SemiBold,
  Fraunces_700Bold,
} from "@expo-google-fonts/fraunces";
import {
  Inter_400Regular,
  Inter_500Medium,
  Inter_600SemiBold,
  Inter_700Bold,
} from "@expo-google-fonts/inter";
import { Stack } from "expo-router";
import { ActivityIndicator, View } from "react-native";
import { colores, tipografia } from "../src/tema";

export default function Layout() {
  const [cargado] = useFonts({
    Fraunces_600SemiBold,
    Fraunces_700Bold,
    Inter_400Regular,
    Inter_500Medium,
    Inter_600SemiBold,
    Inter_700Bold,
  });

  if (!cargado) {
    return (
      <View
        style={{
          flex: 1,
          alignItems: "center",
          justifyContent: "center",
          backgroundColor: colores.fondo,
        }}
      >
        <ActivityIndicator color={colores.marca} />
      </View>
    );
  }

  return (
    <Stack
      screenOptions={{
        headerStyle: { backgroundColor: colores.fondo },
        headerTintColor: colores.marca,
        headerTitleStyle: {
          fontFamily: tipografia.titulo,
          color: colores.texto,
        },
        headerShadowVisible: false,
        contentStyle: { backgroundColor: colores.fondo },
      }}
    >
      <Stack.Screen name="index" options={{ title: "TeloDije" }} />
      <Stack.Screen
        name="hospedaje/[id]"
        options={{ title: "Hospedaje", headerBackTitle: "Mapa" }}
      />
      <Stack.Screen
        name="acceso"
        options={{ title: "Tu cuenta", presentation: "modal" }}
      />
      <Stack.Screen
        name="resenar/[id]"
        options={{ title: "Dejar reseña", presentation: "modal" }}
      />
      <Stack.Screen
        name="visitar/[id]"
        options={{ title: "Registrar visita", presentation: "modal" }}
      />
      <Stack.Screen name="perfil" options={{ title: "Tu cuenta" }} />
    </Stack>
  );
}
