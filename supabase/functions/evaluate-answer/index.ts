import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version',
};

serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response(null, { headers: corsHeaders });

  try {
    const { question, answer, type } = await req.json();
    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
    if (!LOVABLE_API_KEY) throw new Error("LOVABLE_API_KEY is not configured");

    const systemPrompt = type === "hr"
      ? `You are an HR interview evaluator. Evaluate the candidate's answer based on: confidence, clarity, structure, and communication skills. Return ONLY a JSON object with "score" (integer 1-10) and "feedback" (one sentence). Example: {"score": 8, "feedback": "Clear and confident response with good self-awareness."}`
      : `You are a technical interview evaluator. Evaluate the candidate's answer for technical accuracy, depth of understanding, and practical knowledge. Return ONLY a JSON object with "score" (integer 1-10) and "feedback" (one sentence). Example: {"score": 7, "feedback": "Good understanding of core concepts but could elaborate on edge cases."}`;

    const response = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${LOVABLE_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "google/gemini-3-flash-preview",
        messages: [
          { role: "system", content: systemPrompt },
          { role: "user", content: `Question: ${question}\nCandidate's Answer: ${answer}\n\nEvaluate this answer.` }
        ],
      }),
    });

    if (!response.ok) {
      const t = await response.text();
      console.error("AI gateway error:", response.status, t);
      throw new Error(`AI gateway error: ${response.status}`);
    }

    const data = await response.json();
    const content = data.choices?.[0]?.message?.content || '{"score":5,"feedback":"Unable to evaluate."}';

    let evaluation: { score: number; feedback: string };
    try {
      const cleaned = content.replace(/```json\n?/g, '').replace(/```\n?/g, '').trim();
      evaluation = JSON.parse(cleaned);
    } catch {
      evaluation = { score: 6, feedback: "Answer received but evaluation parsing failed." };
    }

    return new Response(JSON.stringify(evaluation), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (e) {
    console.error("evaluate-answer error:", e);
    return new Response(JSON.stringify({ error: e instanceof Error ? e.message : "Unknown error" }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
