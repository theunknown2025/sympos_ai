/**
 * Quick SMTP check: node scripts/test-smtp.mjs
 * Uses .env from project root.
 */
import dotenv from 'dotenv';
import nodemailer from 'nodemailer';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';

const __dirname = dirname(fileURLToPath(import.meta.url));
dotenv.config({ path: join(__dirname, '..', '.env'), override: true });

function readEnv(key) {
  const raw = process.env[key];
  if (raw == null || raw === '') return '';
  return raw.trim().replace(/^["']|["']$/g, '');
}

const port = parseInt(readEnv('SMTP_PORT') || '465', 10);
const secureEnv = readEnv('SMTP_SECURE');
const secure =
  secureEnv === 'true' ? true : secureEnv === 'false' ? false : port === 465;

const user = readEnv('SMTP_USER');
const pass = readEnv('SMTP_PASSWORD');
const host = readEnv('SMTP_HOST') || 'email-smtp.us-east-1.amazonaws.com';

console.log('Host:', host);
console.log('Port:', port, 'secure:', secure);
console.log('User:', user || '(not set)');

if (!user || !pass) {
  console.error('Set SMTP_USER and SMTP_PASSWORD in .env');
  process.exit(1);
}

const transportOptions = {
  host,
  port,
  secure,
  auth: { user, pass },
  tls: { minVersion: 'TLSv1.2' },
};
if (port === 587 && !secure) transportOptions.requireTLS = true;

const transporter = nodemailer.createTransport(transportOptions);

try {
  await transporter.verify();
  console.log('SMTP authentication: OK');
  process.exit(0);
} catch (err) {
  console.error('SMTP authentication: FAILED');
  console.error('Code:', err.code);
  console.error('Message:', err.message);
  console.error('\nSee AMAZON_SES_SMTP_SETUP.md');
  process.exit(1);
} finally {
  transporter.close();
}
