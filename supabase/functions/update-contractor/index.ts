import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  try {
    const { contractorId, quiz_score, quiz_attempts, status, completed_at } = await req.json();

    if (!contractorId || typeof contractorId !== "string") {
      return new Response(JSON.stringify({ error: "Missing contractorId" }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Validate status
    const allowedStatuses = ["cleared", "failed", "in_progress"];
    if (status && !allowedStatuses.includes(status)) {
      return new Response(JSON.stringify({ error: "Invalid status" }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Validate score
    if (quiz_score !== undefined && (typeof quiz_score !== "number" || quiz_score < 0 || quiz_score > 100)) {
      return new Response(JSON.stringify({ error: "Invalid quiz_score" }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const supabaseAdmin = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!
    );

    const updateData: Record<string, unknown> = {};
    if (quiz_score !== undefined) updateData.quiz_score = quiz_score;
    if (quiz_attempts !== undefined) updateData.quiz_attempts = quiz_attempts;
    if (status) updateData.status = status;
    if (completed_at) updateData.completed_at = completed_at;

    const { error } = await supabaseAdmin
      .from("contractors")
      .update(updateData)
      .eq("id", contractorId);

    if (error) throw error;

    return new Response(JSON.stringify({ success: true }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (err) {
    return new Response(JSON.stringify({ error: err.message }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
