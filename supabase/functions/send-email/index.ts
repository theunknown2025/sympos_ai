// Supabase Edge Function to send emails
// This function uses Hostinger SMTP to send emails securely from the server

import { serve } from 'https://deno.land/std@0.168.0/http/server.ts';
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

// SMTP Configuration (Hostinger)
const SMTP_HOST = Deno.env.get('SMTP_HOST') || 'smtp.hostinger.com';
const SMTP_PORT = parseInt(Deno.env.get('SMTP_PORT') || '465');
const SMTP_USER = Deno.env.get('SMTP_USER') || 'admin@symos-ai.online';
const SMTP_PASSWORD = Deno.env.get('SMTP_PASSWORD');
const FROM_EMAIL = Deno.env.get('FROM_EMAIL') || SMTP_USER || 'admin@symos-ai.online';
const FROM_NAME = Deno.env.get('FROM_NAME') || 'Sympos-ia Committee';

interface EmailRequest {
  to: string;
  subject: string;
  html: string;
  recipientName?: string;
}

serve(async (req) => {
  // Handle CORS
  if (req.method === 'OPTIONS') {
    return new Response('ok', {
      headers: {
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Methods': 'POST',
        'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
      },
    });
  }

  try {
    // Verify the request is authenticated (optional but recommended)
    const authHeader = req.headers.get('Authorization');
    if (!authHeader) {
      return new Response(
        JSON.stringify({ error: 'Missing authorization header' }),
        { status: 401, headers: { 'Content-Type': 'application/json' } }
      );
    }

    // Get Supabase client with proper environment variables
    // Edge Functions automatically have access to SUPABASE_URL and SUPABASE_ANON_KEY
    const supabaseUrl = Deno.env.get('SUPABASE_URL');
    const supabaseAnonKey = Deno.env.get('SUPABASE_ANON_KEY');
    
    if (!supabaseUrl || !supabaseAnonKey) {
      console.error('Missing Supabase environment variables:', {
        hasUrl: !!supabaseUrl,
        hasKey: !!supabaseAnonKey
      });
      return new Response(
        JSON.stringify({ error: 'Server configuration error' }),
        { status: 500, headers: { 'Content-Type': 'application/json' } }
      );
    }

    const supabaseClient = createClient(supabaseUrl, supabaseAnonKey, {
      global: {
        headers: { Authorization: authHeader },
      },
    });

    // Verify user is authenticated
    // Log auth header for debugging (first 20 chars only)
    const authHeaderPrefix = authHeader.substring(0, 20) + '...';
    console.log('Received auth header:', authHeaderPrefix);
    
    const {
      data: { user },
      error: userError,
    } = await supabaseClient.auth.getUser();

    if (userError) {
      console.error('Auth error:', userError);
      console.error('Auth error details:', {
        message: userError.message,
        status: userError.status,
        name: userError.name
      });
      
      // Check if it's a JWT error
      const errorMessage = userError.message || 'Authentication failed';
      const isJWTError = errorMessage.includes('JWT') || errorMessage.includes('token') || errorMessage.includes('expired');
      
      return new Response(
        JSON.stringify({ 
          error: 'Unauthorized',
          message: isJWTError ? 'Invalid JWT' : errorMessage
        }),
        { 
          status: 401, 
          headers: { 
            'Content-Type': 'application/json',
            'Access-Control-Allow-Origin': '*',
          } 
        }
      );
    }

    if (!user) {
      console.error('No user found after authentication');
      return new Response(
        JSON.stringify({ error: 'Unauthorized', message: 'User not found' }),
        { 
          status: 401, 
          headers: { 
            'Content-Type': 'application/json',
            'Access-Control-Allow-Origin': '*',
          } 
        }
      );
    }
    
    console.log('User authenticated:', user.id);

    // Parse request body
    const emailData: EmailRequest = await req.json();

    if (!emailData.to || !emailData.subject || !emailData.html) {
      return new Response(
      JSON.stringify({ error: 'Missing required fields: to, subject, html' }),
      { status: 400, headers: { 'Content-Type': 'application/json' } }
    );
    }

    // Validate SMTP configuration
    if (!SMTP_USER || !SMTP_PASSWORD) {
      console.error('SMTP credentials not configured');
      return new Response(
        JSON.stringify({ error: 'Email service not configured. Please set SMTP_USER and SMTP_PASSWORD secrets.' }),
        { status: 500, headers: { 'Content-Type': 'application/json' } }
      );
    }

    // Send email using SMTP
    try {
      const emailResult = await sendEmailViaSMTP({
        to: emailData.to,
        subject: emailData.subject,
        html: emailData.html,
        from: FROM_EMAIL,
        fromName: FROM_NAME,
      });

      return new Response(
        JSON.stringify({ 
          success: true, 
          messageId: emailResult.messageId,
          to: emailData.to 
        }),
        {
          status: 200,
          headers: {
            'Content-Type': 'application/json',
            'Access-Control-Allow-Origin': '*',
          },
        }
      );
    } catch (smtpError: any) {
      console.error('SMTP error:', smtpError);
      
      return new Response(
        JSON.stringify({ 
          error: 'Failed to send email via SMTP',
          message: smtpError.message || 'Unknown SMTP error',
          details: smtpError.toString()
        }),
        { 
          status: 500, 
          headers: { 
            'Content-Type': 'application/json',
            'Access-Control-Allow-Origin': '*',
          } 
        }
      );
    }
  } catch (error) {
    console.error('Error in send-email function:', error);
    return new Response(
      JSON.stringify({ error: error.message || 'Internal server error' }),
      { status: 500, headers: { 'Content-Type': 'application/json' } }
    );
  }
});

