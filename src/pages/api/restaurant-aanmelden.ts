// Restaurant aanmelden vanaf de website, ook zonder account: een tip van een
// gast of een restaurant dat partner wil worden. Stuurt een melding naar
// info@tastory.nl en een bevestiging naar de aanmelder.
//
// Een openbaar formulier dat mail naar elk ingevuld adres stuurt kan misbruikt
// worden om mensen te spammen. Daarom: honeypot-veld, minimale invultijd,
// maximum per IP, en de bevestiging bevat geen links of vrije tekst van de
// invuller (alleen de restaurantnaam, ingekort en zonder URL's).
import type { APIRoute } from 'astro';
import {
  emailConfigured,
  emailLayout,
  escapeHtml,
  sendEmail,
  TASTORY_EMAIL,
} from '../../lib/email';

export const prerender = false;

const EMAIL_RE = /^[^\s@<>"',;]+@[^\s@<>"',;]+\.[^\s@<>"',;]{2,}$/;
const MIN_FILL_MS = 3000;
const MAX_PER_IP_PER_HOUR = 5;

// Per serverinstantie; geen waterdichte limiet, wel een rem op misbruik.
const recent = new Map<string, number[]>();
function rateLimited(ip: string): boolean {
  const now = Date.now();
  const hits = (recent.get(ip) ?? []).filter((t) => now - t < 60 * 60 * 1000);
  hits.push(now);
  recent.set(ip, hits);
  if (recent.size > 5000) recent.clear();
  return hits.length > MAX_PER_IP_PER_HOUR;
}

const clean = (value: unknown, max: number) =>
  typeof value === 'string' ? value.replace(/\s+/g, ' ').trim().slice(0, max) : '';
const cleanMultiline = (value: unknown, max: number) =>
  typeof value === 'string' ? value.replace(/\r/g, '').trim().slice(0, max) : '';
/** Restaurantnaam in de bevestiging: geen links (anti-spam). */
const safeName = (value: string) =>
  value
    .replace(/(https?:\/\/|www\.)\S*/gi, '')
    .replace(/[<>]/g, '')
    .trim();

const json = (status: number, body: Record<string, unknown>) =>
  new Response(JSON.stringify(body), {
    status,
    headers: { 'Content-Type': 'application/json', 'Cache-Control': 'no-store' },
  });

