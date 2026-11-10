export type Hospedaje = {
  id: string;
  nombre: string;
  tipo: "HOTEL" | "HOSTAL" | "HOSPEDAJE" | "OTRO";
  tieneCochera: boolean;
  calificacionPromedio: number | null;
  totalResenas: number;
  distanciaMetros: number;
  precioDesde: number;
  latitud: number;
  longitud: number;
};

export type Tarifa = {
  franja: "H4" | "H6" | "H8" | "H12" | "NOCHE_COMPLETA";
  precioPen: number;
  tipoHabitacion: string;
  confianza: number;
};

export type ServicioEstado = {
  codigo: string;
  nombre: string;
  estado: "PRESENTE" | "AUSENTE" | "DESCONOCIDO";
};

export type DetalleHospedaje = {
  id: string;
  nombre: string;
  tipo: "HOTEL" | "HOSTAL" | "HOSPEDAJE" | "OTRO";
  direccion: string;
  tieneCochera: boolean;
  calificacionPromedio: number | null;
  totalResenas: number;
  tarifas: Tarifa[];
  servicios: ServicioEstado[];
};

export type ResenaPublica = {
  id: string;
  calificacion: number;
  volveria: boolean;
  comentario: string | null;
  fechaResena: string;
  respuestaDueno: string | null;
};