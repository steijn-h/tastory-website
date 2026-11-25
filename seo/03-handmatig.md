# 03 — Wat Steijn zelf moet doen

1. **Merge en deploy** de PR pas als je de voorbeelden in `02-resultaat.md` goed vindt.
2. **Search Console → Sitemaps:** `https://www.tastory.nl/sitemap-index.xml` staat er al; klik erop en kies **opnieuw indienen** na de deploy.
3. **Indexering aanvragen** (bovenaan URL plakken → "Indexering aanvragen") voor deze 10:
   - /restaurants/twente/chinees
   - /restaurants/twente/italiaans
   - /restaurants/twente/japans
   - /restaurants/twente/grieks
   - /restaurants/twente/indiaas
   - /restaurants/hengelo
   - /restaurants/enschede
   - /restaurants/almelo
   - /restaurants/haaksbergen
   - /restaurants/oldenzaal
4. **Indexeringsrapport** (Indexeren → Pagina's): hoeveel restaurantpagina's zijn geïndexeerd en welke redenen staan er bij de rest. Stuur een screenshot.
5. **Supabase:** zoek uit waarom ±150 restaurants niet zichtbaar zijn voor bezoekers (424 in de database, 274 op de site). Bijvoorbeeld: een filter op status, of RLS.
6. **Google Places:** ga na hoe adres/telefoon/openingstijden in de database zijn gekomen (zie audit). Bij twijfel: laat het me weten, dan maken we een plan.
7. **Google Bedrijfsprofiel voor Tastory** aanmaken of controleren (helpt bij de zoekopdracht "tastory", nu positie ~15).
8. **5 partnerrestaurants** vragen om de Tastory-badge op hun site (tastory.nl/badge) en de reviewkaartjes op tafel. Reviews zijn nu het grootste gat: 0 restaurants hebben een Tastory-score, en zonder reviews geen sterren in Google.
9. **Meetmoment over 4 weken (± 16 december):** exporteer Search Console opnieuw (Prestaties, 3 maanden) en vergelijk met de nulmeting in `seo/gsc-2026-11-18/`: vertoningen, klikken en positie voor `/restaurants/<plaats>` (nu pos. 27–56) en de nieuwe `/restaurants/twente/<keuken>`.
