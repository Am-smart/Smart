// Supabase Edge Function: notify
import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient } from "https://esm.sh/@supabase/supabase-js@2"

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    const supabaseUrl = Deno.env.get('SUPABASE_URL');
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY');

    if (!supabaseUrl || !supabaseServiceKey) {
      throw new Error('Missing environment variables: SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY');
    }

    const supabaseClient = createClient(supabaseUrl, supabaseServiceKey);

    // Verify Session: Only allow authenticated admins to trigger broadcasts
    const sessionId = req.headers.get('x-session-id');
    if (!sessionId) {
      return new Response(JSON.stringify({ error: 'Missing Session ID' }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 401,
      });
    }

    // Verify session in database
    const { data: session, error: sessionError } = await supabaseClient
      .from('sessions')
      .select('user_id, users(role)')
      .eq('id', sessionId)
      .gt('expires_at', new Date().toISOString())
      .single();

    if (sessionError || !session || (session.users as any).role !== 'admin') {
        return new Response(JSON.stringify({ error: 'Unauthorized: Admin privileges required' }), {
            headers: { ...corsHeaders, 'Content-Type': 'application/json' },
            status: 403,
        });
    }

    const { type, payload } = await req.json();

    if (!type) {
      return new Response(JSON.stringify({ error: 'Missing request type' }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 400,
      });
    }

    if (type === 'broadcast') {
      // Manual broadcast from Admin
      const { role, title, message, link } = payload;

      if (!title || !message) {
        return new Response(JSON.stringify({ error: 'Title and message are required for broadcast' }), {
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
          status: 400,
        });
      }

      let query = supabaseClient.from('users').select('id, notification_preferences');
      if (role && role !== 'all') {
        query = query.eq('role', role);
      }

      const { data: users, error: userError } = await query;

      if (userError) throw userError;

      let successCount = 0;
      if (users) {
        // Filter users based on their notification preferences
        const filteredUsers = users.filter(user => {
            const prefs = user.notification_preferences || { email: true, push: true, inApp: true };
            return prefs.inApp; // Only broadcast if in-app is enabled
        });

        // Send notifications in parallel for better performance
        const notifications = filteredUsers.map(user =>
          supabaseClient.rpc('notify_user', {
            target_id: user.id,
            n_title: title,
            n_msg: message,
            n_link: link || null
          })
        );

        const results = await Promise.all(notifications);
        successCount = results.filter(r => !r.error).length;
      }

      return new Response(JSON.stringify({
        success: true,
        count: successCount,
        total: users?.length || 0
      }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 200,
      });
    }

    return new Response(JSON.stringify({ error: `Unsupported notification type: ${type}` }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      status: 400,
    });

  } catch (error) {
    console.error('Edge Function Error:', error.message);
    return new Response(JSON.stringify({ error: error.message }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      status: 500,
    });
  }
})
