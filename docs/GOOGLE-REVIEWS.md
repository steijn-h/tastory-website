# Google-score op restaurantpagina's

Wat: op de restaurantpagina staat, los van de Tastory-score, de score en het
aantal reviews van Google Maps, met een link naar Google Maps.

## Regels (voorwaarden Google Maps Platform)

- Alleen het `place_id` wordt bewaard (kolom `restaurants.google_place_id`).
- Score en aantal worden live opgehaald via `/api/google-rating` en nergens
  opgeslagen of gecachet (`no-store`, uitgesloten van ISR).
- Altijd met de bron "Google Maps" erbij en een link naar Google Maps.
- Niet in JSON-LD / sterren voor Google; die komen alleen uit eigen reviews.
- Geen Google-reviewteksten.

## Kosten

Elke keer dat een bezoeker naar de reviews scrolt is één Place Details-opvraag
(Enterprise, velden `rating,userRatingCount,googleMapsUri`). Bots krijgen niets.
Zet in Google Cloud een dagquotum (Places API (New) → Quotas → Place Details
requests per day, bijv. 100) en een budgetmelding.

## Instellen

1. `supabase/google-place-id.sql` uitvoeren in Supabase (voegt de kolom toe).
2. `GOOGLE_PLACES_API_KEY=... node scripts/google-place-ids.mjs` zoekt de
   place_ids op en schrijft `seo/google-places/google-place-ids.sql` (zekere
   matches) en `google-place-ids-check.csv` (nalopen).
3. Dat SQL-bestand uitvoeren in Supabase.
4. In Vercel `GOOGLE_PLACES_API_KEY` zetten (Production) en opnieuw deployen.
   De sleutel beperken tot de Places API (New); geen websitebeperking
   (HTTP-referrer), want de aanroep komt van de server.
