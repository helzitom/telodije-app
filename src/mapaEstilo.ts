// Estilo de mapa: calles y barrios visibles, sin comercios ni POIs.
// Tonos arena y gris para que los marcadores de la app resalten.
export const estiloMapa = [
  { elementType: "geometry", stylers: [{ color: "#F4EFE6" }] },
  { elementType: "labels.text.fill", stylers: [{ color: "#6A7A7D" }] },
  { elementType: "labels.text.stroke", stylers: [{ color: "#F4EFE6" }] },
  { featureType: "poi", stylers: [{ visibility: "off" }] },
  { featureType: "transit", stylers: [{ visibility: "off" }] },
  { featureType: "landscape.natural", stylers: [{ color: "#E9E3D6" }] },
  { featureType: "landscape.man_made", stylers: [{ color: "#EFE9DD" }] },
  { featureType: "water", stylers: [{ color: "#CFE3E0" }] },
  {
    featureType: "road",
    elementType: "geometry",
    stylers: [{ color: "#FFFFFF" }],
  },
  {
    featureType: "road",
    elementType: "geometry.stroke",
    stylers: [{ color: "#E4DCCD" }],
  },
  {
    featureType: "road.highway",
    elementType: "geometry",
    stylers: [{ color: "#F9E7C2" }],
  },
  {
    featureType: "road",
    elementType: "labels.icon",
    stylers: [{ visibility: "off" }],
  },
  {
    featureType: "administrative.neighborhood",
    elementType: "labels.text.fill",
    stylers: [{ color: "#0F5C5A" }],
  },
  {
    featureType: "administrative.neighborhood",
    elementType: "labels.text.stroke",
    stylers: [{ visibility: "off" }],
  },
];
