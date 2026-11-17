// Foto's van het centrum per stad (Wikimedia Commons, vrije licentie). De
// licentie vraagt om naamsvermelding: die staat onder de stedenlijst op de
// homepage en bij de foto op de stadspagina.
export interface CityPhoto {
  /** Pad in public/ */
  src: string;
  author: string;
  license: string;
  /** Bestandspagina op Wikimedia Commons */
  source: string;
}

export const CITY_PHOTOS: Record<string, CityPhoto> = {};
