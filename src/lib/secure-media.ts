import crypto from "crypto";

const TOKEN_VERSION = "v1";
const TOKEN_TTL_MS = 1000 * 60 * 20;

type MediaKind = "image" | "stream" | "subtitle";

type MediaTokenPayload = {
  kind: MediaKind;
  url: string;
  exp: number;
  ua: string;
};

function secret() {
  return crypto.createHash("sha256").update(process.env.MEDIA_TOKEN_SECRET || process.env.NEXTAUTH_SECRET || process.env.SUPABASE_SERVICE_ROLE_KEY || "dramova-local-media-secret").digest();
}

function base64url(input: Buffer) {
  return input.toString("base64url");
}

function userAgentHash(userAgent: string) {
  return crypto.createHash("sha256").update(userAgent || "unknown").digest("base64url");
}

export function createMediaToken(kind: MediaKind, url: string, userAgent = "") {
  const iv = crypto.randomBytes(12);
  const cipher = crypto.createCipheriv("aes-256-gcm", secret(), iv);
  const payload: MediaTokenPayload = { kind, url, exp: Date.now() + TOKEN_TTL_MS, ua: userAgentHash(userAgent) };
  const encrypted = Buffer.concat([cipher.update(JSON.stringify(payload), "utf8"), cipher.final()]);
  const tag = cipher.getAuthTag();
  return [TOKEN_VERSION, base64url(iv), base64url(tag), base64url(encrypted)].join(".");
}

export function readMediaToken(token: string, expectedKind: MediaKind, userAgent = "") {
  const [version, ivPart, tagPart, encryptedPart] = token.split(".");
  if (version !== TOKEN_VERSION || !ivPart || !tagPart || !encryptedPart) return null;

  try {
    const decipher = crypto.createDecipheriv("aes-256-gcm", secret(), Buffer.from(ivPart, "base64url"));
    decipher.setAuthTag(Buffer.from(tagPart, "base64url"));
    const decrypted = Buffer.concat([decipher.update(Buffer.from(encryptedPart, "base64url")), decipher.final()]);
    const payload = JSON.parse(decrypted.toString("utf8")) as MediaTokenPayload;
    if (payload.kind !== expectedKind || payload.exp < Date.now() || payload.ua !== userAgentHash(userAgent) || !/^https?:\/\//i.test(payload.url)) return null;
    return payload.url;
  } catch {
    return null;
  }
}

export function mediaPath(kind: MediaKind, url: string, userAgent = "") {
  return `/api/media/${kind}?token=${createMediaToken(kind, url, userAgent)}`;
}
