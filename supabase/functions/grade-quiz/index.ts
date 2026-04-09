import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": Deno.env.get("ALLOWED_ORIGIN") || "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  try {
    const { contractorId, answers } = await req.json();

    if (!contractorId || typeof contractorId !== "string") {
      return new Response(JSON.stringify({ error: "Missing contractorId" }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    if (!answers || typeof answers !== "object") {
      return new Response(JSON.stringify({ error: "Missing answers" }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const supabaseAdmin = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!
    );

    const { data: questions, error: qError } = await supabaseAdmin
      .from("quiz_questions")
      .select("*")
      .order("question_number");

    if (qError || !questions) {
      throw new Error(qError?.message || "Failed to load questions");
    }

    const { data: configData } = await supabaseAdmin
      .from("app_config")
      .select("value")
      .eq("key", "pass_threshold")
      .single();

    const passThreshold = parseInt(configData?.value || "80") || 80;

    let correct = 0;
    const results: Record<number, { correct: boolean; correct_index: number; explanation: string | null }> = {};

    questions.forEach((q) => {
      const userAnswer = answers[String(q.question_number)];
      const isCorrect = userAnswer === q.correct_index;
      if (isCorrect) correct++;
      results[q.question_number] = {
        correct: isCorrect,
        correct_index: q.correct_index,
        explanation: q.explanation,
      };
    });

    const pct = Math.round((correct / questions.length) * 100);
    const passed = pct >= passThreshold;

    const { data: contractor } = await supabaseAdmin
      .from("contractors")
      .select("quiz_attempts")
      .eq("id", contractorId)
      .single();

    const newAttempts = (contractor?.quiz_attempts || 0) + 1;

    const updateData: Record<string, unknown> = {
      quiz_score: pct,
      quiz_attempts: newAttempts,
      status: passed ? "cleared" : "failed",
    };
    if (passed) updateData.completed_at = new Date().toISOString();

    await supabaseAdmin
      .from("contractors")
      .update(updateData)
      .eq("id", contractorId);

    return new Response(
      JSON.stringify({ score: pct, passed, passThreshold, results }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (err) {
    return new Response(JSON.stringify({ error: err.message }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
