// Geoptimaliseerde foto's via Vercel Image Optimization. De restaurantfoto's
// in Supabase zijn volledige foto's (80–300 KB); een kaartje heeft maar een
// fractie nodig. Vercel schaalt, levert WebP en bewaart het resultaat.
// Alleen in productie (op Vercel) en alleen voor Supabase-foto's; lokaal en
// voor andere bronnen blijft de originele URL.

// Gelijk houden met imagesConfig.sizes in astro.config.mjs.
const SIZES = [480, 640, 1280];
const OPTIMIZABLE_HOST = 'vyqpdtjpocndgdqylzeo.supabase.co';

function optimizable(src: string): boolean {
  if (!import.meta.env.PROD) return false;
  try {
    return new URL(src).hostname === OPTIMIZABLE_HOST;
  } catch {
    return false;
  }
}

/** Eén geoptimaliseerde URL, minstens `width` pixels breed. */
export function imageUrl(src: string, width: number, quality = 75): string {
  if (!optimizable(src)) return src;
  const w = SIZES.find((s) => s >= width) ?? SIZES[SIZES.length - 1];
  return `/_vercel/image?url=${encodeURIComponent(src)}&w=${w}&q=${quality}`;
}

/** srcset met meerdere breedtes; de browser kiest zelf de juiste. */
export function imageSrcset(src: string, widths: number[], quality = 75): string | undefined {
  if (!optimizable(src)) return undefined;
  return widths.map((w) => `${imageUrl(src, w, quality)} ${w}w`).join(', ');
}
