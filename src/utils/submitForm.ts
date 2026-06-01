const ENDPOINT = 'https://formsubmit.co/ajax/Info@tastory.nl';

export async function submitForm(payload: Record<string, string | undefined>): Promise<void> {
  const formData = new FormData();
  formData.append('_captcha', 'false');

  for (const [key, value] of Object.entries(payload)) {
    if (value !== undefined && value !== '') formData.append(key, value);
  }

  const res = await fetch(ENDPOINT, {
    method: 'POST',
    headers: { Accept: 'application/json' },
    body: formData,
  });

  const json = await res.json().catch(() => ({}));

  if (!res.ok || json.success === 'false' || json.success === false) {
    throw new Error(json.message ?? `HTTP ${res.status}`);
  }
}
