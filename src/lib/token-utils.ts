import jwt from "jsonwebtoken";
import { prisma } from "./db";

export interface TokenPayload {
  userId: string;
  role: string;
  type: "access" | "refresh";
}

export interface TokenPair {
  accessToken: string;
  refreshToken: string;
}

// Token expiration times
export const TOKEN_EXPIRES = {
  ACCESS: "15m", // Short-lived access token
  REFRESH: "7d", // Long-lived refresh token
};

function getSecret(): string {
  const secret = process.env.JWT_SECRET;
  if (!secret) {
    throw new Error("JWT_SECRET is not defined");
  }
  return secret;
}

// Generate access token (short-lived)
export function generateAccessToken(userId: string, role: string): string {
  const payload: TokenPayload = {
    userId,
    role,
    type: "access",
  };

  return jwt.sign(payload, getSecret(), {
    expiresIn: TOKEN_EXPIRES.ACCESS,
    issuer: "social-media-app",
    audience: "social-media-app-users",
  } as jwt.SignOptions);
}

// Generate refresh token (long-lived)
export function generateRefreshToken(userId: string, role: string): string {
  const payload: TokenPayload = {
    userId,
    role,
    type: "refresh",
  };

  return jwt.sign(payload, getSecret(), {
    expiresIn: TOKEN_EXPIRES.REFRESH,
    issuer: "social-media-app",
    audience: "social-media-app-users",
  } as jwt.SignOptions);
}

// Generate token pair
export async function generateTokenPair(
  userId: string,
  role: string,
): Promise<TokenPair> {
  const accessToken = generateAccessToken(userId, role);
  const refreshToken = generateRefreshToken(userId, role);

  // Store refresh token in database
  await storeRefreshToken(refreshToken, userId);

  return { accessToken, refreshToken };
}

// Store refresh token in database
export async function storeRefreshToken(
  token: string,
  userId: string,
): Promise<void> {
  // Decode token to get expiration
  const decoded = jwt.decode(token) as { exp: number };
  const expiresAt = new Date(decoded.exp * 1000);

  // Clean up old refresh tokens for this user (optional: keep last 5)
  const existingTokens = await prisma.refreshToken.findMany({
    where: { userId, isRevoked: false },
    orderBy: { createdAt: "desc" },
  });

  // Revoke old tokens if more than 5
  if (existingTokens.length >= 5) {
    const tokensToRevoke = existingTokens.slice(4);
    await prisma.refreshToken.updateMany({
      where: {
        id: { in: tokensToRevoke.map((t) => t.id) },
      },
      data: { isRevoked: true },
    });
  }

  // Store new refresh token
  await prisma.refreshToken.create({
    data: {
      token,
      userId,
      expiresAt,
    },
  });
}

// Verify and decode token
export function verifyToken(token: string): TokenPayload {
  try {
    const decoded = jwt.verify(token, getSecret(), {
      issuer: "social-media-app",
      audience: "social-media-app-users",
    }) as TokenPayload;

    return decoded;
  } catch (error) {
    if (error instanceof jwt.TokenExpiredError) {
      throw new Error("Token expired");
    }
    if (error instanceof jwt.JsonWebTokenError) {
      throw new Error("Invalid token");
    }
    throw new Error("Token verification failed");
  }
}

// Refresh access token using refresh token
export async function refreshAccessToken(
  refreshToken: string,
): Promise<TokenPair | null> {
  try {
    // Verify refresh token
    const decoded = verifyToken(refreshToken);

    if (decoded.type !== "refresh") {
      throw new Error("Invalid token type");
    }

    // Check if refresh token exists and is not revoked
    const storedToken = await prisma.refreshToken.findFirst({
      where: {
        token: refreshToken,
        isRevoked: false,
        expiresAt: { gt: new Date() },
      },
      include: { user: true },
    });

    if (!storedToken) {
      throw new Error("Refresh token not found or expired");
    }

    // Revoke the used refresh token
    await prisma.refreshToken.update({
      where: { id: storedToken.id },
      data: { isRevoked: true },
    });

    // Generate new token pair
    const newTokenPair = await generateTokenPair(
      storedToken.user.id,
      storedToken.user.role,
    );

    return newTokenPair;
  } catch (error) {
    console.error("Refresh token error:", error);
    return null;
  }
}

// Revoke refresh token (logout)
export async function revokeRefreshToken(token: string): Promise<void> {
  await prisma.refreshToken.updateMany({
    where: { token },
    data: { isRevoked: true },
  });
}

// Revoke all refresh tokens for a user (logout all devices)
export async function revokeAllRefreshTokens(userId: string): Promise<void> {
  await prisma.refreshToken.updateMany({
    where: { userId, isRevoked: false },
    data: { isRevoked: true },
  });
}

// Clean up expired tokens (run this periodically)
export async function cleanupExpiredTokens(): Promise<void> {
  await prisma.refreshToken.deleteMany({
    where: {
      OR: [
        { expiresAt: { lt: new Date() } },
        {
          isRevoked: true,
          createdAt: { lt: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000) },
        }, // 30 days old revoked tokens
      ],
    },
  });
}
