import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface VerificationRequest {
  step: 'email_verification' | 'master_key' | 'security_question';
  email?: string;
  sessionToken?: string;
  masterKey?: string;
  securityAnswer?: string;
  userAgent?: string;
}

const handler = async (req: Request): Promise<Response> => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseClient = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    );

    const { step, email, sessionToken, masterKey, securityAnswer, userAgent }: VerificationRequest = await req.json();
    
    // Get client IP address - handle multiple IPs from proxy headers
    const rawIP = req.headers.get('x-forwarded-for') || req.headers.get('x-real-ip') || 'unknown';
    const clientIP = rawIP.split(',')[0].trim(); // Take first IP if multiple
    
    console.log(`Emergency access attempt: ${step} from IP: ${clientIP}`);

    switch (step) {
      case 'email_verification':
        return await handleEmailVerification(supabaseClient, email!, clientIP, userAgent);
      
      case 'master_key':
        return await handleMasterKeyVerification(supabaseClient, sessionToken!, masterKey!, clientIP, userAgent);
      
      case 'security_question':
        return await handleSecurityQuestionVerification(supabaseClient, sessionToken!, securityAnswer!, clientIP, userAgent);
      
      default:
        throw new Error('Invalid verification step');
    }

  } catch (error: any) {
    console.error('Emergency access verification error:', error);
    return new Response(
      JSON.stringify({ success: false, error: error.message }),
      {
        status: 500,
        headers: { 'Content-Type': 'application/json', ...corsHeaders },
      }
    );
  }
};

async function handleEmailVerification(
  supabaseClient: any, 
  email: string, 
  clientIP: string, 
  userAgent?: string
) {
  try {
    console.log(`Starting email verification for: ${email}`);
    
    // Check if email is a platform owner
    const { data: user, error: userError } = await supabaseClient
      .from('users')
      .select('id, email, security_questions, is_platform_owner, is_active')
      .eq('email', email.trim())
      .eq('is_platform_owner', true)
      .eq('is_active', true)
      .single();

    console.log('User query result:', { user, userError });

    if (userError || !user) {
      console.log('User not found or error:', userError);
      // Log failed attempt
      await logEmergencyAccess(supabaseClient, null, 'email', false, 'Invalid platform owner email', clientIP, userAgent);
      
      return new Response(
        JSON.stringify({ 
          success: false, 
          error: 'Invalid platform owner email or account not found' 
        }),
        {
          status: 400,
          headers: { 'Content-Type': 'application/json', ...corsHeaders },
        }
      );
    }

    console.log('User found, creating recovery session...');

    // Create recovery session
    const sessionToken = crypto.randomUUID();
    const expiresAt = new Date(Date.now() + 60 * 60 * 1000); // 1 hour

    const { error: sessionError } = await supabaseClient
      .from('recovery_sessions')
      .insert({
        user_id: user.id,
        session_token: sessionToken,
        steps_completed: ['email_verification'],
        required_steps: ['email_verification', 'master_key', 'security_question'],
        expires_at: expiresAt.toISOString(),
        ip_address: clientIP,
        user_agent: userAgent
      });

    if (sessionError) {
      console.error('Session creation error:', sessionError);
      throw sessionError;
    }

    console.log('Recovery session created, processing security questions...');

    // Get random security question
    const questions = user.security_questions || [];
    console.log('Security questions:', questions);
    
    // Filter out questions with null or missing answer_hash
    const validQuestions = questions.filter((q: any) => q && q.question && q.answer_hash);
    console.log('Valid questions:', validQuestions);
    
    if (validQuestions.length === 0) {
      console.log('No valid security questions found');
      return new Response(
        JSON.stringify({ 
          success: false, 
          error: 'No valid security questions configured for this account. Please contact system administrator.' 
        }),
        {
          status: 400,
          headers: { 'Content-Type': 'application/json', ...corsHeaders },
        }
      );
    }
    
    const randomQuestion = validQuestions[Math.floor(Math.random() * validQuestions.length)];
    console.log('Selected random question:', randomQuestion);

    // Log successful email verification
    await logEmergencyAccess(supabaseClient, user.id, 'email', true, 'Email verified successfully', clientIP, userAgent);

    console.log('Email verification successful, returning response');

    return new Response(
      JSON.stringify({
        success: true,
        session: {
          sessionToken,
          stepsCompleted: ['email_verification'],
          requiredSteps: ['email_verification', 'master_key', 'security_question'],
          expiresAt: expiresAt.toISOString()
        },
        securityQuestion: randomQuestion.question
      }),
      {
        status: 200,
        headers: { 'Content-Type': 'application/json', ...corsHeaders },
      }
    );
  } catch (error: any) {
    console.error('Error in handleEmailVerification:', error);
    throw error;
  }
}

