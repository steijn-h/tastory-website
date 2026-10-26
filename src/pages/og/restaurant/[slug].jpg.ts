// Deelplaatje per restaurant (og:image): de eerste foto als JPG van 1200×630.
// De foto's in Supabase zijn WebP, en WhatsApp toont geen WebP in
// voorvertoningen. Vercel bewaart het resultaat een week in de cache.
import type { APIRoute } from 'astro';
import sharp from 'sharp';
import { getRestaurant } from '../../../lib/restaurants';
import { safeHttpsUrl, splitUrls } from '../../../lib/format';

export const prerender = false;

const fallback = (origin: string) =>
  Response.redirect(new URL('/og-image.png', origin).toString(), 302);

export const GET: APIRoute = async ({ params, url }) => {
  const lookup = await getRestaurant(params.slug ?? '');
  if (lookup.status !== 'ok') return fallback(url.origin);
  const photo = safeHttpsUrl(splitUrls(lookup.restaurant.photo_url)[0]);
  if (!photo) return fallback(url.origin);

  try {
    const res = await fetch(photo);
    if (!res.ok) return fallback(url.origin);
    const jpg = await sharp(Buffer.from(await res.arrayBuffer()))
      .resize(1200, 630, { fit: 'cover', position: 'attention' })
      .jpeg({ quality: 80, mozjpeg: true })
      .toBuffer();
    return new Response(new Uint8Array(jpg), {
      headers: {
        'Content-Type': 'image/jpeg',
        'Cache-Control': 'public, s-maxage=604800, stale-while-revalidate=2592000',
      },
    });
  } catch (e) {
    console.error('[og] restaurant', params.slug, (e as Error).message);
    return fallback(url.origin);
  }
};