export const POST: APIRoute = async ({ request, clientAddress }) => {
  let data: Record<string, unknown>;
  try {
    data = await request.json();
  } catch {
    return json(400, { ok: false, message: 'Ongeldige aanvraag.' });
  }

  // Bots vullen het verborgen veld in of versturen meteen: doe alsof het lukt.
  const startedAt = Number(data.startedAt);
  if (clean(data.company_website, 200) || !startedAt || Date.now() - startedAt < MIN_FILL_MS) {
    return json(200, { ok: true });
  }

  // Twee formulieren: een tip van een gast (/restaurant-aanmelden) of een
  // restaurant dat partner wil worden (/aanmelden/restaurant).
  const kind = data.kind === 'partner' ? 'partner' : 'tip';
  const restaurant = clean(data.restaurant, 120);
  const city = clean(data.city, 80);
  const link = clean(data.link, 300);
  const reason = cleanMultiline(data.reason, 1500);
  const name = clean(data.name, 80);
  const phone = clean(data.phone, 40);
  const email = clean(data.email, 200).toLowerCase();
  const isOwner = data.isOwner === true;

  if (kind === 'tip' && (restaurant.length < 2 || city.length < 2)) {
    return json(400, { ok: false, message: 'Vul de naam en de plaats van het restaurant in.' });
  }
  if (kind === 'partner' && (restaurant.length < 2 || name.length < 2)) {
    return json(400, { ok: false, message: 'Vul je naam en de naam van het restaurant in.' });
  }
  if (!EMAIL_RE.test(email)) {
    return json(400, { ok: false, message: 'Vul een geldig e-mailadres in.' });
  }
  if (rateLimited(clientAddress ?? 'onbekend')) {
    return json(429, {
      ok: false,
      message: 'Je hebt al een paar aanmeldingen gedaan. Probeer het later opnieuw.',
    });
  }
  if (!emailConfigured) {
    return json(503, {
      ok: false,
      message: `Aanmelden lukt op dit moment niet. Mail ons gerust via ${TASTORY_EMAIL}.`,
    });
  }

  const rows: [string, string][] =
    kind === 'partner'
      ? [
          ['Restaurant', restaurant],
          ['Contactpersoon', name],
          ['E-mail', email],
          ['Telefoon', phone || '-'],
        ]
      : [
          ['Restaurant', restaurant],
          ['Plaats', city],
          ['Website / Instagram', link || '-'],
          [
            'Aangemeld door',
            `${name || '(geen naam)'} <${email}>${isOwner ? ' — eigenaar/medewerker' : ''}`,
          ],
          ['Waarom', reason || '-'],
        ];
  const subject =
    kind === 'partner'
      ? `Restaurant wil partner worden: ${restaurant}`
      : `Restaurant aangemeld: ${restaurant} (${city})`;
  const heading =
    kind === 'partner'
      ? 'Nieuwe aanmelding als partnerrestaurant'
      : 'Nieuw restaurant aangemeld via de website';
  const internal = await sendEmail({
    to: TASTORY_EMAIL,
    replyTo: email,
    subject,
    text: rows.map(([k, v]) => `${k}: ${v}`).join('\n'),
    html: emailLayout(
      heading,
      `<table style="border-collapse:collapse;font-size:14px;line-height:1.5">${rows
        .map(
          ([k, v]) =>
            `<tr><td style="padding:4px 12px 4px 0;color:#8a7a6a;vertical-align:top;white-space:nowrap">${k}</td><td style="padding:4px 0;white-space:pre-line">${escapeHtml(v)}</td></tr>`,
        )
        .join(
          '',
        )}</table><p style="font-size:13px;color:#8a7a6a;margin-top:16px">Beantwoorden gaat naar de aanmelder.</p>`,
    ),
  });
  if (!internal) {
    return json(502, {
      ok: false,
      message: `Versturen is niet gelukt. Probeer het opnieuw of mail ${TASTORY_EMAIL}.`,
    });
  }

  // Bevestiging; als die mislukt is de aanmelding toch binnen.
  const shownName = safeName(restaurant).slice(0, 80) || 'het restaurant';
  const greeting = name ? `Hoi ${safeName(name).slice(0, 40)},` : 'Hoi,';
  const message =
    kind === 'partner'
      ? `Bedankt voor de aanmelding van ${shownName} bij Tastory. We gaan ermee aan de slag en nemen zo snel mogelijk contact met je op over de mogelijkheden.`
      : `Bedankt voor je aanmelding van ${shownName}. We gaan ermee aan de slag: we bekijken het restaurant en nemen het waar mogelijk op in Tastory.`;
  const messageHtml = escapeHtml(message).replace(
    escapeHtml(shownName),
    `<strong>${escapeHtml(shownName)}</strong>`,
  );
  await sendEmail({
    to: email,
    subject: 'We hebben je aanmelding ontvangen',
    text: `${greeting}\n\n${message} Heb je nog een vraag of aanvulling? Beantwoord dan gewoon deze e-mail.\n\nGroet,\nTeam Tastory`,
    html: emailLayout(
      'We hebben je aanmelding ontvangen',
      `<p style="font-size:15px;line-height:1.6;margin:0 0 12px">${escapeHtml(greeting)}</p>
<p style="font-size:15px;line-height:1.6;margin:0 0 12px">${messageHtml}</p>
<p style="font-size:15px;line-height:1.6;margin:0 0 12px">Heb je nog een vraag of aanvulling? Beantwoord dan gewoon deze e-mail.</p>
<p style="font-size:15px;line-height:1.6;margin:0">Groet,<br>Team Tastory</p>`,
    ),
  });

  return json(200, { ok: true });
};
