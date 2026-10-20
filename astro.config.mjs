import { defineConfig, envField } from 'astro/config';
import sitemap from '@astrojs/sitemap';
import vercel from '@astrojs/vercel';

export default defineConfig({
  site: 'https://www.tastory.nl',
  output: 'server',
  adapter: vercel(),
  // Eén URL per pagina (geen /contact én /contact/): anders ziet Google
  // dubbele pagina's.
  trailingSlash: 'never',
  // Veel crawlers (ook van AI-diensten) proberen eerst /sitemap.xml.
  redirects: {
    '/sitemap.xml': { status: 301, destination: '/sitemap-index.xml' },
  },
  integrations: [
    sitemap({
      // Restaurant- en stadspagina's komen uit de database (zie
      // src/pages/sitemap-restaurants.xml.ts) en staan zo ook in de index.
      customSitemaps: ['https://www.tastory.nl/sitemap-restaurants.xml'],
      // Doorverwijs- en hulppagina's horen niet in Google.
      filter: (page) =>
        !/\/(aanmelden\/foodie|get|join|account-verwijderen|account|inloggen|partials\/.*)\/?$/.test(
          page,
        ),
      serialize: (item) => ({ ...item, url: item.url.replace(/(.)\/$/, '$1') }),
    }),
  ],
  build: {
    assets: 'assets',
    format: 'file',
  },
  env: {
    schema: {
      // De anon key is openbaar (hij zit ook in de app) en is nodig in de
      // browser om in te loggen. Row-Level Security in Supabase bepaalt wat
      // ermee mag. Wordt tijdens de build uit de Vercel-variabele gelezen.
      SUPABASE_URL: envField.string({
        context: 'client',
        access: 'public',
        default: 'https://vyqpdtjpocndgdqylzeo.supabase.co',
      }),
      SUPABASE_ANON_KEY: envField.string({ context: 'client', access: 'public', default: '' }),
    },
  },
});
