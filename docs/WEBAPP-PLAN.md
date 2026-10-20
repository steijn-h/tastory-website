# Tastory webapp — plan en stand van zaken

Doel: de functies van de Tastory-app (iOS/Android, repo `rork-tastory-react`)
ook op tastory.nl, met een eigen openbare pagina per restaurant (TripAdvisor-stijl).
Alles op tastory.nl zelf, zelfde Supabase-database en accounts als de app.

## Besluiten

- Gebouwd in deze Astro-site (server-side rendering op Vercel), níet als
  Expo-webversie van de app: die is slecht vindbaar in Google, blijft een
  telefoonscherm en is 7 MB JavaScript.
- Elk restaurant krijgt een volledige pagina. Partners (video of eigen
  achtergrond, zelfde regel als de app) houden video/achtergrond + label.
- Gasten zien alle openbare reviews. Reviewers als `@gebruikersnaam` of
  voornaam, nooit volledige naam (privacy/AVG).
- Officiële App Store-link: https://apps.apple.com/nl/app/tastory/id6762256086
- Ingelogd deel komt ook op tastory.nl (geen subdomein).

## Stap 1 — openbaar deel ✅ (branch `claude/jolly-planck-eg5agv`)

- `/restaurant/[slug]`, `/restaurants`, `/restaurants/[stad]`, sitemap, nav.
- Getest met lokale testdata (opmaak, meer reviews laden, fotoweergave,
  zoeken). **Nog niet getest met echte data** — de Supabase-database was
  vanuit de werkomgeving geblokkeerd.

## Stap 1 — testen met echte data (nog open)

- 20-10-2026: Supabase en www.tastory.nl zijn nu bereikbaar vanuit de
  werkomgeving, maar de **anon key staat niet in de omgeving** (alleen in
  Vercel). Daardoor nog steeds niet met echte data getest.
- Wel gezien via de openbare edge function `Restaurant-pagina`: `photo_url`
  is een komma-lijst (klopt met `splitUrls`), `opening_hours` kan `""` zijn,
  `weighted_score` kan `null` zijn (pagina toont dan geen score), en er
  bestaat een kolom `is_premium` (nu niet gebruikt; partner = video of eigen
  achtergrond, zoals de app).
- Te doen: `SUPABASE_ANON_KEY` als omgevingsvariabele in de werkomgeving
  zetten (nieuwe sessie), óf de Vercel-preview-URL van de branch delen.
  Dan controleren: kolomnamen, mag een gast `profiles_public` en `reviews`
  lezen, schaal `weighted_score`.

## Stap 2 — ingelogd deel 🚧 (branch `claude/hopeful-curie-0t7og4`)

Gebouwd en getest tegen een nagebootste Supabase (niet tegen de echte):

- `/inloggen`: e-mail + 8-cijferige code, zelfde methode als de app
  (`signInWithOtp` / `verifyOtp`). Nieuw account → naam + gebruikersnaam
  kiezen (uniek, zelfde tekens als de app). Geblokkeerd account → uitgelogd
  met melding. Daarna terug naar `?next=`.
- Sessie in cookies via `@supabase/ssr` (`src/lib/supabase-browser.ts`,
  `src/lib/supabase-server.ts`). Inloggen gebeurt vanuit de browser: Supabase
  telt inlogpogingen per IP, via de server zouden alle bezoekers één IP delen.
- Opslaan (hartje) op de restaurantpagina met collectie-keuze, notitie en
  nieuwe collectie (`SaveButton.astro`, `src/lib/account.ts`). Verwijderen
  haalt het restaurant ook uit collecties (zoals `SavedRestaurantActionsSheet`).
- `/restaurant/[slug]/review`: review schrijven met dezelfde 6 aspecten,
  min. 10 / max. 500 tekens, 14-dagenregel, apparaat- en snelheidscontrole,
  gewicht en `check_and_publish_reviews` als de app (`src/lib/review-submit.ts`).
  **Bewust geen GPS check-in op de website**: in een browser is je locatie in
  seconden te vervalsen. Website-reviews zijn dus altijd `UNVERIFIED`; een
  tweede review voor hetzelfde restaurant (vraagt GPS) kan alleen in de app.
- `/account` (Mijn Tastory): opgeslagen restaurants met filter per collectie,
  eigen reviews met status, uitloggen (alleen dit apparaat).
- Restaurantpagina's blijven gecachet en anoniem: inlogstatus en hartje worden
  in de browser opgehaald. Nav toont "Inloggen" of "Mijn Tastory" op basis van
  de sessie-cookie.

Nodig vóór livegang:

1. Testen met echte data en een echt account (zie stap 1): vooral RLS op
   `saved_restaurants`, `collecties`, `collectie_restaurants`, `reviews`
   (eigen pending reviews lezen) en `profiles` (eigen naam wijzigen).
2. `SUPABASE_ANON_KEY` moet in Vercel ook tijdens de **build** beschikbaar zijn
   (standaard zo): hij wordt in de browsercode gezet via `astro:env`.
3. Supabase → Authentication → URL Configuration: `https://www.tastory.nl/**`
   toevoegen aan Redirect URLs (nodig voor Google/Apple en voor een inloglink
   in de e-mail; de 8-cijferige code werkt ook zonder).
4. Google/Apple op de website (later): in Supabase de providers instellen met
   een web-client (Google) en Services ID (Apple), daarna in
   `ENABLED_OAUTH_PROVIDERS` (`src/lib/auth-cookie.ts`) aanzetten. De routes
   `/auth/oauth` en `/auth/callback` staan al klaar.

Nog niet in stap 2: paspoort/profiel bewerken, hartje op restaurantkaartjes
in overzichten, bezoeken (check-ins).

## Stap 3 — later

- Taste Stories plaatsen, vrienden, loyaliteit.

## Overig

- In `rork-tastory-react`: de deelknop in `QuickActionsSheet` deelt het id,
  de restaurantpagina de slug. De website vangt beide op (id → 301 naar slug).
- Een half-afgemaakt Expo-web-experiment stond lokaal in een git stash en is
  niet bewaard; niet meer nodig door bovenstaande keuze.
