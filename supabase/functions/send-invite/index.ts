// @ts-nocheck
import { serve } from 'https://deno.land/std@0.168.0/http/server.ts';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  try {
    const { email, tripName, inviterName } = await req.json();

    if (!email) {
      return new Response(JSON.stringify({ error: 'missing_params' }), {
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    const resendApiKey = Deno.env.get('RESEND_API_KEY');

    if (!resendApiKey) {
      return new Response(JSON.stringify({ error: 'resend_not_configured' }), {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    const html = `
      <div style="font-family:sans-serif;max-width:480px;margin:0 auto;padding:32px 24px;">
        <h2 style="color:#FF6B6B;margin-bottom:8px;">You're invited to Triply!</h2>
        <p style="font-size:16px;color:#1A1614;margin-bottom:16px;">
          <strong>${inviterName}</strong> is planning <strong>${tripName}</strong> on Triply and wants you to join.
        </p>
        <p style="font-size:15px;color:#1A1614;margin-bottom:24px;">
          Download Triply and sign up or log in with <strong>this email address</strong>.
          Your trip invite will be waiting for you on your home screen.
        </p>
        <p style="font-size:13px;color:#9E9590;margin-top:24px;">
          Get the app from the App Store or Google Play, then use ${email} to sign in.
        </p>
      </div>
    `;

    const res = await fetch('https://api.resend.com/emails', {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${resendApiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        from: 'noreply@triplyapp.com',
        to: email,
        subject: `${inviterName} invited you to ${tripName} on Triply`,
        html,
      }),
    });

    if (!res.ok) {
      const err = await res.json();
      console.error('[send-invite] Resend error:', err);
      return new Response(JSON.stringify({ error: 'email_failed' }), {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    return new Response(JSON.stringify({ success: true }), {
      status: 200,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  } catch (err) {
    console.error('[send-invite] Unexpected error:', err);
    return new Response(JSON.stringify({ error: 'internal_error' }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});
