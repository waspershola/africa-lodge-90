-- Fix security questions for platform owners to have proper answer hashes
-- These are demo answers: hotel123, london, manager, paris, john smith (base64 encoded)
UPDATE users SET security_questions = '[
  {"question": "What was the name of your first hotel?", "answer_hash": "aG90ZWwxMjM="},
  {"question": "What city were you born in?", "answer_hash": "bG9uZG9u"},
  {"question": "What was your first job title?", "answer_hash": "bWFuYWdlcg=="},
  {"question": "What is your favorite travel destination?", "answer_hash": "cGFyaXM="},
  {"question": "What was the name of your first business mentor?", "answer_hash": "am9obiBzbWl0aA=="}
]'::jsonb WHERE email = 'wasperstore@gmail.com';

-- Add security questions to backup admin accounts
UPDATE users SET security_questions = '[
  {"question": "What was the name of your first hotel?", "answer_hash": "YWRtaW4xMjM="},
  {"question": "What city were you born in?", "answer_hash": "bmV3eW9yaw=="},
  {"question": "What was your first job title?", "answer_hash": "YWRtaW5pc3RyYXRvcg=="}
]'::jsonb WHERE email = 'backup-admin1@luxuryhotelpro.com';

UPDATE users SET 
  security_questions = '[
    {"question": "What was the name of your first hotel?", "answer_hash": "YWRtaW4yNTY="},
    {"question": "What city were you born in?", "answer_hash": "Ym9zdG9u"},
    {"question": "What was your first job title?", "answer_hash": "c3VwZXJ2aXNvcg=="}
  ]'::jsonb,
  is_active = true
WHERE email = 'backup-admin2@luxuryhotelpro.com';