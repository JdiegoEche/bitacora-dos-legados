import { SignJWT, jwtVerify } from 'jose';

// ─── Configuration ──────────────────────────────────────────────────────────

function getJwtSecret(): Uint8Array {
  const secret = process.env.JWT_SECRET;
  if (!secret) {
    if (process.env.NODE_ENV === 'production') {
      throw new Error('JWT_SECRET environment variable is required in production');
    }
    console.warn('[auth] WARNING: Using dev JWT secret. Set JWT_SECRET env var for production.');
  }
  return new TextEncoder().encode(secret ?? 'bitacora-dev-jwt-secret-do-not-use-in-production');
}

const JWT_SECRET = getJwtSecret();
const JWT_ISSUER = 'bitacora-cafe';
const JWT_EXPIRATION = '7d'; // 7 days

// ─── JWT Functions ──────────────────────────────────────────────────────────

/**
 * Sign a JWT with the user's identity.
 * Returns a signed HS256 JWT string.
 */
export async function signJWT(payload: {
  userId: number;
  email: string;
}): Promise<string> {
  return new SignJWT({ userId: payload.userId, email: payload.email })
    .setProtectedHeader({ alg: 'HS256' })
    .setIssuedAt()
    .setExpirationTime(JWT_EXPIRATION)
    .setIssuer(JWT_ISSUER)
    .sign(JWT_SECRET);
}

/**
 * Verify a JWT and return the decoded payload.
 * Throws if the token is invalid, expired, or tampered.
 */
export async function verifyJWT(
  token: string
): Promise<{ userId: number; email: string }> {
  const { payload } = await jwtVerify(token, JWT_SECRET, {
    issuer: JWT_ISSUER,
  });

  return {
    userId: payload.userId as number,
    email: payload.email as string,
  };
}
