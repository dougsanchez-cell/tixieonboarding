UPDATE public.app_config
SET value = regexp_replace(
  regexp_replace(
    value,
    '<div style="background: #4A1F1F[^<]*<p[^<]*<strong[^>]*>[^<]*</strong></p>\s*<p[^<]*<a href="https://docs\.google\.com/forms/d/1UluJjnfqhT1[^"]*"[^>]*>[^<]*</a></p>\s*</div>\s*',
    '',
    'g'
  ),
  '\s*<li>You must complete the <a href="https://docs\.google\.com/forms/d/1UluJjnfqhT1[^"]*"[^>]*>Payment Account Submission Form</a> before purchasing in Tixie</li>',
  '',
  'g'
)
WHERE key = 'compensation_content';