// SMTP Email Sending Function using Deno's native TLS
async function sendEmailViaSMTP(options: {
  to: string;
  subject: string;
  html: string;
  from: string;
  fromName: string;
}): Promise<{ messageId: string }> {
  const encoder = new TextEncoder();
  const decoder = new TextDecoder();
  
  // Connect to SMTP server with TLS
  const conn = await Deno.connectTls({
    hostname: SMTP_HOST,
    port: SMTP_PORT,
  });

  try {
    // Helper to read response
    const readResponse = async (): Promise<string> => {
      const buffer = new Uint8Array(4096);
      const bytesRead = await conn.read(buffer);
      if (bytesRead === null) throw new Error('Connection closed unexpectedly');
      return decoder.decode(buffer.subarray(0, bytesRead));
    };

    // Helper to send command and read response
    const sendCommand = async (command: string): Promise<string> => {
      await conn.write(encoder.encode(command + '\r\n'));
      return await readResponse();
    };

    // Read initial greeting
    const greeting = await readResponse();
    console.log('SMTP greeting:', greeting);

    // Send EHLO
    const ehloResponse = await sendCommand(`EHLO ${SMTP_HOST}`);
    console.log('EHLO response:', ehloResponse);

    // AUTH LOGIN
    const authResponse = await sendCommand('AUTH LOGIN');
    console.log('AUTH response:', authResponse);
    
    // Send username (base64)
    const usernameB64 = btoa(SMTP_USER);
    const userResponse = await sendCommand(usernameB64);
    console.log('Username response:', userResponse);
    
    // Send password (base64)
    const passwordB64 = btoa(SMTP_PASSWORD);
    const passResponse = await sendCommand(passwordB64);
    console.log('Password response:', passResponse);

    // Check if authentication was successful (should start with 235)
    if (!passResponse.startsWith('235')) {
      throw new Error(`SMTP authentication failed: ${passResponse}`);
    }

    // MAIL FROM
    const mailFromResponse = await sendCommand(`MAIL FROM:<${options.from}>`);
    if (!mailFromResponse.startsWith('250')) {
      throw new Error(`MAIL FROM failed: ${mailFromResponse}`);
    }

    // RCPT TO
    const rcptToResponse = await sendCommand(`RCPT TO:<${options.to}>`);
    if (!rcptToResponse.startsWith('250')) {
      throw new Error(`RCPT TO failed: ${rcptToResponse}`);
    }

    // DATA
    const dataResponse = await sendCommand('DATA');
    if (!dataResponse.startsWith('354')) {
      throw new Error(`DATA command failed: ${dataResponse}`);
    }

    // Email content
    const messageId = `<${Date.now()}-${Math.random().toString(36)}@${SMTP_HOST}>`;
    const emailContent = [
      `Message-ID: ${messageId}`,
      `From: ${options.fromName} <${options.from}>`,
      `To: ${options.to}`,
      `Subject: ${options.subject}`,
      `Date: ${new Date().toUTCString()}`,
      'MIME-Version: 1.0',
      'Content-Type: text/html; charset=UTF-8',
      'Content-Transfer-Encoding: 8bit',
      '',
      options.html,
      '.'
    ].join('\r\n');

    const dataSentResponse = await sendCommand(emailContent);
    if (!dataSentResponse.startsWith('250')) {
      throw new Error(`Email sending failed: ${dataSentResponse}`);
    }

    // QUIT
    await sendCommand('QUIT');

    return { messageId };
  } finally {
    conn.close();
  }
}

