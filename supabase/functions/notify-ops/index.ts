import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.49.4";

const corsHeaders = {
  "Access-Control-Allow-Origin": Deno.env.get("ALLOWED_ORIGIN") || "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });

  try {
    const { contractorId, name, email, score, guidedSessionRequest } = await req.json();

    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const supabase = createClient(supabaseUrl, supabaseKey);

    const { data: configData } = await supabase
      .from("app_config")
      .select("value")
      .eq("key", "ops_notification_email")
      .single();

    const opsEmail = configData?.value || "gigsupport@jomero.co";

    const emailSubject = guidedSessionRequest
      ? `🎓 Guided Session Request — ${name} (${email})`
      : `✅ New Contractor Cleared — ${name} (${email})`;

    const emailBody = guidedSessionRequest
      ? `<div style="font-family:Arial,sans-serif;max-width:500px;margin:0 auto;padding:20px;">
          <h2 style="color:#7B51D3;">Guided Session Request</h2>
          <p>${name} (<a href="mailto:${email}">${email}</a>) has completed the Tixie orientation and is requesting a guided 1-hour training session.</p>
          <table style="width:100%;border-collapse:collapse;">
            <tr><td style="padding:8px;border-bottom:1px solid #eee;font-weight:bold;">Name</td><td style="padding:8px;border-bottom:1px solid #eee;">${name}</td></tr>
            <tr><td style="padding:8px;border-bottom:1px solid #eee;font-weight:bold;">Email</td><td style="padding:8px;border-bottom:1px solid #eee;">${email}</td></tr>
            <tr><td style="padding:8px;border-bottom:1px solid #eee;font-weight:bold;">Quiz Score</td><td style="padding:8px;border-bottom:1px solid #eee;">${score}%</td></tr>
            <tr><td style="padding:8px;font-weight:bold;">Contractor ID</td><td style="padding:8px;">${contractorId}</td></tr>
          </table>
          <p style="color:#666;margin-top:16px;">Please reach out to schedule their session.</p>
        </div>`
      : `<div style="font-family:Arial,sans-serif;max-width:500px;margin:0 auto;padding:20px;">
          <h2 style="color:#7B51D3;">New Contractor Cleared</h2>
          <table style="width:100%;border-collapse:collapse;">
            <tr><td style="padding:8px;border-bottom:1px solid #eee;font-weight:bold;">Name</td><td style="padding:8px;border-bottom:1px solid #eee;">${name}</td></tr>
            <tr><td style="padding:8px;border-bottom:1px solid #eee;font-weight:bold;">Email</td><td style="padding:8px;border-bottom:1px solid #eee;">${email}</td></tr>
            <tr><td style="padding:8px;border-bottom:1px solid #eee;font-weight:bold;">Quiz Score</td><td style="padding:8px;border-bottom:1px solid #eee;">${score}%</td></tr>
            <tr><td style="padding:8px;font-weight:bold;">Contractor ID</td><td style="padding:8px;">${contractorId}</td></tr>
          </table>
          <p style="color:#666;margin-top:16px;">This contractor has completed the Tixie orientation and is cleared for live purchasing.</p>
        </div>`;

    console.log(`[NOTIFY-OPS] ${guidedSessionRequest ? 'Guided session request' : 'Contractor cleared'}: ${name} (${email}), Score: ${score}%, Notify: ${opsEmail}`);

    // Send email via Resend if API key is configured
    const RESEND_API_KEY = Deno.env.get("RESEND_API_KEY");
    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");

    if (RESEND_API_KEY && LOVABLE_API_KEY) {
      const GATEWAY_URL = "https://connector-gateway.lovable.dev/resend";
      const emailRes = await fetch(`${GATEWAY_URL}/emails`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "Authorization": `Bearer ${LOVABLE_API_KEY}`,
          "X-Connection-Api-Key": RESEND_API_KEY,
        },
        body: JSON.stringify({
          from: "Tixie Onboarding <onboarding@resend.dev>",
          to: [opsEmail],
          subject: emailSubject,
          html: emailBody,
        }),
      });

      if (!emailRes.ok) {
        const errText = await emailRes.text();
        console.error("[NOTIFY-OPS] Resend error:", errText);
      }
    } else {
      console.warn("[NOTIFY-OPS] RESEND_API_KEY or LOVABLE_API_KEY not set — email not sent");
    }

    return new Response(JSON.stringify({ success: true, notified: opsEmail }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (e) {
    console.error("notify-ops error:", e);
    return new Response(JSON.stringify({ error: e instanceof Error ? e.message : "Unknown error" }), {
      status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
