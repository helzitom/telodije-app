import { Platform } from "react-native";

export const colores = {
  fondo: "#F4EFE6",
  superficie: "#FFFDF9",
  marca: "#0F5C5A",
  marcaSuave: "#D7EAE6",
  acento: "#FF6B5B",
  texto: "#1F2A2E",
  textoSuave: "#6A7A7D",
  textoSobreAcento: "#FFFFFF",
  borde: "#E4DCCD",
  acentoSuave: "#FFE4E0",
};

export const radios = {
  pildora: 999,
  tarjeta: 22,
  boton: 16,
};

export const sombra = Platform.select({
  ios: {
    shadowColor: "#1F2A2E",
    shadowOpacity: 0.14,
    shadowRadius: 14,
    shadowOffset: { width: 0, height: 6 },
  },
  android: { elevation: 6 },
  default: {},
});

export const tipografia = {
  titulo: "Fraunces_700Bold",
  subtitulo: "Fraunces_600SemiBold",
  cuerpo: "Inter_400Regular",
  cuerpoMedio: "Inter_500Medium",
  enfasis: "Inter_600SemiBold",
  negrita: "Inter_700Bold",
};
