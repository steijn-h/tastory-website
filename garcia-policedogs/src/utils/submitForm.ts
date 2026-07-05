const ENDPOINT = 'https://formsubmit.co/ajax/info@garciapolicedogs.nl';

export async function submitForm(payload: Record<string, string | undefined>): Promise<void> {
  const formData = new FormData();

  for (const [key, value] of Object.entries(payload)) {
    if (value !== undefined && value !== '') formData.append(key, value);
  }

  const res = await fetch(ENDPOINT, {
    method: 'POST',
    headers: { Accept: 'application/json' },
    body: formData,
  });

  if (!res.ok) {
    throw new Error(`HTTP ${res.status}`);
  }
}
