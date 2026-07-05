import { defineConfig } from 'astro/config';
import sitemap from '@astrojs/sitemap';

export default defineConfig({
  site: 'https://www.garciapolicedogs.nl',
  output: 'static',
  integrations: [sitemap()],
});
