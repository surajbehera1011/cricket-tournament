import { PrismaClient } from '@prisma/client';
import crypto from 'crypto';

const prisma = new PrismaClient();

const ENCRYPTION_KEY = process.env.EMAIL_ENCRYPTION_KEY;

function decryptEmail(encrypted) {
  if (!encrypted || !ENCRYPTION_KEY) return null;
  try {
    const [ivHex, encryptedHex] = encrypted.split(':');
    if (!ivHex || !encryptedHex) return encrypted; // Not encrypted, return as-is
    const iv = Buffer.from(ivHex, 'base64');
    const key = Buffer.from(ENCRYPTION_KEY, 'hex');
    const decipher = crypto.createDecipheriv('aes-256-cbc', key, iv);
    let decrypted = decipher.update(encryptedHex, 'base64', 'utf8');
    decrypted += decipher.final('utf8');
    return decrypted;
  } catch {
    return null;
  }
}

async function main() {
  // Find Suraj Behera's registrations
  const regs = await prisma.pickleballRegistration.findMany({
    where: { player1Name: { contains: 'Suraj' } },
    select: { id: true, player1Name: true, player1Email: true, category: true },
  });

  console.log(`\n=== Suraj's registrations: ${regs.length} ===`);
  for (const r of regs) {
    const decrypted = decryptEmail(r.player1Email);
    console.log(`  ${r.category} | encrypted: ${r.player1Email.substring(0, 30)}... | decrypted: ${decrypted}`);
  }

  // Check a few other players too
  const sample = await prisma.pickleballRegistration.findMany({
    take: 5,
    select: { id: true, player1Name: true, player1Email: true },
  });
  console.log(`\n=== Sample decryptions ===`);
  for (const r of sample) {
    const decrypted = decryptEmail(r.player1Email);
    console.log(`  ${r.player1Name} | decrypted: ${decrypted}`);
  }
}

main().then(() => prisma.$disconnect()).catch(e => { console.error(e); prisma.$disconnect(); });
