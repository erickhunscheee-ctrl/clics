import { randomBytes } from "crypto";
import { v4 as uuidv4 } from "uuid";

/**
 * Generate a secure access token for orders
 * Combines UUID v4 with random bytes for extra entropy
 */
export function generateAccessToken(): string {
  const uuid = uuidv4();
  const random = randomBytes(16).toString("hex");
  return `${uuid}-${random}`;
}

/**
 * Calculate token expiration date (default: 30 days from now)
 */
export function getTokenExpiration(days: number = 30): Date {
  const date = new Date();
  date.setDate(date.getDate() + days);
  return date;
}
