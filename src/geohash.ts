const BASE32 = "0123456789bcdefghjkmnpqrstuvwxyz";

export function geohash(lat: number, lng: number, precision = 5): string {
  let latRango: [number, number] = [-90, 90];
  let lngRango: [number, number] = [-180, 180];
  let bits = 0;
  let bit = 0;
  let par = true;
  let resultado = "";

  while (resultado.length < precision) {
    if (par) {
      const medio = (lngRango[0] + lngRango[1]) / 2;
      if (lng >= medio) {
        bit = (bit << 1) | 1;
        lngRango = [medio, lngRango[1]];
      } else {
        bit = bit << 1;
        lngRango = [lngRango[0], medio];
      }
    } else {
      const medio = (latRango[0] + latRango[1]) / 2;
      if (lat >= medio) {
        bit = (bit << 1) | 1;
        latRango = [medio, latRango[1]];
      } else {
        bit = bit << 1;
        latRango = [latRango[0], medio];
      }
    }
    par = !par;
    bits++;
    if (bits === 5) {
      resultado += BASE32[bit];
      bits = 0;
      bit = 0;
    }
  }
  return resultado;
}
