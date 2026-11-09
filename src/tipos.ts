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