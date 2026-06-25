export async function api(path: string, options: RequestInit = {}) {
  const headers = options.body instanceof FormData
    ? options.headers
    : {
      'Content-Type': 'application/json',
      ...(options.headers || {})
    };

  const response = await fetch(path, {
    credentials: 'same-origin',
    ...options,
    headers
  });
  const data = await response.json().catch(() => ({}));
  if (!response.ok || data.success === false) {
    const error: any = new Error(data.error || response.statusText);
    if (data.fieldErrors) error.fieldErrors = data.fieldErrors;
    throw error;
  }
  return data;
}
