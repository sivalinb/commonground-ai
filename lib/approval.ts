const APPROVAL_TTL_MS = 30 * 60 * 1000;

function base64Url(bytes: Uint8Array) {
  let binary = '';
  for (const byte of bytes) binary += String.fromCharCode(byte);
  return btoa(binary)
    .replaceAll('+', '-')
    .replaceAll('/', '_')
    .replace(/=+$/g, '');
}

async function signature(payload: string, secret: string) {
  const key = await crypto.subtle.importKey(
    'raw',
    new TextEncoder().encode(secret),
    { name: 'HMAC', hash: 'SHA-256' },
    false,
    ['sign'],
  );
  const signed = await crypto.subtle.sign(
    'HMAC',
    key,
    new TextEncoder().encode(payload),
  );
  return base64Url(new Uint8Array(signed));
}

function timingSafeEqual(left: string, right: string) {
  if (left.length !== right.length) return false;
  let difference = 0;
  for (let index = 0; index < left.length; index += 1) {
    difference |= left.charCodeAt(index) ^ right.charCodeAt(index);
  }
  return difference === 0;
}

export async function issueApprovalToken(
  approvalId: string,
  secret: string,
  now = Date.now(),
) {
  const expiresAt = now + APPROVAL_TTL_MS;
  const payload = `${approvalId}.${expiresAt}`;
  return `${expiresAt}.${await signature(payload, secret)}`;
}

export async function verifyApprovalToken(
  approvalId: string,
  token: string,
  secret: string,
  now = Date.now(),
) {
  const [rawExpiresAt, provided, extra] = token.split('.');
  const expiresAt = Number(rawExpiresAt);
  if (
    extra ||
    !provided ||
    !Number.isSafeInteger(expiresAt) ||
    expiresAt < now
  ) {
    return false;
  }
  const expected = await signature(`${approvalId}.${expiresAt}`, secret);
  return timingSafeEqual(provided, expected);
}

export const approvalTokenTtlMinutes = APPROVAL_TTL_MS / 60_000;
