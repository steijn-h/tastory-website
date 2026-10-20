import { defineConfig, envField } from 'astro/config';
import sitemap from '@astrojs/sitemap';
import vercel from '@astrojs/vercel';

export default defineConfig({
  site: 'https://www.tastory.nl',
  output: 'server',
  adapter: vercel(),
  integrations: [sitemap()],
  build: {
    assets: 'assets',
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
