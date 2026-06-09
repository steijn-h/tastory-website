export const prerender = false;

import type { APIRoute } from 'astro';

export const GET: APIRoute = async () => {
  const supabaseUrl = 'https://vyqpdtjpocndgdqylzeo.supabase.co';
  const supabaseAnonKey = import.meta.env.SUPABASE_ANON_KEY ?? '';

  let slugs: string[] = [];

  if (supabaseAnonKey) {
    try {
      const res = await fetch(
        `${supabaseUrl}/rest/v1/restaurants?select=slug&not.slug.is=null&order=weighted_score.desc.nullslast&limit=1000`,
        {
          headers: {
            apikey: supabaseAnonKey,
            Authorization: `Bearer ${supabaseAnonKey}`,
          },
        },
      );
      if (res.ok) {
        const rows: { slug: string }[] = await res.json();
        slugs = rows.map((r) => r.slug).filter(Boolean);
      }
    } catch {
      // return empty sitemap on error
    }
  }

  const baseUrl = 'https://www.tastory.nl';
  const today = new Date().toISOString().split('T')[0];

  const urls = slugs
    .map(
      (slug) => `  <url>
    <loc>${baseUrl}/restaurant/${slug}</loc>
    <lastmod>${today}</lastmod>
    <changefreq>weekly</changefreq>
    <priority>0.8</priority>
  </url>`,
    )
    .join('\n');

  const xml = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
${urls}
</urlset>`;

  return new Response(xml, {
    headers: {
      'Content-Type': 'application/xml',
      'Cache-Control': 'public, max-age=3600',
    },
  });
};
