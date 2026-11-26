// Eenmalig: zoekt per restaurant het Google place_id op via Places API (New)
// Text Search, en schrijft een SQL-bestand om in Supabase uit te voeren.
// Er wordt niets rechtstreeks in de database gezet.
//
// Gebruik:  GOOGLE_PLACES_API_KEY=... node scripts/google-place-ids.mjs
// Uitvoer (map seo/google-places/):
//   google-place-ids.sql      zekere matches (naam lijkt en ligt < 250 m)
//   google-place-ids-check.csv twijfelgevallen en niet gevonden, om na te lopen
//
// Kosten: Text Search "Pro" (naam + adres + locatie), 1 opvraag per
// restaurant. Google geeft 5.000 per maand gratis, dus ~300 kost niets.

import { mkdirSync, writeFileSync } from 'node:fs';

const KEY = process.env.GOOGLE_PLACES_API_KEY ?? '';
const SITE = process.env.SITE_URL ?? 'https://www.tastory.nl';
const OUT = 'seo/google-places';

if (!KEY) {
  console.error('Zet eerst GOOGLE_PLACES_API_KEY.');
  process.exit(1);
}

const norm = (s) =>
  String(s ?? '')
    .toLowerCase()
    .normalize('NFD')
    .replace(/[̀-ͯ]/g, '')
    .replace(/&/g, ' en ')
    .replace(/[^a-z0-9 ]+/g, ' ')
    .replace(/\b(restaurant|cafe|eetcafe|brasserie|grand|de|het|t|the|bar|bistro|en|van)\b/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();

function similarity(a, b) {
  const A = new Set(norm(a).split(' ').filter(Boolean));
  const B = new Set(norm(b).split(' ').filter(Boolean));
  if (!A.size || !B.size) return 0;
  let same = 0;
  for (const w of A)
    if (B.has(w) || [...B].some((x) => x.length > 3 && (x.startsWith(w) || w.startsWith(x))))
      same++;
  return same / Math.min(A.size, B.size);
}

function meters(lat1, lng1, lat2, lng2) {
  const R = 6371000;
  const toRad = (d) => (d * Math.PI) / 180;
  const dLat = toRad(lat2 - lat1);
  const dLng = toRad(lng2 - lng1);
  const x =
    Math.sin(dLat / 2) ** 2 +
    Math.cos(toRad(lat1)) * Math.cos(toRad(lat2)) * Math.sin(dLng / 2) ** 2;
  return 2 * R * Math.asin(Math.sqrt(x));
}

async function search(r) {
  const body = {
    textQuery: `${r.name} ${r.city ?? ''}`.trim(),
    languageCode: 'nl',
    regionCode: 'NL',
    maxResultCount: 5,
  };
  if (typeof r.lat === 'number' && typeof r.lng === 'number') {
    body.locationBias = { circle: { center: { latitude: r.lat, longitude: r.lng }, radius: 1000 } };
  }
  const res = await fetch('https://places.googleapis.com/v1/places:searchText', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'X-Goog-Api-Key': KEY,
      'X-Goog-FieldMask': 'places.id,places.displayName,places.formattedAddress,places.location',
    },
    body: JSON.stringify(body),
  });
  if (!res.ok) throw new Error(`${res.status} ${await res.text()}`);
  return (await res.json()).places ?? [];
}

const sqlStr = (s) => `'${String(s).replace(/'/g, "''")}'`;
const csv = (v) => `"${String(v ?? '').replace(/"/g, '""')}"`;

const list = await (await fetch(`${SITE}/api/restaurants.json`)).json();
console.log(`${list.length} restaurants`);

const sure = [];
const check = [];
const usedIds = new Set();
for (const [i, r] of list.entries()) {
  let places = [];
  try {
    places = await search(r);
  } catch (e) {
    check.push({ r, why: `fout: ${e.message.slice(0, 120)}` });
    continue;
  }
  const scored = places
    .map((p) => {
      const dist =
        typeof r.lat === 'number' && p.location
          ? meters(r.lat, r.lng, p.location.latitude, p.location.longitude)
          : null;
      return { p, sim: similarity(r.name, p.displayName?.text), dist };
    })
    .sort((a, b) => b.sim - a.sim || (a.dist ?? 1e9) - (b.dist ?? 1e9));
  const best = scored[0];
  const ok =
    best && best.sim >= 0.5 && best.dist !== null && best.dist <= 250 && !usedIds.has(best.p.id);
  if (ok) {
    usedIds.add(best.p.id);
    sure.push({ r, best });
  } else {
    check.push({
      r,
      best,
      why: !best
        ? 'niet gevonden'
        : usedIds.has(best.p.id)
          ? 'zelfde plek als ander restaurant'
          : 'twijfel',
    });
  }
  if ((i + 1) % 25 === 0) console.log(`${i + 1}/${list.length}`);
  await new Promise((ok) => setTimeout(ok, 120));
}

mkdirSync(OUT, { recursive: true });
writeFileSync(
  `${OUT}/google-place-ids.sql`,
  [
    '-- Google place_id per restaurant (zekere matches). Vult alleen lege velden.',
    `-- ${sure.length} restaurants. Gegenereerd door scripts/google-place-ids.mjs.`,
    'begin;',
    ...sure.map(
      ({ r, best }) =>
        `update public.restaurants set google_place_id = ${sqlStr(best.p.id)} where id = ${sqlStr(r.id)} and google_place_id is null; -- ${String(r.name).replace(/\n/g, ' ')} = ${String(best.p.displayName?.text ?? '').replace(/\n/g, ' ')} (${Math.round(best.dist)} m)`,
    ),
    'commit;',
    '',
  ].join('\n'),
);
writeFileSync(
  `${OUT}/google-place-ids-check.csv`,
  [
    'reden;restaurant;stad;tastory_id;google_naam;google_adres;afstand_m;place_id;google_maps',
    ...check.map(({ r, best, why }) =>
      [
        why,
        r.name,
        r.city,
        r.id,
        best?.p.displayName?.text,
        best?.p.formattedAddress,
        best?.dist != null ? Math.round(best.dist) : '',
        best?.p.id,
        best ? `https://www.google.com/maps/place/?q=place_id:${best.p.id}` : '',
      ]
        .map(csv)
        .join(';'),
    ),
    '',
  ].join('\n'),
);
console.log(`Zeker: ${sure.length}, nalopen: ${check.length}. Zie ${OUT}/`);
