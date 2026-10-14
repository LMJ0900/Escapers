interface TokenPayload {
  email: string;
}

function encode(payload: TokenPayload): string {
  const json = JSON.stringify(payload);
  return typeof btoa !== "undefined"
    ? btoa(json)
    : Buffer.from(json).toString("base64");
}

function decode(payloadSegment: string): TokenPayload | null {
  try {
    const json =
      typeof atob !== "undefined"
        ? atob(payloadSegment)
        : Buffer.from(payloadSegment, "base64").toString("utf-8");
    return JSON.parse(json);
  } catch {
    return null;
  }
}

export function issueAccessToken(email: string): string {
  return `eyJhbGciOiJIUzI1NiJ9.${encode({ email })}.mock-access-sig`;
}

export function issueRefreshToken(email: string): string {
  return `eyJhbGciOiJIUzI1NiJ9.${encode({ email })}.mock-refresh-sig`;
}

export function getEmailFromToken(token: string): string | null {
  const [, payloadSegment] = token.split(".");
  if (!payloadSegment) return null;
  return decode(payloadSegment)?.email ?? null;
}
