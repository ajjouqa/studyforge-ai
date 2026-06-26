// Minimal single-user auth: a signed cookie whose value is an HMAC of a fixed
// payload. Uses Web Crypto so it works in both the Edge middleware and Node.
import { env } from "./env";

export const AUTH_COOKIE = "sf_auth";
const PAYLOAD = "studyforge-auth-v1";

const encoder = new TextEncoder();

async function hmacHex(secret: string, data: string): Promise<string> {
  const key = await crypto.subtle.importKey(
    "raw",
    encoder.encode(secret),
    { name: "HMAC", hash: "SHA-256" },
    false,
    ["sign"]
  );
  const sig = await crypto.subtle.sign("HMAC", key, encoder.encode(data));
  return Array.from(new Uint8Array(sig))
    .map((b) => b.toString(16).padStart(2, "0"))
    .join("");
}

export async function createToken(): Promise<string> {
  return hmacHex(env.authSecret, PAYLOAD);
}

function timingSafeEqual(a: string, b: string): boolean {
  if (a.length !== b.length) return false;
  let mismatch = 0;
  for (let i = 0; i < a.length; i++) {
    mismatch |= a.charCodeAt(i) ^ b.charCodeAt(i);
  }
  return mismatch === 0;
}

export async function verifyToken(token: string | undefined): Promise<boolean> {
  if (!token) return false;
  const expected = await createToken();
  return timingSafeEqual(token, expected);
}

// Auth is only enforced when an APP_PASSWORD is configured. This keeps local
// development frictionless while allowing a password gate when desired.
export function authEnabled(): boolean {
  return Boolean(env.appPassword);
}

export function checkPassword(input: string): boolean {
  return authEnabled() && input === env.appPassword;
}
