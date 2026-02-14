import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type",
};

const bannedWords = [
  "architecture",
  "implementation",
  "internal",
  "optimization",
  "fragmentation",
  "state machine",
  "synchronizationcontext",
  "thread pool",
  "low-level",
  "runtime",
  "generational",
  "microservices"
];

function cleanSkills(skills: string[]): string[] {
  return skills
    .map(s => s.trim())
    .filter(s => {
      const wordCount = s.split(/\s+/).length;
      if (wordCount > 3) return false;

      const lower = s.toLowerCase();
      for (const word of bannedWords) {
        if (lower.includes(word)) return false;
      }

      return true;
    })
    .slice(0, 10); // limit total skills
}

serve(async (req: Request) => {
  if (req.method === "OPTIONS")
    return new Response(null, { headers: corsHeaders });

  try {
    const { resumeText } = await req.json();

    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
    if (!LOVABLE_API_KEY)
      throw new Error("LOVABLE_API_KEY is not configured");

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
Extract ONLY high-level technical skills from the resume.

Rules:
- Include only programming languages, frameworks, databases, tools.
- Do NOT include implementation details.
- Do NOT include long phrases.
- Each skill must be 1 to 3 words only.
- Return ONLY a JSON array.
Example:
["Java", "React", "SQL", "Node.js", ".NET"]
`
            },
            {
              role: "user",
              content: resumeText
            }
          ]
        }),
      }
    );

    if (!response.ok) {
      const t = await response.text();
      console.error("AI gateway error:", response.status, t);
      throw new Error(`AI gateway error: ${response.status}`);
    }

    const data = await response.json();
    const content = data.choices?.[0]?.message?.content || "[]";

    let skills: string[];

    try {
      const cleaned = content
        .replace(/```json\n?/g, "")
        .replace(/```\n?/g, "")
        .trim();

      skills = JSON.parse(cleaned);

      if (!Array.isArray(skills)) throw new Error();

      skills = cleanSkills(skills);
    } catch {
      skills = ["Java", "SQL", "React"];
    }

    return new Response(JSON.stringify({ skills }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });

  } catch (e) {
    console.error("extract-skills error:", e);
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
