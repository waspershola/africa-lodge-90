import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.57.4';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

interface CreateUserRequest {
  email: string
  password: string
  name: string
  role: 'SUPER_ADMIN' | 'OWNER' | 'MANAGER' | 'FRONT_DESK' | 'HOUSEKEEPING' | 'MAINTENANCE' | 'POS'
  tenant_id?: string
}

Deno.serve(async (req) => {
  console.log('Create user function called')

  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders })
  }

  try {
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!

    // Create admin client for user creation
    const supabaseAdmin = createClient(supabaseUrl, supabaseServiceKey, {
      auth: {
        autoRefreshToken: false,
        persistSession: false
      }
    })

    const { email, password, name, role, tenant_id }: CreateUserRequest = await req.json()

    console.log(`Creating user: ${email} with role: ${role}`)

    // Validate required fields
    if (!email || !password || !name || !role) {
      console.error('Missing required fields')
      return new Response(
        JSON.stringify({ error: 'Missing required fields: email, password, name, role' }),
        { 
          status: 400, 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
        }
      )
    }

    // Validate tenant_id for non-SUPER_ADMIN roles
    if (role !== 'SUPER_ADMIN' && !tenant_id) {
      console.error('Non-SUPER_ADMIN users require tenant_id')
      return new Response(
        JSON.stringify({ error: 'Non-SUPER_ADMIN users require tenant_id' }),
        { 
          status: 400, 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
        }
      )
    }

    // SUPER_ADMIN users should not have tenant_id
    if (role === 'SUPER_ADMIN' && tenant_id) {
      console.error('SUPER_ADMIN users should not have tenant_id')
      return new Response(
        JSON.stringify({ error: 'SUPER_ADMIN users should not have tenant_id' }),
        { 
          status: 400, 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
        }
      )
    }

    // Create user in Supabase Auth with metadata
    const { data: authUser, error: authError } = await supabaseAdmin.auth.admin.createUser({
      email,
      password,
      user_metadata: {
        name,
        role,
        tenant_id: role === 'SUPER_ADMIN' ? null : tenant_id
      },
      email_confirm: true // Auto-confirm email
    })

    if (authError) {
      console.error('Auth creation error:', authError)
      return new Response(
        JSON.stringify({ error: `Failed to create auth user: ${authError.message}` }),
        { 
          status: 400, 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
        }
      )
    }

    console.log('Auth user created:', authUser.user?.id)

    // The trigger function should automatically create the user record
    // Let's verify it was created correctly and update the name if needed
    const { data: userData, error: userError } = await supabaseAdmin
      .from('users')
      .select('*')
      .eq('id', authUser.user!.id)
      .single()

    if (userError) {
      console.error('User verification error:', userError)
      // If user record wasn't created by trigger, create it manually
      const { data: manualUser, error: manualError } = await supabaseAdmin
        .from('users')
        .insert({
          id: authUser.user!.id,
          email,
          name,
          role,
          tenant_id: role === 'SUPER_ADMIN' ? null : tenant_id,
          is_active: true
        })
        .select()
        .single()

      if (manualError) {
        console.error('Manual user creation error:', manualError)
        return new Response(
          JSON.stringify({ error: `Failed to create user record: ${manualError.message}` }),
          { 
            status: 500, 
            headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
          }
        )
      }

      console.log('User record created manually:', manualUser)
      return new Response(
        JSON.stringify({ 
          success: true, 
          user: manualUser,
          message: 'User created successfully' 
        }),
        { 
          status: 201, 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
        }
      )
    }

    // Update the name if it's missing from the trigger
    if (!userData.name && name) {
      console.log('Updating user name:', name)
      const { data: updatedUser, error: updateError } = await supabaseAdmin
        .from('users')
        .update({ name })
        .eq('id', authUser.user!.id)
        .select()
        .single()

      if (updateError) {
        console.error('Name update error:', updateError)
      } else {
        console.log('User name updated:', updatedUser)
        return new Response(
          JSON.stringify({ 
            success: true, 
            user: updatedUser,
            message: 'User created successfully' 
          }),
          { 
            status: 201, 
            headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
          }
        )
      }
    }

    console.log('User record verified:', userData)
    return new Response(
      JSON.stringify({ 
        success: true, 
        user: userData,
        message: 'User created successfully' 
      }),
      { 
        status: 201, 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
      }
    )

  } catch (error) {
    console.error('Unexpected error:', error)
    return new Response(
      JSON.stringify({ error: 'Internal server error' }),
      { 
        status: 500, 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
      }
    )
  }
})