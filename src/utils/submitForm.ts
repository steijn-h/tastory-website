const ENDPOINT = 'https://api.web3forms.com/submit';
const ACCESS_KEY = '57009958-4ab7-4eb4-86fe-c8690985de44';

export async function submitForm(payload: Record<string, string | undefined>): Promise<void> {
  const formData = new FormData();
  formData.append('access_key', ACCESS_KEY);

  for (const [key, value] of Object.entries(payload)) {
    if (value !== undefined && value !== '') formData.append(key, value);
  }

  const res = await fetch(ENDPOINT, {
    method: 'POST',
    body: formData,
  });

  const json = await res.json().catch(() => ({}));

  if (!res.ok || !json.success) {
    throw new Error(json.message ?? `HTTP ${res.status}`);
  }
}
