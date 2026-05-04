import { PrismaClient } from "@prisma/client";
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

function encryptEmail(plaintext: string | null | undefined): string | null {
  if (!plaintext) return plaintext as null;
  const key = getKey();
  const iv = randomBytes(IV_LENGTH);
  const cipher = createCipheriv(ALGORITHM, key, iv, { authTagLength: AUTH_TAG_LENGTH });
  const encrypted = Buffer.concat([cipher.update(plaintext, "utf8"), cipher.final()]);
  const authTag = cipher.getAuthTag();
  return `${iv.toString("base64")}:${encrypted.toString("base64")}:${authTag.toString("base64")}`;
}

function decryptEmail(encrypted: string | null | undefined): string | null {
  if (!encrypted) return encrypted as null;
  const parts = encrypted.split(":");
  if (parts.length !== 3) return encrypted;
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

function hashEmail(email: string | null | undefined): string | null {
  if (!email) return null;
  const key = getKey();
  return createHmac("sha256", key).update(email.trim().toLowerCase()).digest("hex");
}

const prisma = new PrismaClient();

async function main() {
  console.log("Starting email encryption migration...\n");

  const players = await prisma.player.findMany({
    where: { email: { not: null } },
    select: { id: true, email: true, emailHash: true },
  });

  let playerCount = 0;
  for (const p of players) {
    if (!p.email) continue;

    const parts = p.email.split(":");
    const isAlreadyEncrypted = parts.length === 3;

    if (isAlreadyEncrypted && p.emailHash) continue;

    const plaintext = isAlreadyEncrypted ? decryptEmail(p.email)! : p.email;

    await prisma.player.update({
      where: { id: p.id },
      data: {
        email: isAlreadyEncrypted ? p.email : encryptEmail(plaintext),
        emailHash: hashEmail(plaintext),
      },
    });
    playerCount++;
  }
  console.log(`  Players: ${playerCount} updated (${players.length} total)`);

  const registrations = await prisma.registration.findMany({
    where: { submitterEmail: { not: "" } },
    select: { id: true, submitterEmail: true },
  });

  let regCount = 0;
  for (const r of registrations) {
    if (!r.submitterEmail) continue;

    const parts = r.submitterEmail.split(":");
    if (parts.length === 3) continue;

    await prisma.registration.update({
      where: { id: r.id },
      data: { submitterEmail: encryptEmail(r.submitterEmail) || "" },
    });
    regCount++;
  }
  console.log(`  Registrations: ${regCount} updated (${registrations.length} total)`);

  const pbRegs = await prisma.pickleballRegistration.findMany({
    select: {
      id: true,
      player1Email: true,
      player1EmailHash: true,
      player2Email: true,
      player2EmailHash: true,
    },
  });

  let pbCount = 0;
  for (const r of pbRegs) {
    const p1Parts = r.player1Email.split(":");
    const p1Encrypted = p1Parts.length === 3;
    const p2Parts = r.player2Email?.split(":") || [];
    const p2Encrypted = p2Parts.length === 3;

    const needsUpdate =
      (!p1Encrypted || !r.player1EmailHash) ||
      (r.player2Email && (!p2Encrypted || !r.player2EmailHash));

    if (!needsUpdate) continue;

    const p1Plain = p1Encrypted ? decryptEmail(r.player1Email)! : r.player1Email;
    const p2Plain = r.player2Email
      ? (p2Encrypted ? decryptEmail(r.player2Email)! : r.player2Email)
      : null;

    await prisma.pickleballRegistration.update({
      where: { id: r.id },
      data: {
        player1Email: p1Encrypted ? r.player1Email : encryptEmail(p1Plain)!,
        player1EmailHash: hashEmail(p1Plain),
        player2Email: p2Plain ? (p2Encrypted ? r.player2Email : encryptEmail(p2Plain)) : null,
        player2EmailHash: p2Plain ? hashEmail(p2Plain) : null,
      },
    });
    pbCount++;
  }
  console.log(`  Pickleball: ${pbCount} updated (${pbRegs.length} total)`);

  console.log("\nMigration complete!");
}

main()
  .catch((e) => {
    console.error("Migration failed:", e);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
