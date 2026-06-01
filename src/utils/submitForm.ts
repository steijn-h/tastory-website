const ENDPOINT = 'https://formsubmit.co/ajax/info@tastory.nl';

export async function submitForm(payload: Record<string, string | undefined>): Promise<void> {
  const body: Record<string, string> = { _captcha: 'false' };
  for (const [key, value] of Object.entries(payload)) {
    if (value !== undefined && value !== '') body[key] = value;
  }

  const res = await fetch(ENDPOINT, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', Accept: 'application/json' },
    body: JSON.stringify(body),
  });

  const json = await res.json().catch(() => ({}));

  if (!res.ok || json.success === 'false' || json.success === false) {
    throw new Error(json.message ?? `HTTP ${res.status}`);
  }
}
