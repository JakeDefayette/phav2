-- Seed script for survey_question_definitions table
-- This populates the database with the actual questions used in the multi-step survey

BEGIN;

-- Clear existing survey questions (for development/testing)
DELETE FROM survey_question_definitions WHERE category IN ('demographics', 'lifestyle', 'symptoms', 'contact');

-- Demographics Questions (Step 1)
INSERT INTO survey_question_definitions (id, question_text, question_type, options, order_index, is_required, category, created_at, updated_at) VALUES
  ('550e8400-e29b-41d4-a716-446655440001', 'Child First Name', 'text', null, 1, true, 'demographics', now(), now()),
  ('550e8400-e29b-41d4-a716-446655440002', 'Child Last Name', 'text', null, 2, true, 'demographics', now(), now()),
  ('550e8400-e29b-41d4-a716-446655440003', 'Child Age', 'select', '["Under 1", "1", "2", "3", "4", "5", "6", "7", "8", "9", "10", "11", "12", "13", "14", "15", "16", "17", "18+"]', 3, true, 'demographics', now(), now()),
  ('550e8400-e29b-41d4-a716-446655440004', 'Child Gender', 'select', '["Male", "Female", "Other", "Prefer not to say"]', 4, true, 'demographics', now(), now());

-- Lifestyle Stressors Questions (Step 2)
INSERT INTO survey_question_definitions (id, question_text, question_type, options, order_index, is_required, category, created_at, updated_at) VALUES
  ('550e8400-e29b-41d4-a716-446655440011', 'Lifestyle Stressors', 'checkbox', '[
    "Birth trauma (C-section, forceps, vacuum, cord around neck)",
    "Falls or accidents (learning to walk, playground, sports)",
    "Poor posture from heavy backpacks or prolonged sitting",
    "Excessive screen time affecting posture and sleep",
    "Sleep disturbances or irregular sleep patterns",
    "Dietary challenges (picky eating, processed foods)",
    "High stress environment (family, school, social)",
    "Limited physical activity or exercise",
    "Developmental delays or milestones concerns",
    "Previous injuries or medical procedures"
  ]', 11, false, 'lifestyle', now(), now());

-- Symptoms Questions (Step 3)  
INSERT INTO survey_question_definitions (id, question_text, question_type, options, order_index, is_required, category, created_at, updated_at) VALUES
  ('550e8400-e29b-41d4-a716-446655440021', 'Current Symptoms', 'checkbox', '[
    "Frequent headaches or migraines",
    "Neck pain or stiffness",
    "Back pain or discomfort",
    "Poor posture (slouching, forward head)",
    "Difficulty concentrating or focus issues",
    "Hyperactivity or restlessness",
    "Sleep problems (trouble falling/staying asleep)",
    "Mood changes or irritability",
    "Digestive issues (constipation, stomach aches)",
    "Frequent ear infections",
    "Coordination or balance problems",
    "Growing pains in legs or arms",
    "Bedwetting (age-inappropriate)",
    "Sensory sensitivities (noise, touch, light)",
    "Speech or developmental delays"
  ]', 21, false, 'symptoms', now(), now());

-- Contact Information Questions (Step 4)
INSERT INTO survey_question_definitions (id, question_text, question_type, options, order_index, is_required, category, created_at, updated_at) VALUES
  ('550e8400-e29b-41d4-a716-446655440031', 'Parent First Name', 'text', null, 31, true, 'contact', now(), now()),
  ('550e8400-e29b-41d4-a716-446655440032', 'Parent Last Name', 'text', null, 32, true, 'contact', now(), now()),
  ('550e8400-e29b-41d4-a716-446655440033', 'Email Address', 'email', null, 33, true, 'contact', now(), now()),
  ('550e8400-e29b-41d4-a716-446655440034', 'Phone Number', 'tel', null, 34, false, 'contact', now(), now());

COMMIT;

-- Verify the inserted questions
SELECT 
  category,
  COUNT(*) as question_count,
  string_agg(question_text, ', ' ORDER BY order_index) as questions
FROM survey_question_definitions 
WHERE category IN ('demographics', 'lifestyle', 'symptoms', 'contact')
GROUP BY category 
ORDER BY category; 