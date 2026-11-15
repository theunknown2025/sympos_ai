/**
 * Express API Server for Sending Emails via Hostinger SMTP
 *
 * Uses nodemailer with Hostinger mailbox credentials from .env.
 * Run this server alongside your Vite dev server.
 *
 * Usage:
 *   npm run email-server
 *
 * Or manually:
 *   node server/email-api.js
 */

import express from 'express';
import cors from 'cors';
import nodemailer from 'nodemailer';
import dotenv from 'dotenv';
import { existsSync } from 'fs';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';
import { registerParticipantAccountRoutes } from './participantAccountRoutes.js';
import { registerSuperAdminAccountRoutes } from './superAdminAccountRoutes.js';
import { registerOrganizerProOrderRoutes } from './organizerProOrderRoutes.js';

// Get current directory for ES modules
const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

/** Only this file is loaded. .env.example is a template and is never read by the email server. */
const ENV_FILE_PATH = join(__dirname, '..', '.env');

/** Trim and strip optional surrounding quotes (required when password contains @ or #). */
function readEnv(key) {
  const raw = process.env[key];
  if (raw == null || raw === '') return '';
  return raw.trim().replace(/^["']|["']$/g, '');
}

function loadEnvFile() {
  const exists = existsSync(ENV_FILE_PATH);
  if (!exists) {
    console.warn(`⚠️  Missing ${ENV_FILE_PATH}`);
    console.warn('   Copy .env.example → .env and set SMTP_USER / SMTP_PASSWORD.');
  }
  // override: true ensures .env wins over stale Windows/shell SMTP_* variables
  dotenv.config({ path: ENV_FILE_PATH, override: true });
  return exists;
}

function buildSmtpRuntime() {
  const smtpPort = parseInt(readEnv('SMTP_PORT') || '465', 10);
  const smtpSecureEnv = readEnv('SMTP_SECURE');
  const smtpSecure =
    smtpSecureEnv === 'true' ? true : smtpSecureEnv === 'false' ? false : smtpPort === 465;

  const authUser = readEnv('SMTP_USER');
  const authPass = readEnv('SMTP_PASSWORD');

  return {
    smtp: {
      host: readEnv('SMTP_HOST') || 'smtp.hostinger.com',
      port: smtpPort,
      secure: smtpSecure,
      auth: { user: authUser, pass: authPass },
    },
    fromEmail: readEnv('FROM_EMAIL') || authUser,
    fromName: readEnv('FROM_NAME') || 'Sympos-ia Committee',
  };
}

let smtpRuntime = (() => {
  loadEnvFile();
  return buildSmtpRuntime();
})();

function reloadSmtpRuntime() {
  loadEnvFile();
  smtpRuntime = buildSmtpRuntime();
  transporter = null;
  return smtpRuntime;
}

function logEnvSummary() {
  console.log('📋 SMTP config source: .env only (NOT .env.example)');
  console.log('   File:', ENV_FILE_PATH);
  console.log('   SMTP_HOST:', smtpRuntime.smtp.host);
  console.log('   SMTP_PORT:', smtpRuntime.smtp.port);
  console.log('   SMTP_USER:', smtpRuntime.smtp.auth.user || 'NOT SET');
  console.log('   SMTP_PASSWORD:', smtpRuntime.smtp.auth.pass ? '***SET***' : 'NOT SET');
  console.log('   FROM_EMAIL:', smtpRuntime.fromEmail || 'NOT SET');
}

logEnvSummary();

const app = express();
const PORT = readEnv('EMAIL_SERVER_PORT') || 3001;

// Middleware
const allowedOrigins = new Set(
  [readEnv('VITE_APP_URL'), ...readEnv('EMAIL_CORS_ORIGINS').split(',')]
    .map((value) => value.trim())
    .filter(Boolean)
);

app.use(cors({
  origin(origin, callback) {
    if (!origin) return callback(null, true);
    if (allowedOrigins.has(origin)) return callback(null, true);
    try {
      const host = new URL(origin).hostname;
      if (host === 'localhost' || host === '127.0.0.1' || host.endsWith('.amplifyapp.com')) {
        return callback(null, true);
      }
    } catch {
      // Ignore malformed Origin headers.
    }
    return callback(null, false);
  },
  credentials: true,
}));
app.use(express.json({ limit: '2mb' }));

function printHostingerSmtpHelp() {
  console.error(`
⚠️  Hostinger SMTP authentication failed (EAUTH)

Where to check (in order):

1) Hostinger hPanel → Emails → mailbox (e.g. contact@symposai.pro)
   - Confirm the mailbox exists and is active
   - Use the mailbox password (not the hPanel login password)
   - Open Configuration / Connect apps and confirm SMTP is enabled

2) Project .env only (NOT .env.example) at:
   ${ENV_FILE_PATH}
   - SMTP_HOST = smtp.hostinger.com
   - SMTP_USER = full mailbox address
   - SMTP_PASSWORD = mailbox password in DOUBLE QUOTES if it contains @ # or spaces
   - FROM_EMAIL = same mailbox (or an allowed alias)
   - Restart after changes: npm run email-server

3) Try alternate Hostinger port (in .env):
   - SSL:  SMTP_PORT=465  SMTP_SECURE=true
   - TLS:  SMTP_PORT=587  SMTP_SECURE=false

4) Log in to webmail (https://webmail.hostinger.com) with the same email + password.

See HOSTINGER_SMTP_SETUP.md in the project for full steps.
`);
}

// Create reusable transporter
let transporter = null;

function createTransporter() {
  const { smtp } = smtpRuntime;
  if (!smtp.auth.user || !smtp.auth.pass) {
    throw new Error('SMTP credentials not configured. Please set SMTP_USER and SMTP_PASSWORD in .env');
  }

  const transportOptions = {
    host: smtp.host,
    port: smtp.port,
    secure: smtp.secure,
    auth: {
      user: smtp.auth.user,
      pass: smtp.auth.pass,
    },
    tls: {
      minVersion: 'TLSv1.2',
    },
  };

  if (smtp.port === 587 && !smtp.secure) {
    transportOptions.requireTLS = true;
  }

  return nodemailer.createTransport(transportOptions);
}

async function verifySmtpConnection() {
  const testTransporter = createTransporter();
  await testTransporter.verify();
  testTransporter.close();
}

// Health check endpoint
app.get('/health', (req, res) => {
  res.json({
    status: 'ok',
    service: 'email-api',
    envSource: '.env',
    envFile: ENV_FILE_PATH,
    envFileExists: existsSync(ENV_FILE_PATH),
    smtpUser: smtpRuntime.smtp.auth.user || null,
    smtpHost: smtpRuntime.smtp.host,
    smtpPort: smtpRuntime.smtp.port,
    smtpConfigured: !!(smtpRuntime.smtp.auth.user && smtpRuntime.smtp.auth.pass),
  });
});

// Send email endpoint
app.post('/api/send-email', async (req, res) => {
  try {
    // Validate request body
    const { to, subject, html, recipientName } = req.body;

    if (!to || !subject || !html) {
      return res.status(400).json({
        error: 'Missing required fields',
        message: 'Please provide: to, subject, and html'
      });
    }

    // Validate email format
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(to)) {
      return res.status(400).json({
        error: 'Invalid email address',
        message: 'Please provide a valid email address'
      });
    }

    // Create transporter if not exists
    if (!transporter) {
      try {
        transporter = createTransporter();
        console.log('SMTP transporter created successfully');
      } catch (error) {
        console.error('Failed to create SMTP transporter:', error);
        return res.status(500).json({
          error: 'Email service not configured',
          message: 'SMTP credentials are missing or invalid. Please check your environment variables.'
        });
      }
    }

    // Verify SMTP connection (optional, can be removed for better performance)
    try {
      await transporter.verify();
    } catch (verifyError) {
      console.error('SMTP verification failed:', verifyError);
      // Continue anyway - some servers don't support verify
    }

    // Prepare email options
    const mailOptions = {
      from: `"${smtpRuntime.fromName}" <${smtpRuntime.fromEmail}>`,
      to: to,
      subject: subject,
      html: html,
      text: html.replace(/<[^>]*>/g, '').replace(/\n\s*\n/g, '\n'),
    };

    console.log(`Sending email to ${to} via ${smtpRuntime.smtp.auth.user}...`);
    const info = await transporter.sendMail(mailOptions);

    console.log('Email sent successfully:', {
      messageId: info.messageId,
      to: to,
      subject: subject
    });

    res.json({
      success: true,
      messageId: info.messageId,
      to: to,
      message: 'Email sent successfully'
    });

  } catch (error) {
    console.error('Error sending email:', error);

    // Handle specific error types
    if (error.code === 'EAUTH') {
      transporter = null;
      reloadSmtpRuntime();
      logEnvSummary();
      return res.status(401).json({
        error: 'SMTP Authentication failed',
        message:
          `Invalid SMTP credentials for ${smtpRuntime.smtp.auth.user || '(not set)'}. ` +
          'Edit .env (not .env.example), then stop and restart: npm run email-server. ' +
          `Check http://localhost:${PORT}/health shows the correct smtpUser.`,
      });
    }

    if (error.code === 'ECONNECTION' || error.code === 'ETIMEDOUT') {
      return res.status(503).json({
        error: 'SMTP Connection failed',
        message: 'Could not connect to SMTP server. Please check your SMTP_HOST and SMTP_PORT settings.'
      });
    }

    res.status(500).json({
      error: 'Failed to send email',
      message: error.message || 'An unexpected error occurred while sending the email'
    });
  }
});

// Send multiple emails endpoint (for bulk sending)
app.post('/api/send-emails', async (req, res) => {
  try {
    const { emails } = req.body;

    if (!Array.isArray(emails) || emails.length === 0) {
      return res.status(400).json({
        error: 'Invalid request',
        message: 'Please provide an array of email objects with to, subject, and html fields'
      });
    }

    // Create transporter if not exists
    if (!transporter) {
      try {
        transporter = createTransporter();
      } catch (error) {
        return res.status(500).json({
          error: 'Email service not configured',
          message: 'SMTP credentials are missing or invalid.'
        });
      }
    }

    // Send all emails
    const results = await Promise.allSettled(
      emails.map(async (emailData) => {
        const { to, subject, html } = emailData;

        if (!to || !subject || !html) {
          throw new Error('Missing required fields: to, subject, html');
        }

        const mailOptions = {
          from: `"${smtpRuntime.fromName}" <${smtpRuntime.fromEmail}>`,
          to: to,
          subject: subject,
          html: html,
          text: html.replace(/<[^>]*>/g, '').replace(/\n\s*\n/g, '\n')
        };

        const info = await transporter.sendMail(mailOptions);
        return { success: true, email: to, messageId: info.messageId };
      })
    );

    // Process results
    const succeeded = results.filter(r => r.status === 'fulfilled').map(r => r.value);
    const failed = results.filter(r => r.status === 'rejected').map(r => ({
      error: r.reason.message || 'Unknown error'
    }));

    res.json({
      success: true,
      sent: succeeded.length,
      failed: failed.length,
      total: emails.length,
      results: {
        succeeded,
        failed
      }
    });

  } catch (error) {
    console.error('Error sending bulk emails:', error);
    res.status(500).json({
      error: 'Failed to send emails',
      message: error.message || 'An unexpected error occurred'
    });
  }
});

registerParticipantAccountRoutes(app, { readEnv });
registerSuperAdminAccountRoutes(app, { readEnv });
registerOrganizerProOrderRoutes(app, { readEnv });

// Start server
app.listen(PORT, () => {
  console.log(`\n📧 Email API Server running on http://localhost:${PORT}`);
  console.log(`   Health check: http://localhost:${PORT}/health`);
  if (!smtpRuntime.smtp.auth.user || !smtpRuntime.smtp.auth.pass) {
    console.warn('\n⚠️  WARNING: SMTP credentials not configured in .env!');
  } else {
    verifySmtpConnection()
      .then(() => console.log('\n✅ SMTP login verified with Hostinger.'))
      .catch((err) => {
        console.error('\n❌ SMTP login failed:', err.message);
        printHostingerSmtpHelp();
      });
  }
  console.log('');
});

// Handle graceful shutdown
process.on('SIGTERM', () => {
  console.log('SIGTERM signal received: closing email server');
  if (transporter) {
    transporter.close();
  }
  process.exit(0);
});

