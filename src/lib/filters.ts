// Filteropties voor de restaurantlijsten. Gelijk houden aan FilterSheet.tsx en
// passesFilters() in de app (rork-tastory-react), zodat je op de site en in de
// app op dezelfde manier filtert. Binnen een groep is één treffer genoeg;
// dieetwensen moeten allemaal kloppen. Afstand zit alleen in de app (locatie).
import { priceLabel, priceRange } from './format';

export const KEUKEN_OPTIONS = [
  'Amerikaans',
  'Argentijns',
  'Aziatisch',
  'Chinees',
  'Frans',
  'Grieks',
  'Indisch',
  'Indonesisch',
  'Italiaans',
  'Japans',
  'Koreaans',
  'Marokkaans',
  'Mediterraan',
  'Mexicaans',
  'Midden-Oosters',
  'Nederlands',
  'Peruaans',
  'Scandinavisch',
  'Spaans',
  'Thais',
  'Turks',
  'Vietnamees',
].sort((a, b) => a.localeCompare(b, 'nl'));

export const PRIJS_OPTIONS = [1, 2, 3, 4].map((value) => ({
  value,
  label: priceLabel(value),
  range: priceRange(value),
}));

export const SFEER_OPTIONS = [
  'Casual',
  'Formeel',
  'Gezellig',
  'Huiselijk',
  'Informeel',
  'Intiem',
  'Knus',
  'Modern',
  'Relaxed',
  'Romantisch',
  'Rustig',
  'Trendy',
].sort((a, b) => a.localeCompare(b, 'nl'));

export const SOORT_OPTIONS = [
  'Bistro',
  'Brasserie',
  'Casual Dining',
  'Fine Dining',
  'Familierestaurant',
  'Grand Café',
  'Gastronomisch',
  'Tapasbar',
];

export const VOORZIENINGEN_OPTIONS = ['Parkeren', 'Rolstoeltoegankelijk', 'Terras'];

export const DIEET_OPTIONS = [
  'Glutenvrij',
  'Lactosevrij',
  'Veganistisch',
  'Vegetarisch',
  'Ei-vrij',
  'Notenvrij',
];
