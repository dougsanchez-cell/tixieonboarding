-- Create compensation_unlocks table
CREATE TABLE public.compensation_unlocks (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  email TEXT NOT NULL,
  unlocked_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX idx_compensation_unlocks_email ON public.compensation_unlocks (LOWER(email));

ALTER TABLE public.compensation_unlocks ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anon can insert compensation unlocks"
ON public.compensation_unlocks
FOR INSERT
TO anon, authenticated
WITH CHECK (true);

CREATE POLICY "Anon can select own compensation unlocks"
ON public.compensation_unlocks
FOR SELECT
TO anon, authenticated
USING (true);

-- Seed app_config keys
INSERT INTO public.app_config (key, value) VALUES
  ('compensation_access_code', 'TIXIE2026'),
  ('compensation_content', '<h3 style="color: #8B50CC; margin-bottom: 8px;">💰 Tixie Contractor Compensation</h3>

<p><strong>Pay Structure</strong></p>
<p>Tixie contractors are compensated on a <strong>per-ticket commission basis</strong>. You earn a commission for every ticket successfully purchased through the Tixie platform.</p>

<table style="width: 100%; border-collapse: collapse; margin: 12px 0;">
  <tr style="background: #2A2B3D;">
    <td style="padding: 8px; border: 1px solid #3A3B50; color: #E8E8F0; font-weight: bold;">Commission Rate</td>
    <td style="padding: 8px; border: 1px solid #3A3B50; color: #C8C8D0;">$[X.XX] per ticket purchased</td>
  </tr>
  <tr>
    <td style="padding: 8px; border: 1px solid #3A3B50; color: #E8E8F0; font-weight: bold;">Weekly Earnings Cap</td>
    <td style="padding: 8px; border: 1px solid #3A3B50; color: #C8C8D0;">$250/week during test phase</td>
  </tr>
  <tr style="background: #2A2B3D;">
    <td style="padding: 8px; border: 1px solid #3A3B50; color: #E8E8F0; font-weight: bold;">Weekly Hours Cap</td>
    <td style="padding: 8px; border: 1px solid #3A3B50; color: #C8C8D0;">10 hours/week maximum</td>
  </tr>
  <tr>
    <td style="padding: 8px; border: 1px solid #3A3B50; color: #E8E8F0; font-weight: bold;">Pay Period</td>
    <td style="padding: 8px; border: 1px solid #3A3B50; color: #C8C8D0;">Bi-weekly (every two weeks)</td>
  </tr>
  <tr style="background: #2A2B3D;">
    <td style="padding: 8px; border: 1px solid #3A3B50; color: #E8E8F0; font-weight: bold;">Payment Method</td>
    <td style="padding: 8px; border: 1px solid #3A3B50; color: #C8C8D0;">Direct deposit via [payment platform]</td>
  </tr>
</table>

<p><strong>How Earnings Are Tracked</strong></p>
<p>Every successful purchase is logged automatically by Tixie. Your earnings are calculated based on the number of tickets in each completed purchase. You can track your activity through the Tixie app.</p>

<p><strong>Important Notes</strong></p>
<ul style="margin: 8px 0; padding-left: 20px; color: #C8C8D0;">
  <li>Failed purchases (Select Option dropdown) do <strong>not</strong> count toward earnings</li>
  <li>The $250/week cap applies during the initial test phase and may be adjusted</li>
  <li>You are classified as an <strong>independent contractor</strong> (1099), not an employee</li>
  <li>Earnings are subject to self-employment tax — you are responsible for your own tax obligations</li>
</ul>

<p><strong>Payout Schedule</strong></p>
<ul style="margin: 8px 0; padding-left: 20px; color: #C8C8D0;">
  <li>Pay periods close every other Friday</li>
  <li>Payments are processed within 5 business days</li>
  <li>You will receive a 1099 at the end of the tax year</li>
</ul>

<p style="margin-top: 12px; color: #9898B0; font-size: 12px;">Questions about compensation? Email <a href="mailto:gigsupport@jomero.co" style="color: #8B50CC;">gigsupport@jomero.co</a> or use Tixie Chat Support (Mon–Fri, 8 AM–1 PM PST).</p>')
ON CONFLICT (key) DO NOTHING;