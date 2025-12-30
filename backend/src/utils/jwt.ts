import jwt, { Secret, SignOptions } from "jsonwebtoken";

interface TokenPayload {
  userId: string;
  role: "user" | "admin";
}

const JWT_SECRET: Secret = process.env.JWT_SECRET || "dev-secret";

// e.g. "1d", "15m", "3600"
const JWT_EXPIRES_IN = process.env.JWT_EXPIRES_IN || "1d";

export function signToken(payload: TokenPayload): string {
  const options = {
    expiresIn: JWT_EXPIRES_IN,
  } as SignOptions;

  return jwt.sign(payload, JWT_SECRET, options);
}
 