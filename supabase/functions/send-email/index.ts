// Supabase Edge Function: send email through Hostinger SMTP.
// Used by the AWS Amplify site, which cannot run the local Node email server.

import { serve } from 'https://deno.land/std@0.168.0/http/server.ts';
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';
import nodemailer from 'npm:nodemailer@6.9.16';

interface EmailRequest {
  to: string;
  subject: string;
  html: string;
  recipientName?: string;
}

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
};

function json(body: unknown, status = 200): Response {
  return new Response(JSON.stringify(body), {
    status,
    headers: { ...corsHeaders, 'Content-Type': 'application/json' },
  });
}

function readEnv(key: string): string {
  const raw = Deno.env.get(key);
  if (raw == null) return '';
  return raw.trim().replace(/^["']|["']$/g, '');
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  if (req.method !== 'POST') {
    return json({ error: 'Method not allowed' }, 405);
  }

  try {
    const authHeader = req.headers.get('Authorization');
    if (!authHeader) {
      return json({ error: 'Unauthorized', message: 'Missing authorization header' }, 401);
    }

    const supabaseUrl = Deno.env.get('SUPABASE_URL');
    const supabaseAnonKey = Deno.env.get('SUPABASE_ANON_KEY');
    if (!supabaseUrl || !supabaseAnonKey) {
      return json({ error: 'Server configuration error' }, 500);
    }

    const supabaseClient = createClient(supabaseUrl, supabaseAnonKey, {
      global: { headers: { Authorization: authHeader } },
    });

    const {
      data: { user },
      error: userError,
    } = await supabaseClient.auth.getUser();

    if (userError || !user) {
      const errorMessage = userError?.message || 'User not found';
      const isJWTError = /jwt|token|expired/i.test(errorMessage);
      return json(
        {
          error: 'Unauthorized',
          message: isJWTError ? 'Invalid JWT' : errorMessage,
        },
        401
      );
    }

    const emailData = (await req.json()) as EmailRequest;
    if (!emailData.to || !emailData.subject || !emailData.html) {
      return json({ error: 'Missing required fields: to, subject, html' }, 400);
    }

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(emailData.to)) {
      return json({ error: 'Invalid email address' }, 400);
    }

    const smtpHost = readEnv('SMTP_HOST') || 'smtp.hostinger.com';
    const smtpPort = parseInt(readEnv('SMTP_PORT') || '465', 10);
    const smtpUser = readEnv('SMTP_USER');
    const smtpPassword = readEnv('SMTP_PASSWORD');
    const secureEnv = readEnv('SMTP_SECURE');
    const smtpSecure =
      secureEnv === 'true' ? true : secureEnv === 'false' ? false : smtpPort === 465;
    const fromEmail = readEnv('FROM_EMAIL') || smtpUser;
    const fromName = readEnv('FROM_NAME') || 'Sympos-ia Committee';

    if (!smtpUser || !smtpPassword || !fromEmail) {
      return json(
        {
          error: 'Email service not configured',
          message: 'Set SMTP_USER, SMTP_PASSWORD, and FROM_EMAIL as Edge Function secrets.',
        },
        500
      );
    }

    const transporter = nodemailer.createTransport({
      host: smtpHost,
      port: smtpPort,
      secure: smtpSecure,
      auth: { user: smtpUser, pass: smtpPassword },
      requireTLS: smtpPort === 587 && !smtpSecure,
      connectionTimeout: 15_000,
      greetingTimeout: 15_000,
      socketTimeout: 20_000,
      tls: { minVersion: 'TLSv1.2' },
    });

    try {
      const info = await transporter.sendMail({
        from: `"${fromName}" <${fromEmail}>`,
        to: emailData.to,
        subject: emailData.subject,
        html: emailData.html,
        text: emailData.html.replace(/<[^>]*>/g, ' ').replace(/\s+/g, ' ').trim(),
      });

      return json({
        success: true,
        messageId: info.messageId,
        to: emailData.to,
      });
    } catch (smtpError) {
      const message = smtpError instanceof Error ? smtpError.message : 'Unknown SMTP error';
      const code = (smtpError as { code?: string })?.code;
      console.error('SMTP error:', code || message);
      const status = code === 'EAUTH' ? 401 : 500;
      return json(
        {
          error: code === 'EAUTH' ? 'SMTP Authentication failed' : 'Failed to send email via SMTP',
          message,
        },
        status
      );
    } finally {
      transporter.close();
    }
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Internal server error';
    console.error('Error in send-email function:', message);
    return json({ error: message }, 500);
  }
});
