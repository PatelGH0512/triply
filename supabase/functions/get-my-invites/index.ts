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
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const anonKey = Deno.env.get('SUPABASE_ANON_KEY')!;
    const serviceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;

    const authHeader = req.headers.get('Authorization') ?? '';

    // Identify the caller from their JWT.
    const userClient = createClient(supabaseUrl, anonKey, {
      global: { headers: { Authorization: authHeader } },
    });
    const {
      data: { user },
    } = await userClient.auth.getUser();

    const email = user?.email?.trim().toLowerCase();
    if (!email) {
      return new Response(JSON.stringify({ invites: [] }), {
        status: 200,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    // Read invite + trip details with service role (bypasses is_trip_member RLS).
    const admin = createClient(supabaseUrl, serviceKey);
    const { data, error } = await admin
      .from('trip_invites')
      .select(`
        *,
        trip:trips(
          *,
          trip_destinations(*),
          trip_members(*, users(id, full_name, avatar_url))
        ),
        inviter:users!trip_invites_invited_by_fkey(id, full_name, avatar_url)
      `)
      .eq('invited_email', email)
      .eq('status', 'pending')
      .order('created_at', { ascending: false });

    if (error) {
      console.error('[get-my-invites] query error:', error);
      return new Response(JSON.stringify({ invites: [] }), {
        status: 200,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    return new Response(JSON.stringify({ invites: data ?? [] }), {
      status: 200,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  } catch (err) {
    console.error('[get-my-invites] Unexpected error:', err);
    return new Response(JSON.stringify({ invites: [] }), {
      status: 200,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});
