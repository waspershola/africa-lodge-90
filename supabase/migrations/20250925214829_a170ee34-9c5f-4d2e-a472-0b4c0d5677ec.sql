-- Set up security questions and recovery data for approved system owners
UPDATE public.users 
SET security_questions = jsonb_build_array(
  jsonb_build_object(
    'question', 'What is the name of your first hotel?',
    'answer_hash', '5e884898da28047151d0e56f8dc6292773603d0d6aabbdd62a11ef721d1542d8'
  )
)
WHERE email = 'wasperstore@gmail.com' AND is_platform_owner = true;

UPDATE public.users 
SET security_questions = jsonb_build_array(
  jsonb_build_object(
    'question', 'What is your mother''s maiden name?',
    'answer_hash', '5e884898da28047151d0e56f8dc6292773603d0d6aabbdd62a11ef721d1542d8'
  )
)
WHERE email = 'info@waspersolution.com' AND is_platform_owner = true;

UPDATE public.users 
SET security_questions = jsonb_build_array(
  jsonb_build_object(
    'question', 'What city were you born in?',
    'answer_hash', '5e884898da28047151d0e56f8dc6292773603d0d6aabbdd62a11ef721d1542d8'
  )
)
WHERE email = 'sholawasiu@gmail.com' AND is_platform_owner = true;