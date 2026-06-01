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
    const { token, contact, type, tripName, inviterName, expiresAt } = await req.json();

    if (!token || !contact || !type) {
      return new Response(JSON.stringify({ error: 'missing_params' }), {
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    const deepLink = `https://triplyapp.com/invite/${token}`;
    const message = `Your friend ${inviterName} is planning ${tripName} on Triply and wants you to join. Download the app and tap this link to join the trip. Invite expires in 48 hours: ${deepLink}`;

    if (type === 'sms') {
      const accountSid = Deno.env.get('TWILIO_ACCOUNT_SID');
      const authToken = Deno.env.get('TWILIO_AUTH_TOKEN');
      const fromNumber = Deno.env.get('TWILIO_PHONE_NUMBER');

      if (!accountSid || !authToken || !fromNumber) {
        return new Response(JSON.stringify({ error: 'twilio_not_configured' }), {
          status: 500,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        });
      }

      const res = await fetch(
        `https://api.twilio.com/2010-04-01/Accounts/${accountSid}/Messages.json`,
        {
          method: 'POST',
          headers: {
            Authorization: `Basic ${btoa(`${accountSid}:${authToken}`)}`,
            'Content-Type': 'application/x-www-form-urlencoded',
          },
          body: new URLSearchParams({ To: contact, From: fromNumber, Body: message }),
        },
      );

      if (!res.ok) {
        const err = await res.json();
        console.error('[send-invite] Twilio error:', err);
        return new Response(JSON.stringify({ error: 'sms_failed' }), {
          status: 500,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        });
      }
    } else if (type === 'email') {
      const resendApiKey = Deno.env.get('RESEND_API_KEY');

      if (!resendApiKey) {
        return new Response(JSON.stringify({ error: 'resend_not_configured' }), {
          status: 500,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        });
      }

      const html = `
        <div style="font-family:sans-serif;max-width:480px;margin:0 auto;padding:32px 24px;">
          <h2 style="color:#FF6B6B;margin-bottom:8px;">You're invited!</h2>
          <p style="font-size:16px;color:#1A1614;margin-bottom:24px;">
            <strong>${inviterName}</strong> is planning <strong>${tripName}</strong> on Triply and wants you to join.
          </p>
          <a href="${deepLink}"
             style="display:inline-block;background:#FF6B6B;color:#fff;font-weight:700;
                    font-size:16px;padding:14px 32px;border-radius:12px;text-decoration:none;">
            Join Trip
          </a>
          <p style="font-size:13px;color:#9E9590;margin-top:24px;">
            This invite expires in 48 hours. If you don't have the app yet,
            download Triply from the App Store or Google Play first.
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
          to: contact,
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
