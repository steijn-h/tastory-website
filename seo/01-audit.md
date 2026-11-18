# 01 — Technische audit (18-11-2026)

Gemeten op de live site en lokaal met een kopie van de echte restaurantgegevens (272 restaurants met slug).

## Wat al in orde was (eerdere wijzigingen)

| Onderdeel                                                                                                                           | Status              |
| ----------------------------------------------------------------------------------------------------------------------------------- | ------------------- |
| Inhoud in ruwe HTML (SSR)                                                                                                           | ✅                  |
| Sitemap-index in robots.txt, gesplitst (statisch / restaurants+hubs)                                                                | ✅                  |
| Unieke `<title>` per restaurantpagina, canonical, Open Graph/Twitter, eigen OG-afbeelding per restaurant                            | ✅                  |
| Restaurant-schema: name, address, geo, servesCuisine, priceRange, url, image, telephone, openingHours                               | ✅                  |
| `aggregateRating` **alleen** uit Tastory-reviews (`weighted_score` + gepubliceerde reviews; nog niet geverifieerde tellen niet mee) | ✅                  |
| Organization + WebSite-schema, logo, `sameAs` (App Store, Instagram)                                                                | ✅                  |
| Breadcrumbs (zichtbaar + schema) op restaurant- en hubpagina's                                                                      | ✅                  |
| Plaats×keuken-pagina's met ≥3 restaurants, kleinere `noindex`                                                                       | ✅ (35 combinaties) |
| Restaurantpagina linkt naar plaats + 4 restaurants in dezelfde plaats                                                               | ✅                  |
| Fonts zelf geserveerd, afbeeldingen via Vercel Image (webp, srcset), eerste foto's eager                                            | ✅                  |
| Database-antwoorden 5 min bewaard + time-out van 8 s (na trage periode)                                                             | ✅ (PR #110)        |

## Bevindingen

1. **Keuken × dorp (de grootste vraag in Search Console) heeft bijna nooit 3 restaurants.** Telling uit de echte data: chinees Wierden 1, Vriezenveen 1, Goor 2, Losser 1, Westerhaar 1, Nijverdal 1, Denekamp 1, Almelo 2, Enschede 5; Japans/sushi Tubbergen 1; Italiaans Haaksbergen 1, Oldenzaal 1. Een aparte pagina per dorp zou een dunne pagina zijn (regel 2). Alleen **chinees Enschede** haalt de grens (bestaat al). → Opgelost met één pagina per keuken voor **heel Twente**, gegroepeerd per plaats (`/restaurants/twente/chinees`). Eerlijk: bij "chinees wierden" is de restaurantpagina zelf (positie 6) het juiste antwoord; de hub helpt vooral bij bredere zoekopdrachten ("chinees twente", "chinese restaurants overijssel") en als interne verwijzing.
2. **Waarom weinig klikken op positie 6–9:** voor "keuken + plaats" en restaurantnamen toont Google bovenaan het kaartblok (Maps) en de eigen site van het restaurant. Een betere titel verandert dat weinig; reviews (sterren in Google) en positie wel.
3. **Stadspagina's ranken slecht (pos. 27–56).** De pagina's waren vooral een raster met kaartjes; de titel beloofde "De beste restaurants … reviews" terwijl er bijna geen reviews/scores zijn (0 restaurants met score, 6 met reviews). Dat is én beloven wat er niet staat én weinig unieke tekst. → Feitelijk overzicht toegevoegd en titel aangepast.
4. **Restauranttitels beloofden "reviews, foto's & menu" voor elk restaurant**, ook zonder reviews/menukaart (regel 3). → Titel noemt nu alleen wat er is.
5. **Keukenhub was niet bereikbaar vanaf de restaurantpagina.** → Links + breadcrumb toegevoegd.
6. **Sitemap zonder `lastmod`.** Bewust: de lijstquery heeft geen betrouwbare wijzigingsdatum. Er is `created_at`, maar geen `updated_at`. Een verzonnen datum laat Google de sitemap wantrouwen. Advies: kolom `updated_at` met trigger (zie hieronder); dan kan `lastmod` erbij.
7. **±150 restaurants niet zichtbaar voor bezoekers (424 in de database, 274 via de anon key).** Niet te zien, dus ook niet te vinden. Controleer in Supabase waarom (RLS-policy, status, ontbrekende slug). Niet aangepast: dit is een productkeuze.
8. **Merk "tastory" op positie ~15.** Organization-schema staat goed. Wat ontbreekt is externe bevestiging: Google Bedrijfsprofiel, meer `sameAs` (LinkedIn/Facebook/TikTok als die bestaan; niet in de code gevonden), vermeldingen elders. Er bestaan ook andere bedrijven met "Tastory" in de naam.

## Google Places-voorwaarden (regel 1) — rapportage, niets verwijderd

Wat de site toont komt uit de eigen tabel `restaurants`:

- **Geen Google-reviews of Google-sterren** gevonden in code of pagina's. `aggregateRating` komt uit eigen reviews. ✅
- **Wel getoond:** naam, adres, coördinaten, telefoon, website en openingstijden. Als die destijds via de **Places API** zijn opgehaald en opgeslagen, dan is dát het risico: volgens de Places-voorwaarden mag je behalve `place_id` geen Places-inhoud blijvend opslaan (coördinaten hooguit 30 dagen in een cache). Ik kan uit de code niet zien hoe de import is gedaan; de importcode staat niet in deze repo. **Advies:** nagaan hoe de import liep. Gegevens die je zelf hebt gecontroleerd of die van het restaurant komen (eigen site, bevestiging door de eigenaar) zijn geen probleem. Feiten als adres en openingstijden kun je ook uit andere bronnen halen.
- Foto's komen uit eigen Supabase-opslag, niet van Google. ✅
- Kaart op de restaurantpagina is een Google Maps-embed (toegestaan, met klik-toestemming).

## Dunne/dubbele inhoud

- Restaurantpagina's: per pagina eigen naam, adres, keuken, sfeer, voorzieningen, eigen beschrijving en (soms) reviews. De beschrijving is bij een deel letterlijk van de site van het restaurant overgenomen; die is daar dan "dubbel". De eigen samenvatting in de meta description is per pagina verschillend.
- Stad- en keukenpagina's: nu een overzicht met cijfers per plaats/keuken (keukens, sfeer, prijsklassen, voorzieningen), dus geen sjabloon met alleen een andere plaatsnaam.

## Interne links (crawl van de lokale kopie)

- 384 pagina's gecrawld, **0 kapotte links, 0 niet-200 in de sitemap, 0 dubbele titels, 0 wees-pagina's**.
- Elke restaurantpagina heeft minimaal 2 inkomende links (mediaan 4).

## Voorstel migratie (niet uitgevoerd, alleen ter beoordeling)

```sql
-- Wijzigingsdatum voor lastmod in de sitemap
alter table public.restaurants add column if not exists updated_at timestamptz not null default now();
create or replace function public.set_updated_at() returns trigger language plpgsql as $$
begin new.updated_at := now(); return new; end $$;
drop trigger if exists restaurants_updated_at on public.restaurants;
create trigger restaurants_updated_at before update on public.restaurants
for each row execute function public.set_updated_at();
```
