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

## Volgende sessie — eerst doen

1. Controleren dat de werkomgeving `vyqpdtjpocndgdqylzeo.supabase.co` en
   `www.tastory.nl` mag bereiken (Network access in de omgevingsinstellingen).
2. Stap 1 testen met echte data: kloppen kolomnamen, mag een gast
   `profiles_public` en `reviews` lezen, schaal van `weighted_score` (1–5)?
3. Vercel-preview van de branch bekijken; daarna naar `main` (live).

## Stap 2 — ingelogd deel (nog te bouwen)

- Inloggen met hetzelfde account als de app (e-mail; Google/Apple via
  Supabase OAuth — vraagt instellingen in Supabase en Apple Developer).
- Opslaan (hartje), collecties, review schrijven, paspoort/profiel.
- Supabase Auth: `https://www.tastory.nl` toevoegen als redirect-URL.

## Stap 3 — later

- Taste Stories plaatsen, vrienden, loyaliteit.

## Overig

- In `rork-tastory-react`: de deelknop in `QuickActionsSheet` deelt het id,
  de restaurantpagina de slug. De website vangt beide op (id → 301 naar slug).
- Een half-afgemaakt Expo-web-experiment stond lokaal in een git stash en is
  niet bewaard; niet meer nodig door bovenstaande keuze.
