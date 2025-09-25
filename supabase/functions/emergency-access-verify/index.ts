import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.7.1'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

interface VerificationRequest {
  step: 'email_verification' | 'master_key' | 'security_question';
  email?: string;
  sessionToken?: string;
  masterKey?: string;
  securityAnswer?: string;
  userAgent?: string;
}

// System-wide master recovery key
const MASTER_RECOVERY_KEY = '#nDjjioYn[/TUy:*},8/7YknU#E{E+';

// Approved system owners with their security questions
const SYSTEM_OWNERS = {
  'wasperstore@gmail.com': {
    securityQuestion: 'What is the name of your first hotel?',
    securityAnswer: 'hotel123'
  },
  'info@waspersolution.com': {
    securityQuestion: 'Which city were you born',
    securityAnswer: 'ilorin'
  },
  'sholawasiu@gmail.com': {
    securityQuestion: 'Your favourite celebrity',
    securityAnswer: 'ibb'
  }
};

Deno.serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    console.log('Emergency access verification function started');

    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    const { step, email, sessionToken, masterKey, securityAnswer, userAgent }: VerificationRequest = await req.json();

    // Log the access attempt
    const logAttempt = async (success: boolean, reason?: string) => {
      try {
        await supabase.from('emergency_access_attempts').insert({
          user_id: email ? (await supabase.from('users').select('id').eq('email', email).single()).data?.id : null,
          attempt_type: step,
          success,
          failure_reason: reason,
          ip_address: req.headers.get('x-forwarded-for') || 'unknown',
          user_agent: userAgent
        });
      } catch (logError) {
        console.error('Failed to log attempt:', logError);
      }
    };

    switch (step) {
      case 'email_verification': {
        console.log('Processing email verification for:', email);
        
        if (!email) {
          await logAttempt(false, 'No email provided');
          return new Response(
            JSON.stringify({ success: false, error: 'Email is required' }),
            { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
          );
        }

        // Check if email is an approved system owner
        if (!SYSTEM_OWNERS[email as keyof typeof SYSTEM_OWNERS]) {
          await logAttempt(false, 'Email not authorized for emergency access');
          return new Response(
            JSON.stringify({ success: false, error: 'Email not authorized for emergency access' }),
            { status: 403, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
          );
        }

        // Verify user exists in database
        const { data: user, error: userError } = await supabase
          .from('users')
          .select('id, email, is_platform_owner')
          .eq('email', email)
          .single();

        if (userError || !user || !user.is_platform_owner) {
          await logAttempt(false, 'User not found or not platform owner');
          return new Response(
            JSON.stringify({ success: false, error: 'User not found or not authorized' }),
            { status: 404, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
          );
        }

        // Create recovery session
        const sessionToken = crypto.randomUUID();
        const expiresAt = new Date(Date.now() + 30 * 60 * 1000); // 30 minutes

        const sessionData = {
          sessionToken,
          userId: user.id,
          email: user.email,
          stepsCompleted: ['email_verification'],
          requiredSteps: ['email_verification', 'master_key', 'security_question'],
          expiresAt: expiresAt.toISOString()
        };

        await logAttempt(true);

        return new Response(
          JSON.stringify({
            success: true,
            session: sessionData,
            securityQuestion: SYSTEM_OWNERS[email as keyof typeof SYSTEM_OWNERS].securityQuestion
          }),
          { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }

      case 'master_key': {
        console.log('Processing master key verification');
        
        if (!sessionToken || !masterKey) {
          await logAttempt(false, 'Missing session token or master key');
          return new Response(
            JSON.stringify({ success: false, error: 'Session token and master key are required' }),
            { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
          );
        }

        // Verify master key
        if (masterKey !== MASTER_RECOVERY_KEY) {
          await logAttempt(false, 'Invalid master key');
          return new Response(
            JSON.stringify({ success: false, error: 'Invalid master recovery key' }),
            { status: 403, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
          );
        }

        const updatedSession = {
          sessionToken,
          stepsCompleted: ['email_verification', 'master_key'],
          requiredSteps: ['email_verification', 'master_key', 'security_question'],
          expiresAt: new Date(Date.now() + 30 * 60 * 1000).toISOString()
        };

        await logAttempt(true);

        return new Response(
          JSON.stringify({ success: true, session: updatedSession }),
          { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }

      case 'security_question': {
        console.log('Processing security question verification');
        console.log('Provided answer:', securityAnswer);
        
        if (!sessionToken || !securityAnswer) {
          await logAttempt(false, 'Missing session token or security answer');
          return new Response(
            JSON.stringify({ success: false, error: 'Session token and security answer are required' }),
            { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
          );
        }

        // Simple comparison with expected answers (case insensitive)
        const providedAnswer = securityAnswer.toLowerCase().trim();
        const validAnswers = ['hotel123', 'ilorin', 'ibb'];
        const validAnswer = validAnswers.includes(providedAnswer);
        
        console.log('Valid answers:', validAnswers);
        console.log('Provided answer normalized:', providedAnswer);
        console.log('Is valid:', validAnswer);

        if (!validAnswer) {
          console.log('Security answer validation failed');
          await logAttempt(false, 'Invalid security answer');
          return new Response(
            JSON.stringify({ success: false, error: 'Invalid security answer' }),
            { status: 403, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
          );
        }

        console.log('Security answer validated successfully');

        const finalSession = {
          sessionToken,
          stepsCompleted: ['email_verification', 'master_key', 'security_question'],
          requiredSteps: ['email_verification', 'master_key', 'security_question'],
          expiresAt: new Date(Date.now() + 30 * 60 * 1000).toISOString()
        };

        await logAttempt(true);

        return new Response(
          JSON.stringify({ success: true, session: finalSession }),
          { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }

      default:
        return new Response(
          JSON.stringify({ success: false, error: 'Invalid verification step' }),
          { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
    }

  } catch (error) {
    console.error('Emergency access verification error:', error);
    console.error('Error stack:', (error as Error).stack);
    return new Response(
      JSON.stringify({ 
        success: false, 
        error: (error as Error).message || 'Emergency access verification failed',
        details: 'Check function logs for more information'
      }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});