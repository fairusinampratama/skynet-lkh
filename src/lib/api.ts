export async function api(path: string, options: RequestInit = {}) {
  const headers = options.body instanceof FormData
    ? options.headers
    : {
      'Content-Type': 'application/json',
      ...(options.headers || {})
    };

  const response = await fetch(path, {
    ...options,
    headers
  });
  const data = await response.json().catch(() => ({}));
  if (!response.ok || data.success === false) throw new Error(data.error || response.statusText);
  return data;
}
