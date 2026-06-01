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
    const { token, userId } = await req.json();

    if (!token || !userId) {
      return new Response(JSON.stringify({ error: 'missing_params' }), {
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const serviceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const supabase = createClient(supabaseUrl, serviceKey);

    const { data: invite, error: inviteError } = await supabase
      .from('trip_invites')
      .select('*')
      .eq('token', token)
      .single();

    if (inviteError || !invite) {
      return new Response(JSON.stringify({ error: 'invalid_token' }), {
        status: 404,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    if (invite.expires_at && new Date(invite.expires_at) < new Date()) {
      await supabase.from('trip_invites').update({ status: 'expired' }).eq('id', invite.id);
      return new Response(JSON.stringify({ error: 'expired' }), {
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    if (invite.status === 'accepted') {
      return new Response(JSON.stringify({ error: 'already_accepted', tripId: invite.trip_id }), {
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    const { data: existing } = await supabase
      .from('trip_members')
      .select('id')
      .eq('trip_id', invite.trip_id)
      .eq('user_id', userId)
      .maybeSingle();

    if (existing) {
      return new Response(
        JSON.stringify({ error: 'already_member', tripId: invite.trip_id }),
        {
          status: 400,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        },
      );
    }

    const { error: memberError } = await supabase.from('trip_members').insert({
      trip_id: invite.trip_id,
      user_id: userId,
      role: 'member',
    });

    if (memberError) {
      console.error('[resolve-invite] member insert error:', memberError);
      return new Response(JSON.stringify({ error: 'join_failed' }), {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    await supabase.from('trip_invites').update({ status: 'accepted' }).eq('id', invite.id);

    const [{ data: newMember }, { data: trip }, { data: existingMembers }] = await Promise.all([
      supabase.from('users').select('full_name').eq('id', userId).single(),
      supabase.from('trips').select('name, admin_id').eq('id', invite.trip_id).single(),
      supabase
        .from('trip_members')
        .select('user_id')
        .eq('trip_id', invite.trip_id)
        .neq('user_id', userId),
    ]);

    if (existingMembers && existingMembers.length > 0 && trip && newMember) {
      const notifications = existingMembers.map((m: { user_id: string }) => ({
        user_id: m.user_id,
        trip_id: invite.trip_id,
        type: 'member_joined',
        title: 'New member joined',
        body: `${newMember.full_name} joined ${trip.name}`,
        read: false,
        data: {
          type: 'member_joined',
          tripId: invite.trip_id,
          actorName: newMember.full_name,
        },
      }));

      await supabase.from('notifications').insert(notifications);

      await supabase.functions.invoke('send-push-notification', {
        body: {
          userIds: existingMembers.map((m: { user_id: string }) => m.user_id),
          title: 'New member joined',
          body: `${newMember.full_name} joined ${trip.name}`,
          data: { type: 'member_joined', tripId: invite.trip_id },
        },
      });
    }

    return new Response(JSON.stringify({ success: true, tripId: invite.trip_id }), {
      status: 200,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  } catch (err) {
    console.error('[resolve-invite] Unexpected error:', err);
    return new Response(JSON.stringify({ error: 'internal_error' }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});
