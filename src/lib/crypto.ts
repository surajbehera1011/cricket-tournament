import { createCipheriv, createDecipheriv, createHmac, randomBytes } from "crypto";

const ALGORITHM = "aes-256-gcm";
const IV_LENGTH = 12;
const AUTH_TAG_LENGTH = 16;

function getKey(): Buffer {
  const hex = process.env.ENCRYPTION_KEY;
  if (!hex || hex.length !== 64) {
    throw new Error("ENCRYPTION_KEY must be a 64-char hex string (32 bytes)");
  }
  return Buffer.from(hex, "hex");
}

export function encryptEmail(plaintext: string | null | undefined): string | null {
  if (!plaintext) return plaintext as null;

  const key = getKey();
  const iv = randomBytes(IV_LENGTH);
  const cipher = createCipheriv(ALGORITHM, key, iv, { authTagLength: AUTH_TAG_LENGTH });

  const encrypted = Buffer.concat([cipher.update(plaintext, "utf8"), cipher.final()]);
  const authTag = cipher.getAuthTag();

  return `${iv.toString("base64")}:${encrypted.toString("base64")}:${authTag.toString("base64")}`;
}

export function decryptEmail(encrypted: string | null | undefined): string | null {
  if (!encrypted) return encrypted as null;

  const parts = encrypted.split(":");
  if (parts.length !== 3) {
    return encrypted;
  }

  try {
    const key = getKey();
    const iv = Buffer.from(parts[0], "base64");
    const ciphertext = Buffer.from(parts[1], "base64");
    const authTag = Buffer.from(parts[2], "base64");

    const decipher = createDecipheriv(ALGORITHM, key, iv, { authTagLength: AUTH_TAG_LENGTH });
    decipher.setAuthTag(authTag);

    return Buffer.concat([decipher.update(ciphertext), decipher.final()]).toString("utf8");
  } catch {
    return encrypted;
  }
}

export function hashEmail(email: string | null | undefined): string | null {
  if (!email) return null;

  const key = getKey();
  return createHmac("sha256", key).update(email.trim().toLowerCase()).digest("hex");
}
