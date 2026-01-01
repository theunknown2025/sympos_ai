/**
 * Express API Server for Sending Emails via Hostinger SMTP
 * 
 * This server handles email sending using nodemailer with Hostinger SMTP credentials.
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
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

// Get current directory for ES modules
const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// Load environment variables from project root
dotenv.config({ path: join(__dirname, '..', '.env') });

// Debug: Log loaded environment variables (without sensitive data)
console.log('📋 Environment variables loaded:');
console.log('   SMTP_HOST:', process.env.SMTP_HOST || 'NOT SET');
console.log('   SMTP_PORT:', process.env.SMTP_PORT || 'NOT SET');
console.log('   SMTP_USER:', process.env.SMTP_USER ? `${process.env.SMTP_USER.substring(0, 5)}...` : 'NOT SET');
console.log('   SMTP_PASSWORD:', process.env.SMTP_PASSWORD ? '***SET***' : 'NOT SET');
console.log('   FROM_EMAIL:', process.env.FROM_EMAIL || 'NOT SET');
console.log('   FROM_NAME:', process.env.FROM_NAME || 'NOT SET');

const app = express();
const PORT = process.env.EMAIL_SERVER_PORT || 3001;

// Middleware
app.use(cors({
  origin: process.env.VITE_APP_URL || 'http://localhost:3000',
  credentials: true
}));
app.use(express.json());

// SMTP Configuration from environment variables
const SMTP_CONFIG = {
  host: process.env.SMTP_HOST || 'smtp.hostinger.com',
  port: parseInt(process.env.SMTP_PORT || '465'),
  secure: true, // true for 465, false for other ports
  auth: {
    user: process.env.SMTP_USER || '',
    pass: process.env.SMTP_PASSWORD || ''
  }
};

const FROM_EMAIL = process.env.FROM_EMAIL || SMTP_CONFIG.auth.user;
const FROM_NAME = process.env.FROM_NAME || 'Sympos-ia Committee';

// Create reusable transporter
let transporter = null;

function createTransporter() {
  if (!SMTP_CONFIG.auth.user || !SMTP_CONFIG.auth.pass) {
    throw new Error('SMTP credentials not configured. Please set SMTP_USER and SMTP_PASSWORD environment variables.');
  }

  return nodemailer.createTransport({
    host: SMTP_CONFIG.host,
    port: SMTP_CONFIG.port,
    secure: SMTP_CONFIG.port === 465, // true for 465, false for other ports
    auth: {
      user: SMTP_CONFIG.auth.user,
      pass: SMTP_CONFIG.auth.pass
    },
    // Additional options for better compatibility
    tls: {
      rejectUnauthorized: false // Some SMTP servers require this
    }
  });
}

// Health check endpoint
app.get('/health', (req, res) => {
  res.json({ 
    status: 'ok', 
    service: 'email-api',
    smtpConfigured: !!(SMTP_CONFIG.auth.user && SMTP_CONFIG.auth.pass)
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
      from: `"${FROM_NAME}" <${FROM_EMAIL}>`,
      to: to,
      subject: subject,
      html: html,
      // Optional: Add text version
      text: html.replace(/<[^>]*>/g, '').replace(/\n\s*\n/g, '\n')
    };

    // Send email
    console.log(`Sending email to ${to}...`);
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
      return res.status(401).json({
        error: 'SMTP Authentication failed',
        message: 'Invalid SMTP credentials. Please check your SMTP_USER and SMTP_PASSWORD.'
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
          from: `"${FROM_NAME}" <${FROM_EMAIL}>`,
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

// Start server
app.listen(PORT, () => {
  console.log(`\n📧 Email API Server running on http://localhost:${PORT}`);
  console.log(`   Health check: http://localhost:${PORT}/health`);
  console.log(`\n📧 SMTP Configuration:`);
  console.log(`   Host: ${SMTP_CONFIG.host}`);
  console.log(`   Port: ${SMTP_CONFIG.port}`);
  console.log(`   User: ${SMTP_CONFIG.auth.user ? `${SMTP_CONFIG.auth.user.substring(0, 10)}...` : 'NOT SET'}`);
  console.log(`   Password: ${SMTP_CONFIG.auth.pass ? '***SET***' : 'NOT SET'}`);
  console.log(`   From Email: ${FROM_EMAIL}`);
  console.log(`   From Name: ${FROM_NAME}`);
  
  if (!SMTP_CONFIG.auth.user || !SMTP_CONFIG.auth.pass) {
    console.warn('\n⚠️  WARNING: SMTP credentials not configured!');
    console.warn('   Please check your .env file in the project root.');
    console.warn('   Required variables: SMTP_USER, SMTP_PASSWORD');
  } else {
    console.log('\n✅ SMTP credentials configured successfully!');
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

