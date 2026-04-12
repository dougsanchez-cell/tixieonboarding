-- Add no-bots comprehension question to Module 3
UPDATE content_modules SET comprehension_questions = '[
  {"q": "Which seats must you NEVER purchase under any circumstances?", "options": ["Lawn and GA seats", "Orchestra and Mezzanine seats", "WC (Wheelchair) and ADA seats", "Pavilion and Club seats"], "correct": 2},
  {"q": "The Tixie seat map is not loading. What should you do first?", "options": ["Force-quit Tixie and relaunch immediately", "Wait up to 2 minutes then use the Select Option dropdown", "Contact Jomero ops right away", "Restart your computer"], "correct": 1},
  {"q": "What three things must a proper bug report include?", "options": ["Your name, session time, and tickets purchased", "Screenshot, Request ID, and what happened vs. expected", "Error text, your email, and the event name", "Request ID, ticket price, and section number"], "correct": 1},
  {"q": "Are you allowed to use bots, scripts, or automated tools to purchase tickets?", "options": ["Yes — as long as you still review each purchase", "Yes — if it helps you work faster", "No — all purchases must be made manually, automated tools are strictly prohibited", "Only with written approval from Jomero"], "correct": 2}
]'::jsonb WHERE module_number = 3;

-- Add no-bots question to final quiz (question 11)
INSERT INTO quiz_questions (question_number, question_text, options, correct_index, explanation)
VALUES (
  11,
  'Which of the following is strictly prohibited when using Tixie?',
  '["Purchasing fewer than 8 tickets when the request shows 8", "Buying tickets below the After Fees price", "Using bots, scripts, or automated purchasing tools", "Logging in outside of peak demand hours"]'::jsonb,
  2,
  'All purchases must be made manually. The use of bots, scripts, browser extensions, or any automated tools is strictly prohibited and will result in termination of contractor access.'
);