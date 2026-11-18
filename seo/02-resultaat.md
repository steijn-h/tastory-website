# 02 — Resultaat (18-11-2026)

## Wat is er veranderd

1. **Nieuw: keuken-pagina's voor heel Twente** — `/restaurants/twente/<keuken>`, per plaats gegroepeerd, met links naar de plaats(×keuken)pagina's. Alleen keukens met ≥5 restaurants staan in de sitemap en mogen in Google; kleinere bestaan wel maar met `noindex`. **14 nieuwe indexeerbare pagina's:** nederlands, internationaal, italiaans, amerikaans, chinees, japans, grieks, libanees, argentijns, indiaas, mexicaans, spaans, frans, indonesisch.
2. **Stadspagina's** (`/restaurants/<plaats>`): blok "Uit eten in <plaats>: het aanbod" met keukens (gelinkt naar plaats×keuken of Twente-keuken), sfeer, prijsklassen en voorzieningen, en "Restaurants in de buurt van <plaats>" (dichtstbijzijnde plaatsen met afstand, berekend uit de coördinaten van de restaurants). Titel/meta beloven niet meer "beste" en "reviews" als die er niet zijn.
3. **Restaurantpagina's:** titel noemt keuken en alleen wat er echt staat (foto's / menukaart / reviews); meta description idem. Breadcrumb krijgt de plaats×keukenpagina erbij (als die bestaat), en onderaan links naar de keuken in de plaats en in Twente.
4. **Plaats×keukenpagina's:** link naar de Twente-pagina van die keuken; titel/meta beloven geen reviews/menu's meer.
5. **Sitemap:** Twente-keukenpagina's toegevoegd (366 URL's in `sitemap-restaurants.xml`).

## Controles (lokaal, met een kopie van de echte restaurantgegevens)

- `astro check` 0 fouten, Prettier ok, productie-build ok.
- Inhoud staat in de ruwe HTML (curl): titel, meta, H1, canonical, JSON-LD.
- JSON-LD op restaurant-, stads- en hubpagina's parseert (Restaurant/ItemList/BreadcrumbList).
- Crawl: 384 pagina's, **0 kapotte links**, **0 sitemap-URL's die geen 200 geven**, **0 dubbele titels**, **0 wees-pagina's**.
- Restaurantpagina's: minimaal 2, mediaan 4 inkomende interne links.

## Waar ik afweek van de opdracht, en waarom

