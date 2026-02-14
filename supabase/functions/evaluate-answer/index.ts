import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

serve(async (req: Request) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { question, answer, type } = await req.json();

    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
    if (!LOVABLE_API_KEY) {
      throw new Error("LOVABLE_API_KEY is not configured");
    }

    // 🚨 Handle empty or invalid answers immediately
    if (!answer || answer.includes("No answer")) {
      return new Response(
        JSON.stringify({
          score: 1,
          feedback: "No valid answer was provided.",
        }),
        { headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // 🎯 Strict rubric-based system prompt
    const systemPrompt =
      type === "hr"
        ? `
You are an HR interview evaluator.

Score strictly using this rubric:

1-3  = Poor (unclear, weak communication, no structure)
4-6  = Average (basic clarity but lacks depth or confidence)
7-8  = Good (clear, structured, confident answer)
9-10 = Excellent (strong communication, structured, confident, impactful)

Return ONLY valid JSON:
{"score": number, "feedback": "one sentence"}
`
        : `
You are a technical interview evaluator.

Score strictly using this rubric:

1-3  = Incorrect or very weak understanding
4-6  = Basic understanding but lacks depth
7-8  = Good understanding with correct explanation
9-10 = Excellent explanation with clarity and accuracy

Return ONLY valid JSON:
{"score": number, "feedback": "one sentence"}
`;

    const response = await fetch(
      "https://ai.gateway.lovable.dev/v1/chat/completions",
      {
        method: "POST",
        headers: {
          Authorization: `Bearer ${LOVABLE_API_KEY}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          model: "google/gemini-3-flash-preview",
          temperature: 0, // 🔥 makes evaluation deterministic
          messages: [
            { role: "system", content: systemPrompt },
            {
              role: "user",
              content: `
Question:
${question}

Candidate Answer:
${answer}

Evaluate strictly according to rubric.
Return JSON only.
`,
            },
          ],
        }),
      }
    );

    if (!response.ok) {
      const t = await response.text();
      console.error("AI gateway error:", response.status, t);
      throw new Error(`AI gateway error: ${response.status}`);
    }

    const data = await response.json();
    const content =
      data.choices?.[0]?.message?.content ||
      '{"score":5,"feedback":"Unable to evaluate."}';

    let evaluation: { score: number; feedback: string };

    try {
      const cleaned = content
        .replace(/```json\n?/g, "")
        .replace(/```\n?/g, "")
        .trim();

      evaluation = JSON.parse(cleaned);
    } catch {
      evaluation = {
        score: 5,
        feedback: "Evaluation parsing failed. Default score applied.",
      };
    }

    // 🛡 Normalize score to 1–10
    if (typeof evaluation.score !== "number") {
      evaluation.score = 5;
    }

    evaluation.score = Math.max(
      1,
      Math.min(10, Math.round(evaluation.score))
    );

    if (!evaluation.feedback) {
      evaluation.feedback = "Answer evaluated successfully.";
    }

    return new Response(JSON.stringify(evaluation), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (e) {
    console.error("evaluate-answer error:", e);

    return new Response(
      JSON.stringify({
        score: 5,
        feedback: "An internal error occurred during evaluation.",
      }),
      {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      }
    );
  }
});
