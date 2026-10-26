// Cache-instellingen voor Vercel's CDN. Een nieuwe deploy leegt de cache, dus
// voor pagina's zonder database-inhoud mag het lang. Nooit gebruiken op
// pagina's met gegevens van een ingelogde gebruiker.
import type { AstroGlobal } from 'astro';

/** Vaste pagina's (home, contact, FAQ ...): een dag, daarna op de achtergrond verversen. */
export function cacheStaticPage(Astro: AstroGlobal): void {
  Astro.response.headers.set(
    'Cache-Control',
    'public, s-maxage=86400, stale-while-revalidate=604800',
  );
}
