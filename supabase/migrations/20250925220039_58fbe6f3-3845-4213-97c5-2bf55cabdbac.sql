-- Update security questions for approved system owners with correct answers
UPDATE public.users 
SET security_questions = jsonb_build_array(
  jsonb_build_object(
    'question', 'What is the name of your first hotel?',
    'answer_hash', encode(digest('hotel123', 'sha256'), 'hex')
  )
)
WHERE email = 'wasperstore@gmail.com' AND is_platform_owner = true;

UPDATE public.users 
SET security_questions = jsonb_build_array(
  jsonb_build_object(
    'question', 'Which city were you born',
    'answer_hash', encode(digest('ilorin', 'sha256'), 'hex')
  )
)
WHERE email = 'info@waspersolution.com' AND is_platform_owner = true;

UPDATE public.users 
SET security_questions = jsonb_build_array(
  jsonb_build_object(
    'question', 'Your favourite celebrity',
    'answer_hash', encode(digest('ibb', 'sha256'), 'hex')
  )
)
WHERE email = 'sholawasiu@gmail.com' AND is_platform_owner = true;