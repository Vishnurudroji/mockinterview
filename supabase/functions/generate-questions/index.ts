import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type",
};

// Advanced words to block
const bannedKeywords = [
  "architecture",
  "internal",
  "fragmentation",
  "optimization",
  "microservices",
  "low-level",
  "thread pool",
  "complex",
  "scalability",
  "distributed",
  "clr",
  "large object heap",
  "generational",
  "state machine",
  "synchronizationcontext"
];

// Validate AI output
function isValidQuestion(q: string): boolean {
  const wordCount = q.trim().split(/\s+/).length;
  if (wordCount < 10 || wordCount > 15) return false;

  const lower = q.toLowerCase();
  for (const word of bannedKeywords) {
    if (lower.includes(word)) return false;
  }

  return true;
}

// Safe fallback
function fallbackQuestions(skills: string[]): string[] {
  return skills.slice(0, 3).map(
    (s) => `What is ${s} and why is it used?`
  );
}

serve(async (req: Request) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { skills } = await req.json();

    if (!skills || !Array.isArray(skills) || skills.length === 0) {
      throw new Error("Skills array is required");
    }

    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
    if (!LOVABLE_API_KEY) {
      throw new Error("LOVABLE_API_KEY is not configured");
    }

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
              content: `
You are a campus placement technical interviewer.

Generate exactly 3 technical interview questions.

Question structure:
1. First question: Basic definition from first skill.
2. Second question: Concept explanation or comparison from second skill.
3. Third question: Slightly deeper but still beginner-friendly from third skill.

Rules:
- Each question must contain 10 to 15 words.
- Use simple and clear language.
- Do not include advanced architecture or internal implementation topics.
- Do not use complex terminology.
- No numbering.
- Return ONLY a valid JSON array.
`
            },
            {
              role: "user",
              content: `
Skills:
1. ${skills[0] || ""}
2. ${skills[1] || ""}
3. ${skills[2] || ""}

Generate one question per skill in the specified order.
`
            }
          ]
        }),
      }
    );

    if (!response.ok) {
      const errorText = await response.text();
      console.error("AI gateway error:", response.status, errorText);
      throw new Error(`AI gateway error: ${response.status}`);
    }

    const data = await response.json();
    const content = data.choices?.[0]?.message?.content || "[]";

    let questions: string[];

    try {
      const cleaned = content
        .replace(/```json\n?/g, "")
        .replace(/```\n?/g, "")
        .trim();

      questions = JSON.parse(cleaned);

      if (!Array.isArray(questions)) {
        throw new Error("Invalid AI response");
      }

      // Filter invalid questions
      questions = questions.filter(isValidQuestion);

      if (questions.length < 3) {
        questions = fallbackQuestions(skills);
      }

    } catch {
      questions = fallbackQuestions(skills);
    }

    return new Response(JSON.stringify({ questions }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });

  } catch (e) {
    console.error("generate-questions error:", e);

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