async function handleMasterKeyVerification(
  supabaseClient: any, 
  sessionToken: string, 
  masterKey: string, 
  clientIP: string, 
  userAgent?: string
) {
  // Get recovery session
  const { data: session, error: sessionError } = await supabaseClient
    .from('recovery_sessions')
    .select('*')
    .eq('session_token', sessionToken)
    .gt('expires_at', new Date().toISOString())
    .eq('completed', false)
    .single();

  if (sessionError || !session) {
    return new Response(
      JSON.stringify({ success: false, error: 'Invalid or expired session' }),
      {
        status: 400,
        headers: { 'Content-Type': 'application/json', ...corsHeaders },
      }
    );
  }

  // Verify master key from environment
  const storedKeyHash = Deno.env.get('MASTER_RECOVERY_KEY_HASH');
  if (!storedKeyHash) {
    await logEmergencyAccess(supabaseClient, session.user_id, 'master_key', false, 'Master key not configured', clientIP, userAgent);
    
    return new Response(
      JSON.stringify({ success: false, error: 'Master recovery key not configured' }),
      {
        status: 500,
        headers: { 'Content-Type': 'application/json', ...corsHeaders },
      }
    );
  }

  // Simple comparison for demo - in production, use proper hashing
  if (masterKey.trim() !== storedKeyHash) {
    await logEmergencyAccess(supabaseClient, session.user_id, 'master_key', false, 'Invalid master key', clientIP, userAgent);
    
    return new Response(
      JSON.stringify({ success: false, error: 'Invalid master recovery key' }),
      {
        status: 400,
        headers: { 'Content-Type': 'application/json', ...corsHeaders },
      }
    );
  }

  // Update session with completed step
  const stepsCompleted = [...session.steps_completed, 'master_key'];
  
  const { error: updateError } = await supabaseClient
    .from('recovery_sessions')
    .update({ steps_completed: stepsCompleted })
    .eq('session_token', sessionToken);

  if (updateError) {
    throw updateError;
  }

  await logEmergencyAccess(supabaseClient, session.user_id, 'master_key', true, 'Master key verified successfully', clientIP, userAgent);

  return new Response(
    JSON.stringify({
      success: true,
      session: {
        sessionToken,
        stepsCompleted,
        requiredSteps: session.required_steps,
        expiresAt: session.expires_at
      }
    }),
    {
      status: 200,
      headers: { 'Content-Type': 'application/json', ...corsHeaders },
    }
  );
}

async function handleSecurityQuestionVerification(
  supabaseClient: any, 
  sessionToken: string, 
  securityAnswer: string, 
  clientIP: string, 
  userAgent?: string
) {
  // Get recovery session with user info
  const { data: session, error: sessionError } = await supabaseClient
    .from('recovery_sessions')
    .select(`
      *,
      users!inner(id, security_questions)
    `)
    .eq('session_token', sessionToken)
    .gt('expires_at', new Date().toISOString())
    .eq('completed', false)
    .single();

  if (sessionError || !session) {
    return new Response(
      JSON.stringify({ success: false, error: 'Invalid or expired session' }),
      {
        status: 400,
        headers: { 'Content-Type': 'application/json', ...corsHeaders },
      }
    );
  }

  // Validate security answer using database function
  const { data: isValid, error: validationError } = await supabaseClient
    .rpc('validate_security_answer', {
      user_uuid: session.user_id,
      question_text: session.users.security_questions[0]?.question,
      answer_text: securityAnswer.trim()
    });

  if (validationError || !isValid) {
    await logEmergencyAccess(supabaseClient, session.user_id, 'security_question', false, 'Invalid security answer', clientIP, userAgent);
    
    return new Response(
      JSON.stringify({ success: false, error: 'Invalid security answer' }),
      {
        status: 400,
        headers: { 'Content-Type': 'application/json', ...corsHeaders },
      }
    );
  }

  // Update session with completed step
  const stepsCompleted = [...session.steps_completed, 'security_question'];
  
  const { error: updateError } = await supabaseClient
    .from('recovery_sessions')
    .update({ 
      steps_completed: stepsCompleted,
      completed: true // All steps completed
    })
    .eq('session_token', sessionToken);

  if (updateError) {
    throw updateError;
  }

  await logEmergencyAccess(supabaseClient, session.user_id, 'security_question', true, 'Security question verified successfully', clientIP, userAgent);

  return new Response(
    JSON.stringify({
      success: true,
      session: {
        sessionToken,
        stepsCompleted,
        requiredSteps: session.required_steps,
        expiresAt: session.expires_at
      }
    }),
    {
      status: 200,
      headers: { 'Content-Type': 'application/json', ...corsHeaders },
    }
  );
}

async function logEmergencyAccess(
  supabaseClient: any,
  userId: string | null,
  attemptType: string,
  success: boolean,
  failureReason: string | null,
  ipAddress: string,
  userAgent?: string
) {
  try {
    await supabaseClient
      .from('emergency_access_attempts')
      .insert({
        user_id: userId,
        attempt_type: attemptType,
        success,
        failure_reason: success ? null : failureReason,
        ip_address: ipAddress,
        user_agent: userAgent,
        device_fingerprint: {
          timestamp: new Date().toISOString(),
          ip: ipAddress
        }
      });
  } catch (error) {
    console.error('Failed to log emergency access attempt:', error);
  }
}

serve(handler);