// E-mail vanaf de website via Resend, met hetzelfde afzenderadres als de app
// (supabase/functions/send-email in rork-tastory-react).
import { RESEND_API_KEY } from 'astro:env/server';

export const TASTORY_EMAIL = 'info@tastory.nl';
const FROM = 'Tastory <info@tastory.nl>';

export const emailConfigured = Boolean(RESEND_API_KEY);

export function escapeHtml(value: string): string {
  return value
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');
}

interface Mail {
  to: string;
  subject: string;
  html: string;
  text: string;
  replyTo?: string;
}

export async function sendEmail(mail: Mail): Promise<boolean> {
  if (!RESEND_API_KEY) return false;
  try {
    const res = await fetch('https://api.resend.com/emails', {
      method: 'POST',
      headers: { Authorization: `Bearer ${RESEND_API_KEY}`, 'Content-Type': 'application/json' },
      body: JSON.stringify({
        from: FROM,
        to: [mail.to],
        subject: mail.subject,
        html: mail.html,
        text: mail.text,
        ...(mail.replyTo ? { reply_to: mail.replyTo } : {}),
      }),
    });
    if (!res.ok) console.error('[email] Resend', res.status, (await res.text()).slice(0, 300));
    return res.ok;
  } catch (e) {
    console.error('[email] Resend', (e as Error).message);
    return false;
  }
}

/** Eenvoudige, rustige opmaak in Tastory-stijl. */
export function emailLayout(title: string, bodyHtml: string): string {
  return `<!doctype html><html lang="nl"><body style="margin:0;background:#f5ebdd;font-family:Arial,Helvetica,sans-serif;color:#3a2e22">
<div style="max-width:560px;margin:0 auto;padding:32px 20px">
<div style="background:#fffcf8;border-radius:16px;padding:32px 28px;border:1px solid #ddd1c0">
<p style="margin:0 0 20px;font-size:22px;font-weight:bold;color:#3a2e22">Tastory</p>
<h1 style="margin:0 0 16px;font-size:20px;line-height:1.3;color:#3a2e22">${title}</h1>
${bodyHtml}
</div>
<p style="margin:16px 0 0;font-size:12px;color:#8a7a6a;text-align:center">Tastory · Hutteweg 32, 7071 BV Ulft · info@tastory.nl</p>
</div></body></html>`;
}