- **Geen pagina's per keuken × dorp** (chinees Wierden, sushi Tubbergen, steakhouse Haaksbergen enz.): er zijn er 1–2 per dorp, dus dunne pagina's (regel 2). In plaats daarvan één pagina per keuken voor Twente, per plaats ingedeeld. Plaats×keuken met ≥3 bestond al (35 stuks).
- **"Beste restaurants in <plaats>" als ranglijst niet gebouwd:** geen enkel restaurant heeft nog een Tastory-score (0 van 274); 6 hebben reviews. Een ranglijst zou verzonnen zijn. Komt vanzelf zodra er reviews zijn (de lijsten sorteren al op score).
- **Geen `lastmod` in de sitemap:** er is geen betrouwbare wijzigingsdatum; migratievoorstel staat in `01-audit.md`.
- **Branchnaam:** deze sessie mag alleen pushen naar `claude/hopeful-curie-0t7og4`, dus niet `seo/discovery-hubs`. Er is een PR geopend; niets gemerged of gedeployd.
- **`sameAs` niet uitgebreid:** alleen App Store en Instagram zijn bekend. Geef de URL's van andere profielen (Facebook, LinkedIn, TikTok) als die er zijn.
- **Performance:** de top-3 uit eerdere metingen (fonts zelf serveren, eerste foto's eager, databasecache + time-out) is al eerder gedaan; geen nieuwe UI-wijzigingen.

## Open risico's

- **Google Places-voorwaarden** voor opgeslagen adres/telefoon/openingstijden: zie `01-audit.md`. Niet aangepast; jij moet nagaan hoe de import liep.
- **±150 restaurants niet zichtbaar** voor bezoekers en Google (424 vs 274).
- Nieuwe pagina's hebben weken nodig voordat Google ze waardeert; geen garantie op betere posities.

## Drie voorbeeldpagina's (zoals ze nu gegenereerd worden)

### `/restaurants/twente/chinees`

- **Title:** Chinese restaurants in Twente (17) — per plaats | Tastory
- **Meta description:** 17 Chinese restaurants in Twente, per plaats: Enschede, Almelo, Goor, Denekamp, Hengelo, Hoge Hexel en meer. Met foto's, adres en openingstijden op Tastory.
- **H1:** Chinese restaurants in Twente
- **Tekst:** Op Tastory staan 17 Chinese restaurants in 11 plaatsen in Twente: Enschede (5), Almelo (2), Goor (2), Denekamp, Hengelo, Hoge Hexel, Losser, Nijverdal, Vriezenveen, Westerhaar-Vriezenveensewijk en Wierden.
- **Tekst:** Prijsklasse: 13× €€ (€20–35 p.p.), 1× €€€ (€35–60 p.p.). Vaak genoemde sfeer: casual (10), gezellig (5) en informeel (2).
- **Per plaats:**
  - Chinees in Enschede: Koneo, Big Rabbit, Hu's Garden, International, Oriëntal City
  - Chinees in Almelo: International, Indisch Man Wah
  - Chinees in Goor: Kota Radja, Specialiteiten Wing Wah
  - Chinees in Denekamp: Indisch Specialiteiten Hai Jin
  - Chinees in Hengelo: Umami
  - Chinees in Hoge Hexel: De Hexelse Berg
  - Chinees in Losser: Restaurant De Iris
  - Chinees in Nijverdal: Dynasty
  - Chinees in Vriezenveen: Jin Xing
  - Chinees in Westerhaar-Vriezenveensewijk: Ni Hao
  - Chinees in Wierden: Indisch Peking
- **Schema:** ItemList (restaurants met URL) + BreadcrumbList

### `/restaurants/twente/japans`

- **Title:** Japanse restaurants in Twente (11) — per plaats | Tastory
- **Meta description:** 11 Japanse restaurants in Twente, per plaats: Enschede, Almelo, Hengelo, Hoge Hexel en Tubbergen. Met foto's, adres en openingstijden op Tastory.
- **H1:** Japanse restaurants in Twente
- **Tekst:** Op Tastory staan 11 Japanse restaurants in 5 plaatsen in Twente: Enschede (7), Almelo, Hengelo, Hoge Hexel en Tubbergen.
- **Tekst:** Prijsklasse: 4× €€ (€20–35 p.p.), 4× €€€ (€35–60 p.p.). Vaak genoemde sfeer: gezellig (4), romantisch (3) en casual (3).
- **Per plaats:**
  - Japans in Enschede: Amelie, Koneo, Tao, Big Rabbit, Bar Bistro Loev, Yuzu, Sage
  - Japans in Almelo: Barracuda
  - Japans in Hengelo: Umami
  - Japans in Hoge Hexel: De Hexelse Berg
  - Japans in Tubbergen: SAVA Sushi
- **Schema:** ItemList (restaurants met URL) + BreadcrumbList

### `/restaurants/twente/italiaans`

- **Title:** Italiaanse restaurants in Twente (28) — per plaats | Tastory
- **Meta description:** 28 Italiaanse restaurants in Twente, per plaats: Enschede, Hengelo, Holten, Nijverdal, Wierden, Almelo en meer. Met foto's, adres en openingstijden op Tastory.
- **H1:** Italiaanse restaurants in Twente
- **Tekst:** Op Tastory staan 28 Italiaanse restaurants in 17 plaatsen in Twente: Enschede (7), Hengelo (3), Holten (2), Nijverdal (2), Wierden (2), Almelo, Borne, Denekamp, Haaksbergen, Losser, Markelo, Oldenzaal, Ootmarsum, Overdinkel, Rijssen, Tubbergen en Zenderen.
- **Tekst:** Prijsklasse: 3× € (tot €20 p.p.), 19× €€ (€20–35 p.p.), 3× €€€ (€35–60 p.p.). Vaak genoemde sfeer: gezellig (21), casual (11) en romantisch (3).
- **Per plaats:**
  - Italiaans in Enschede: Sapori e Ricordi, La Candela, Happy Italy, Sorrentino, puntoPASTA, Verso Cucina, Novi
  - Italiaans in Hengelo: Intenzo Taste, Markanti, Lab26 Aperitivo Club
  - Italiaans in Holten: Da Vinci Foodbar, Altamura
  - Italiaans in Nijverdal: Casa Stromboli, Il Gusto
  - Italiaans in Wierden: MILANO, Charly
  - Italiaans in Almelo: Ristorante Valentino
  - Italiaans in Borne: Il Tartufo
  - Italiaans in Denekamp: Ristorante Il Municipio
  - Italiaans in Haaksbergen: La Stella Del Paese
  - Italiaans in Losser: Isolabella
  - Italiaans in Markelo: Mama Mia
  - Italiaans in Oldenzaal: La Tavernetta
  - Italiaans in Ootmarsum: Via Grande
  - Italiaans in Overdinkel: Antonio
  - Italiaans in Rijssen: Ristorante Via Grande
  - Italiaans in Tubbergen: Shalom
  - Italiaans in Zenderen: Al Capone
- **Schema:** ItemList (restaurants met URL) + BreadcrumbList
