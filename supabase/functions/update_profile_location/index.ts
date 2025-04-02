import { serve } from 'https://deno.land/std@0.208.0/http/server.ts';
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.39.3';

// Access to Deno namespace is available by default in Supabase Edge Functions

// Define request body type
interface LocationUpdateRequest {
  lat: number;
  lon: number;
}

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers':
    'authorization, x-client-info, apikey, content-type',
  'Access-Control-Allow-Methods': 'POST, OPTIONS'
};

serve(async (req: Request) => {
  // Handle CORS preflight OPTIONS request
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  try {
    // Create Supabase client with auth from request
    // Access environment variables using Deno.env.get
    const supabaseUrl = Deno.env.get('SUPABASE_URL');
    const supabaseAnonKey = Deno.env.get('SUPABASE_ANON_KEY');

    if (!supabaseUrl || !supabaseAnonKey) {
      return new Response(
        JSON.stringify({
          error: 'Configuration Error',
          message: 'Missing Supabase environment variables'
        }),
        {
          status: 500,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        }
      );
    }

    // Get the authorization header
    const authHeader = req.headers.get('Authorization');

    if (!authHeader) {
      return new Response(
        JSON.stringify({
          error: 'Unauthorized',
          message: 'Missing Authorization header'
        }),
        {
          status: 401,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        }
      );
    }

    // Create Supabase client with the auth header
    const supabaseClient = createClient(supabaseUrl, supabaseAnonKey, {
      global: {
        headers: { Authorization: authHeader }
      }
    });

    // Get the current user
    const {
      data: { user },
      error: userError
    } = await supabaseClient.auth.getUser();

    if (userError || !user) {
      return new Response(
        JSON.stringify({
          error: 'Unauthorized',
          message: 'User not authenticated',
          details: userError?.message || 'No user found'
        }),
        {
          status: 401,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        }
      );
    }

    // Parse request body
    const { lat, lon }: LocationUpdateRequest = await req.json();

    // Validate input
    if (typeof lat !== 'number' || typeof lon !== 'number') {
      return new Response(
        JSON.stringify({
          error: 'Bad Request',
          message: 'Invalid latitude or longitude'
        }),
        {
          status: 400,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        }
      );
    }

    // Call the RPC function to update the user's location
    // Note: The database function only takes lat and lon parameters, not profile_id
    const { data, error } = await supabaseClient.rpc(
      'update_profile_location',
      {
        lat,
        lon
      }
    );

    if (error) {
      return new Response(
        JSON.stringify({
          error: 'Database Error',
          message: error.message,
          details: error
        }),
        {
          status: 500,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        }
      );
    }

    // Return success response
    return new Response(JSON.stringify({ success: true, data }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    });
  } catch (error) {
    // Handle any unexpected errors
    return new Response(
      JSON.stringify({
        error: 'Server Error',
        message: (error as Error).message
      }),
      {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      }
    );
  }
});
