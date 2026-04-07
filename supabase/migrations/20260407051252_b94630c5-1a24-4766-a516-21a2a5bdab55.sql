
ALTER TABLE content_modules ADD COLUMN IF NOT EXISTS comprehension_questions jsonb DEFAULT '[]'::jsonb;

UPDATE content_modules SET comprehension_questions = '[
  {"q": "How do you install Tixie on a Mac?", "options": ["Download from the App Store", "Run the curl install command in Terminal", "Ask Jomero to email the installer", "Double-click a .dmg file"], "correct": 1},
  {"q": "After logging in, what must you toggle to connect to the live request feed?", "options": ["Start Session", "Enable Live Mode", "Enable Local Connection", "Connect to Requests"], "correct": 2},
  {"q": "What are the Tixie purchasing operating hours?", "options": ["24/7, any time", "Monday–Friday, 6:00 AM–12:00 PM PST, max 1 hour", "Monday–Saturday, 8:00 AM–5:00 PM EST", "Weekdays only, no time limit"], "correct": 1}
]'::jsonb WHERE module_number = 1;

UPDATE content_modules SET comprehension_questions = '[
  {"q": "Which ticket quantities are valid to purchase?", "options": ["Any quantity the request asks for", "Only exactly 8 tickets", "Even quantities only: 2, 4, 6, or 8", "1 to 8 tickets, your choice"], "correct": 2},
  {"q": "The After Fees price is $95. What is the maximum acceptable checkout total?", "options": ["Exactly $95 — never more", "$97 — up to $2 over is acceptable", "$100 — up to $5 over is fine", "$90 — you must buy below After Fees"], "correct": 1},
  {"q": "What should you do FIRST when a new request appears in the Request Info box?", "options": ["Immediately start selecting seats", "Check the After Fees price", "Copy the Request ID from the icon", "Select your ticket quantity"], "correct": 2}
]'::jsonb WHERE module_number = 2;

UPDATE content_modules SET comprehension_questions = '[
  {"q": "Which seats must you NEVER purchase under any circumstances?", "options": ["Lawn and GA seats", "Orchestra and Mezzanine seats", "WC (Wheelchair) and ADA seats", "Pavilion and Club seats"], "correct": 2},
  {"q": "The Tixie seat map is not loading. What should you do first?", "options": ["Force-quit Tixie and relaunch immediately", "Wait up to 2 minutes then use the Select Option dropdown", "Contact Jomero ops right away", "Restart your computer"], "correct": 1},
  {"q": "What three things must a proper bug report include?", "options": ["Your name, session time, and tickets purchased", "Screenshot, Request ID, and what happened vs. expected", "Error text, your email, and the event name", "Request ID, ticket price, and section number"], "correct": 1}
]'::jsonb WHERE module_number = 3;
