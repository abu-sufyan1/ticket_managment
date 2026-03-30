import 'dotenv/config';
import { PrismaClient } from '../src/generated/prisma/client';
import { PrismaPg } from '@prisma/adapter-pg';
import pg from 'pg';

const pool = new pg.Pool({ connectionString: process.env.DATABASE_URL });
const prisma = new PrismaClient({ adapter: new PrismaPg(pool) });

const entries = [
  {
    title: 'How to reset your password',
    content:
      'To reset your password, click "Forgot password" on the login page, enter your email, and follow the link sent to you. The link expires after 24 hours.',
  },
  {
    title: 'How to update billing information',
    content:
      'Go to Settings → Billing → Payment Methods to add, remove, or update your credit/debit card. Changes take effect immediately.',
  },
  {
    title: 'How to cancel your subscription',
    content:
      'Go to Settings → Billing → Subscription and click "Cancel Subscription". Your account stays active until the end of the current billing period.',
  },
  {
    title: 'How to export your data',
    content:
      'Go to Settings → Account → Data Export to request a CSV or JSON export. The file will be emailed to you within 24 hours.',
  },
  {
    title: 'How to invite team members',
    content:
      'Go to Settings → Team → Invite Members, enter the email address, select a role, and send the invitation.',
  },
  {
    title: 'Supported file upload formats',
    content:
      'Supported formats: images (JPEG, PNG, GIF, WebP), documents (PDF, DOCX, XLSX), archives (ZIP). Max 25 MB per file.',
  },
  {
    title: 'Two-factor authentication setup',
    content:
      'Enable 2FA at Settings → Security → Two-Factor Authentication. Scan the QR code with Google Authenticator or Authy.',
  },
];

async function main() {
  console.log('Seeding knowledge base…');
  // Only insert if the table is empty to avoid duplicates on re-runs
  const existing = await prisma.knowledgeBase.count();
  if (existing === 0) {
    await prisma.knowledgeBase.createMany({ data: entries });
    console.log(`Created ${entries.length} knowledge base entries.`);
  } else {
    console.log(`Knowledge base already has ${existing} entries — skipping seed.`);
  }
}

main()
  .catch(console.error)
  .finally(() => prisma.$disconnect());
