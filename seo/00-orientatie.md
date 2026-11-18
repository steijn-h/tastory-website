# 00 — Oriëntatie (18-11-2026)

## Waar staat wat

- **Websitecode:** repo `steijn-h/tastory-website` (niet de app-repo). Astro 5, TypeScript, gehost op Vercel (`@astrojs/vercel`, regio Dublin).
- **Rendering:** server-side (SSR, `output: 'server'`) met CDN-cache (`s-maxage=300`, stale-while-revalidate). **Geen** client-side rendering: alle inhoud staat in de ruwe HTML (gecontroleerd met `curl` zonder JavaScript: H1, beschrijving, reviews, JSON-LD staan erin).
- **Data:** Supabase, gelezen met de publieke anon key (zelfde rechten als een gast in de app). Code in `src/lib/restaurants.ts`.
- **Routes:**
  - `/restaurant/<slug>` – restaurantpagina (`src/pages/restaurant/[slug].astro`)
  - `/restaurants` – overzicht, `/restaurants/<plaats>` – plaats, `/restaurants/<plaats>/<keuken>` – keuken in plaats (alleen ≥3 restaurants geïndexeerd)
  - nieuw in deze wijziging: `/restaurants/twente/<keuken>` – keuken in heel Twente
- **Titels/meta:** per pagina in de frontmatter; canonical en Open Graph/Twitter in `src/layouts/BaseLayout.astro`.
- **Sitemap:** `sitemap-index.xml` → `sitemap-0.xml` (vaste pagina's, @astrojs/sitemap) en `sitemap-restaurants.xml` (dynamisch, `src/pages/sitemap-restaurants.xml.ts`). Staat in `robots.txt`.
- **Structured data:** homepage Organization + WebSite (met SearchAction) + SoftwareApplication; restaurantpagina Restaurant + BreadcrumbList (+ VideoObject); hubs ItemList + BreadcrumbList.

## Belangrijk verschil met de opdracht

- **De site toont 274 restaurants, niet 424.** De anon key krijgt er 274 terug (een gast in de app ziet dus waarschijnlijk ook 274). De overige ±150 zijn waarschijnlijk afgeschermd met Row-Level Security of een status. Die kunnen dus ook niet in Google komen. Zie de audit.
- Veel uit de opdracht was al gebouwd in eerdere rondes (zie `01-audit.md`, kolom "al gedaan").
