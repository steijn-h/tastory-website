# Tastory Website

## Project Overview

Tastory is a Dutch restaurant discovery platform that connects guests with restaurants through high-quality video content. The website is a marketing/landing site built as a static site generator (SSG). All user-facing text is in **Dutch**.

## Tech Stack

- **Framework**: Astro 5 (SSG mode)
- **Language**: TypeScript (strict mode via `tsconfig.json`)
- **Styling**: Vanilla CSS with custom properties (design tokens in `src/styles/global.css`)
- **Content**: Markdown content collections for blog posts
- **Deployment**: GitHub Pages via GitHub Actions

## Commands

```bash
npm run dev       # Start dev server
npm run build     # Production build
npm run preview   # Preview production build locally
npm run lint      # Check formatting with Prettier
npm run format    # Auto-format with Prettier
```

## Project Structure

```
src/
  components/     # Reusable Astro components (Nav, Footer, Hero, etc.)
  content/
    blog/         # Markdown blog posts
    config.ts     # Content collection schema
  data/           # Static data constants (homepage data)
  layouts/        # BaseLayout.astro (wraps all pages)
  pages/          # File-based routing
    blog/         # Blog index + [slug] dynamic routes
    oplossingen/  # Solutions pages (index, restaurants, gebruikers)
    contact.astro
    index.astro
    over-ons.astro
  styles/
    global.css    # Design tokens, base styles, animations
  utils/          # Shared utilities (formatDate, form handling)
public/           # Static assets (images, favicon, robots.txt)
```

## Architecture Patterns

- **Component-based**: Reusable Astro components with scoped `<style>` blocks
- **Content collections**: Blog posts as Markdown with Zod schema validation
- **CSS design tokens**: Colors, typography, spacing, shadows, radii defined as custom properties in `:root`
- **Shared components**: `PageHero`, `SectionHeader`, `Container` reduce repetition across pages
- **Scroll animations**: Elements with class `reveal` animate in via IntersectionObserver (defined in BaseLayout)

## Design System

### Colors

`--beige`, `--brown`, `--orange` (primary accent), `--text`, `--text-muted`, `--white`

### Typography

- Serif: `DM Serif Display` (`--serif`) — headings, display text
- Sans: `Outfit` (`--sans`) — body, UI elements

### Spacing Scale

`--space-xs` (0.25rem) through `--space-3xl` (4rem)

### Other Tokens

- Border radius: `--radius-sm` through `--radius-xl`
- Shadows: `--shadow-sm` through `--shadow-xl`

## Deployment

- **Platform**: Vercel (`@astrojs/vercel`, `output: 'server'`), live op `https://www.tastory.nl`
- **Env vars (Vercel)**: `SUPABASE_ANON_KEY` (verplicht voor alle restaurantdata), optioneel `SUPABASE_URL`
- Server-gerenderde pagina's zetten zelf `Cache-Control: s-maxage=300` zodat Vercel ze 5 min cachet

## Restaurantpagina's (openbaar, TripAdvisor-stijl)

- Data: `src/lib/restaurants.ts` (Supabase, anon key — zelfde RLS als een gast in de app)
- `/restaurants` overzicht, `/restaurants/[stad]` stadspagina's, `/restaurant/[slug]` detail
- `/restaurant/<uuid>` (oude deellinks uit de app) stuurt met 301 door naar de slug
- `/partials/reviews` levert HTML voor "Meer reviews laden"
- Reviewers tonen als `@gebruikersnaam` of alleen voornaam — nooit de volledige naam
- Filters op reviews/stories gelijk houden aan de app (`rork-tastory-react`)

## Content

- Blog posts live in `src/content/blog/` as `.md` files
- Schema defined in `src/content/config.ts` (title, description, date, optional author/tags)
- Posts are sorted by date descending

## Conventions

- **Dutch UI text**: All user-facing strings in Dutch
- **Scoped styles**: Use `<style>` (scoped) per component; avoid `is:global`
- **Section headings**: Use `SectionHeader` component with tag/title/description props
- **Page heroes**: Use `PageHero` component for sub-page hero sections
- **Animations**: Add `reveal` class to elements for scroll-triggered fade-up
- **Base URL**: Always use `import.meta.env.BASE_URL` for internal links
- **Form submission**: Via `formsubmit.co` (AJAX to `Info@tastory.nl`)
