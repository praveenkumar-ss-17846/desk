// Minimal Web Push sender for Cloudflare Workers.
//
// We send *payloadless* pushes (no encrypted body): the notification only
// needs to wake the service worker, which then fetches the due reminders from
// this API to show their text. That lets us skip the aes128gcm payload
// encryption and only implement VAPID (a signed JWT proving who we are).

function b64urlToBytes(s: string): Uint8Array {
  const norm = s.replace(/-/g, '+').replace(/_/g, '/')
  const padded = norm + '='.repeat((4 - (norm.length % 4)) % 4)
  const bin = atob(padded)
  const out = new Uint8Array(bin.length)
  for (let i = 0; i < bin.length; i++) out[i] = bin.charCodeAt(i)
  return out
}

function bytesToB64url(input: Uint8Array | ArrayBuffer): string {
  const bytes = input instanceof Uint8Array ? input : new Uint8Array(input)
  let bin = ''
  for (let i = 0; i < bytes.length; i++) bin += String.fromCharCode(bytes[i])
  return btoa(bin).replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '')
}

// Import the VAPID private key (raw base64url scalar) as an ECDSA signing key.
// The x/y coordinates are taken from the uncompressed public key (0x04|X|Y).
async function importSigningKey(
  publicKeyB64: string,
  privateKeyB64: string,
): Promise<CryptoKey> {
  const pub = b64urlToBytes(publicKeyB64)
  const jwk: JsonWebKey = {
    kty: 'EC',
    crv: 'P-256',
    x: bytesToB64url(pub.slice(1, 33)),
    y: bytesToB64url(pub.slice(33, 65)),
    d: bytesToB64url(b64urlToBytes(privateKeyB64)),
    ext: true,
  }
  return crypto.subtle.importKey(
    'jwk',
    jwk,
    { name: 'ECDSA', namedCurve: 'P-256' },
    false,
    ['sign'],
  )
}

async function vapidAuthHeader(
  endpoint: string,
  publicKeyB64: string,
  privateKeyB64: string,
  subject: string,
): Promise<string> {
  const aud = new URL(endpoint).origin
  const enc = new TextEncoder()
  const header = bytesToB64url(enc.encode(JSON.stringify({ typ: 'JWT', alg: 'ES256' })))
  const payload = bytesToB64url(
    enc.encode(
      JSON.stringify({
        aud,
        exp: Math.floor(Date.now() / 1000) + 12 * 60 * 60,
        sub: subject,
      }),
    ),
  )
  const signingInput = `${header}.${payload}`
  const key = await importSigningKey(publicKeyB64, privateKeyB64)
  const sig = await crypto.subtle.sign(
    { name: 'ECDSA', hash: 'SHA-256' },
    key,
    enc.encode(signingInput),
  )
  const jwt = `${signingInput}.${bytesToB64url(sig)}`
  return `vapid t=${jwt}, k=${publicKeyB64}`
}

/** Send a payloadless push. Returns the push service HTTP status. */
export async function sendPush(
  endpoint: string,
  publicKeyB64: string,
  privateKeyB64: string,
  subject: string,
): Promise<number> {
  const authorization = await vapidAuthHeader(
    endpoint,
    publicKeyB64,
    privateKeyB64,
    subject,
  )
  const res = await fetch(endpoint, {
    method: 'POST',
    headers: { Authorization: authorization, TTL: '86400' },
  })
  return res.status
}
