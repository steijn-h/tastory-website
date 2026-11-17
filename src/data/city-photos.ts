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

export const CITY_PHOTOS: Record<string, CityPhoto> = {
  almelo: {
    src: '/steden/almelo.webp',
    author: 'Tubantia',
    license: 'CC BY-SA 3.0',
    source: 'https://commons.wikimedia.org/wiki/File:De_Waag_Almelo.JPG',
  },
  borne: {
    src: '/steden/borne.webp',
    author: 'Tubantia',
    license: 'CC BY-SA 3.0',
    source: 'https://commons.wikimedia.org/wiki/File:Oude_Kerk_Borne.jpg',
  },
  'de-lutte': {
    src: '/steden/de-lutte.webp',
    author: 'Michielverbeek',
    license: 'CC BY-SA 4.0',
    source:
      'https://commons.wikimedia.org/wiki/File:De_Lutte%2C_de_Plechelmuskerk_GM0168-WN023_IMG_6742_2020-07-30_11.14.jpg',
  },
  delden: {
    src: '/steden/delden.webp',
    author: 'Michielverbeek',
    license: 'CC BY-SA 4.0',
    source:
      'https://commons.wikimedia.org/wiki/File:Delden%2C_de_Blasiuskerk_RM34149_IMG_5848_2020-05-31_17.18.jpg',
  },
  denekamp: {
    src: '/steden/denekamp.webp',
    author: 'Xaphire',
    license: 'CC BY-SA 3.0',
    source: 'https://commons.wikimedia.org/wiki/File:Denekamp_kerk.jpg',
  },
  enschede: {
    src: '/steden/enschede.webp',
    author: 'Hullie',
    license: 'CC BY-SA 3.0',
    source: 'https://commons.wikimedia.org/wiki/File:Grote_kerk_-_Enschede.jpg',
  },
  enter: {
    src: '/steden/enter.webp',
    author: 'Michielverbeek',
    license: 'CC BY-SA 4.0',
    source:
      'https://commons.wikimedia.org/wiki/File:Enter%2C_straatzicht_de_Dorpsstraat_foto3_2014-10-04_10.54.jpg',
  },
  goor: {
    src: '/steden/goor.webp',
    author: 'Michielverbeek',
    license: 'CC BY-SA 3.0',
    source:
      'https://commons.wikimedia.org/wiki/File:Goor%2C_Hofkerk_in_straatzicht_foto2_2010-07-18_13.05.JPG',
  },
  haaksbergen: {
    src: '/steden/haaksbergen.webp',
    author: 'Dennis Wissink',
    license: 'CC BY-SA 2.5',
    source: 'https://commons.wikimedia.org/wiki/File:Haaksbergen_centrum.jpg',
  },
  hengelo: {
    src: '/steden/hengelo.webp',
    author: 'Steven Lek',
    license: 'CC BY-SA 4.0',
    source: 'https://commons.wikimedia.org/wiki/File:Markt_Hengelo_2019.jpg',
  },
  holten: {
    src: '/steden/holten.webp',
    author: 'Michielverbeek',
    license: 'CC BY-SA 3.0 NL',
    source:
      'https://commons.wikimedia.org/wiki/File:Holten%2C_toren_van_de_Dorpskerk_%28RM22217%29_in_straatzicht_foto3_2014-10-04_09.13.jpg',
  },
  losser: {
    src: '/steden/losser.webp',
    author: 'Michielverbeek',
    license: 'CC BY-SA 3.0',
    source:
      'https://commons.wikimedia.org/wiki/File:Losser%2C_de_Sint_Martinuskerk_foto8_2013-04-22_17.01.jpg',
  },
  markelo: {
    src: '/steden/markelo.webp',
    author: 'Michielverbeek',
    license: 'CC BY 4.0',
    source:
      'https://commons.wikimedia.org/wiki/File:Hof_van_Twente-Markelo%2C_de_Martinuskerk_RM28129_IMG_6490_2025-03-09_14.18.jpg',
  },
  nijverdal: {
    src: '/steden/nijverdal.webp',
    author: 'Johnpeterpaus95',
    license: 'CC BY-SA 4.0',
    source: 'https://commons.wikimedia.org/wiki/File:Nijverdal_vernieuwde_Grotestraat.jpg',
  },
  oldenzaal: {
    src: '/steden/oldenzaal.webp',
    author: 'Michielverbeek',
    license: 'CC BY-SA 4.0',
    source:
      'https://commons.wikimedia.org/wiki/File:Oldenzaal%2C_de_Sint-Plechelmusbasiliek_RM31419_IMG_6729_2020-07-30_10.34.jpg',
  },
  ootmarsum: {
    src: '/steden/ootmarsum.webp',
    author: 'Michielverbeek',
    license: 'CC BY-SA 3.0',
    source:
      'https://commons.wikimedia.org/wiki/File:Ootmarsum%2C_straatzicht_Grotestraat-Almelosestraat_foto1_2012-09-10_15.22.jpg',
  },
  rijssen: {
    src: '/steden/rijssen.webp',
    author: 'Vincent van Zeijst',
    license: 'CC BY-SA 4.0',
    source:
      'https://commons.wikimedia.org/wiki/File:Netherlands%2C_Rijssen%2C_Schildkerk_or_Grote_Kerk_%2801%29.jpg',
  },
};
