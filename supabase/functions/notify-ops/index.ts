import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.49.4";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });

  try {
    const { contractorId, name, email, score } = await req.json();

    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const supabase = createClient(supabaseUrl, supabaseKey);

    // Fetch ops email from config
    const { data: configData } = await supabase
      .from("app_config")
      .select("value")
      .eq("key", "ops_notification_email")
      .single();

    const opsEmail = configData?.value || "ops@jomero.com";

    // Log the notification (actual email sending would use a service)
    console.log(`[NOTIFY-OPS] Contractor cleared: ${name} (${email}), Score: ${score}%, Notify: ${opsEmail}`);

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
