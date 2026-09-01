export async function fetchWithPolicy(
  input: string,
  init: RequestInit,
  options: { timeoutMs?: number; retries?: number; label: string },
) {
  const timeoutMs = options.timeoutMs ?? 12_000;
  const retries = options.retries ?? 1;
  let lastError: Error | undefined;

  for (let attempt = 0; attempt <= retries; attempt += 1) {
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), timeoutMs);
    try {
      const response = await fetch(input, { ...init, signal: controller.signal });
      if (response.ok || (response.status < 500 && response.status !== 429)) return response;
      lastError = new Error(`${options.label} returned ${response.status}`);
    } catch (error) {
      lastError = error instanceof Error ? error : new Error(`${options.label} failed`);
    } finally {
      clearTimeout(timeout);
    }
    if (attempt < retries) await new Promise((resolve) => setTimeout(resolve, 180 * 2 ** attempt));
  }

  throw lastError || new Error(`${options.label} failed`);
}

export function secureJson(body: unknown, status = 200) {
  return Response.json(body, {
    status,
    headers: {
      'Cache-Control': 'no-store',
      'Content-Security-Policy': "default-src 'none'; frame-ancestors 'none'",
      'Cross-Origin-Resource-Policy': 'same-origin',
      'Referrer-Policy': 'no-referrer',
      'X-Content-Type-Options': 'nosniff',
    },
  });
}

export function requireSameOrigin(request: Request) {
  const origin = request.headers.get('origin');
  if (!origin) return true;
  return origin === new URL(request.url).origin;
}
