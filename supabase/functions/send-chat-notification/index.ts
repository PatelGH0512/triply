// @ts-nocheck
import { serve } from 'https://deno.land/std@0.168.0/http/server.ts';
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  try {
    const payload = await req.json();

    const record = payload.record ?? payload.new;
    if (!record) {
      return new Response(JSON.stringify({ error: 'no record' }), {
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    const { trip_id, user_id, body, image_url } = record;

    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const serviceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const supabase = createClient(supabaseUrl, serviceKey);

    const [{ data: sender }, { data: trip }, { data: members }] = await Promise.all([
      supabase.from('users').select('full_name').eq('id', user_id).single(),
      supabase.from('trips').select('name').eq('id', trip_id).single(),
      supabase.from('trip_members').select('user_id').eq('trip_id', trip_id),
    ]);

    const senderName = sender?.full_name ?? 'Someone';
    const tripName = trip?.name ?? 'your trip';

    const recipientIds = (members ?? [])
      .map((m) => m.user_id)
      .filter((id) => id !== user_id);

    if (recipientIds.length === 0) {
      return new Response(JSON.stringify({ success: true, sent: 0 }), {
        status: 200,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    const { data: users } = await supabase
      .from('users')
      .select('push_token')
      .in('id', recipientIds)
      .not('push_token', 'is', null);

    const tokens = (users ?? [])
      .map((u) => u.push_token)
      .filter((t) => !!t);

    if (tokens.length === 0) {
      return new Response(JSON.stringify({ success: true, sent: 0 }), {
        status: 200,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    const messageBody = image_url
      ? '📷 Sent an image'
      : (body ?? '').slice(0, 60);

    const messages = tokens.map((token) => ({
      to: token,
      title: `${senderName} in ${tripName}`,
      body: messageBody,
      data: { type: 'message', tripId: trip_id },
      sound: 'default',
    }));

    const res = await fetch('https://exp.host/--/api/v2/push/send', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Accept: 'application/json',
        'Accept-Encoding': 'gzip, deflate',
      },
      body: JSON.stringify(messages),
    });

    const result = await res.json();

    return new Response(JSON.stringify({ success: true, sent: tokens.length, result }), {
      status: 200,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  } catch (err) {
    console.error('[send-chat-notification] error:', err);
    return new Response(JSON.stringify({ error: 'internal_error' }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});
