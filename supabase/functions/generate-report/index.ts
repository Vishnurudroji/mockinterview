import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { aptitudeScore, technicalScores = [], hrScores = [] } =
      await req.json();

    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
    if (!LOVABLE_API_KEY) {
      throw new Error("LOVABLE_API_KEY is not configured");
    }

    // ===== 1️⃣ CALCULATE TECH AVG =====
    const techAvg =
      technicalScores.length > 0
        ? Math.round(
            (technicalScores.reduce(
              (acc: number, s: any) => acc + (s.score || 0),
              0
            ) /
              technicalScores.length) *
              10
          )
        : null;

    // ===== 2️⃣ CALCULATE HR AVG =====
    const hrAvg =
      hrScores.length > 0
        ? Math.round(
            (hrScores.reduce(
              (acc: number, s: any) => acc + (s.score || 0),
              0
            ) /
              hrScores.length) *
              10
          )
        : null;

    // ===== 3️⃣ BUILD ACTIVE SCORES ARRAY =====
    const activeScores = [
      aptitudeScore > 0 ? aptitudeScore : null,
      techAvg,
      hrAvg,
    ].filter((s) => s !== null) as number[];

    const overall =
      activeScores.length > 0
        ? Math.round(
            activeScores.reduce((a, b) => a + b, 0) / activeScores.length
          )
        : 0;

    // ===== 4️⃣ LOGICAL RECOMMENDATION (NOT AI) =====
    let recommendation = "Needs Improvement";

    if (overall >= 80) recommendation = "Strong Hire";
    else if (overall >= 60) recommendation = "Consider";

    // ===== 5️⃣ AI SUMMARY ONLY =====
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
          messages: [
            {
              role: "system",
              content:
                "You are an AI hiring evaluator. Write a 2-3 sentence professional feedback summary based strictly on the provided scores. Do not invent data.",
            },
            {
              role: "user",
              content: `
Candidate Performance:
Aptitude Score: ${aptitudeScore || "Not Attempted"}
Technical Average: ${techAvg ?? "Not Attempted"}
HR Average: ${hrAvg ?? "Not Attempted"}
Overall Score: ${overall}

Write a constructive and professional evaluation summary.
`,
            },
          ],
        }),
      }
    );

    let summary = "Evaluation complete.";

    if (response.ok) {
      const data = await response.json();
      summary =
        data.choices?.[0]?.message?.content?.trim() || summary;
    }

    return new Response(
      JSON.stringify({
        summary,
        recommendation,
        overall,
        aptitudeScore,
        techAvg,
        hrAvg,
      }),
      {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      }
    );
  } catch (e) {
    console.error("generate-report error:", e);

    return new Response(
      JSON.stringify({
        error: e instanceof Error ? e.message : "Unknown error",
      }),
      {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      }
    );
  }
});
