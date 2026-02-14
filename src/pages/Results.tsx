import { useMemo, useState, useEffect } from "react";
import { motion } from "framer-motion";
import { useNavigate } from "react-router-dom";
import { Award, Brain, Mic, Video, RotateCcw, Loader2 } from "lucide-react";
import { useInterview } from "@/contexts/InterviewContext";
import { supabase } from "@/integrations/supabase/client";
import Navbar from "@/components/Navbar";
import CircularProgress from "@/components/CircularProgress";

const Results = () => {
  const navigate = useNavigate();
  const { aptitudeScore, technicalScores, hrScores } = useInterview();

  const [aiSummary, setAiSummary] = useState("");
  const [aiRecommendation, setAiRecommendation] = useState("");
  const [loadingReport, setLoadingReport] = useState(true);

  // -------- Technical Average (0–100) --------
  const techAvg = useMemo(() => {
    if (!technicalScores.length) return null;

    const avg =
      technicalScores.reduce((a, s) => a + s.score, 0) /
      technicalScores.length;

    return Math.round(avg * 10); // because each question score is /10
  }, [technicalScores]);

  // -------- HR Average (0–100) --------
  const hrAvg = useMemo(() => {
    if (!hrScores.length) return null;

    const avg =
      hrScores.reduce((a, s) => a + s.score, 0) /
      hrScores.length;

    return Math.round(avg);
  }, [hrScores]);

  // -------- Only Include Attempted Rounds --------
  const attemptedScores = useMemo(() => {
    const scores: number[] = [];

    if (aptitudeScore > 0) scores.push(aptitudeScore);
    if (techAvg !== null) scores.push(techAvg);
    if (hrAvg !== null) scores.push(hrAvg);

    return scores;
  }, [aptitudeScore, techAvg, hrAvg]);

  // -------- Final Overall --------
 const activeScores = [
  aptitudeScore > 0 ? aptitudeScore : null,
  techAvg > 0 ? techAvg : null,
  hrAvg > 0 ? hrAvg : null,
].filter((s) => s !== null) as number[];

const overall =
  activeScores.length > 0
    ? Math.round(
        activeScores.reduce((a, b) => a + b, 0) /
        activeScores.length
      )
    : 0;

    

  // -------- Recommendation Logic --------
  const fallbackRecommendation =
    attemptedScores.length === 0
      ? "No Evaluation"
      : overall >= 80
      ? "Strong Hire"
      : overall >= 60
      ? "Consider"
      : "Needs Improvement";

  // -------- AI Report Fetch --------
  useEffect(() => {
    const fetchReport = async () => {
      try {
        const { data, error } = await supabase.functions.invoke(
          "generate-report",
          {
            body: { aptitudeScore, technicalScores, hrScores },
          }
        );

        if (error) throw error;

        setAiSummary(data.summary || "");
        setAiRecommendation(data.recommendation || "");
      } catch {
        setAiSummary(
          "Evaluation complete. Review your scores above for detailed breakdown."
        );
        setAiRecommendation(fallbackRecommendation);
      } finally {
        setLoadingReport(false);
      }
    };

    fetchReport();
  }, [aptitudeScore, technicalScores, hrScores, fallbackRecommendation]);

  const recommendation = aiRecommendation || fallbackRecommendation;

  const recColor =
    recommendation === "Strong Hire"
      ? "text-accent"
      : recommendation === "Consider"
      ? "text-primary"
      : recommendation === "Needs Improvement"
      ? "text-destructive"
      : "text-muted-foreground";

  return (
    <div className="min-h-screen bg-background">
      <Navbar />
      <div className="pt-32 pb-20 px-6 max-w-4xl mx-auto">
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}>
          <div className="text-center mb-12">
            <h1 className="text-4xl font-bold mb-4">
              Interview <span className="gradient-text">Report</span>
            </h1>
            <p className="text-muted-foreground text-lg">
              AI-generated evaluation of your performance
            </p>
          </div>

          {/* Overall Score */}
          <div className="glass rounded-2xl p-12 text-center mb-8 glow">
            <CircularProgress value={overall} size={180} />
            <h2 className="text-2xl font-bold mt-6 mb-2">Overall Score</h2>
            <p className={`text-xl font-bold ${recColor}`}>
              {recommendation}
            </p>
          </div>

          {/* Breakdown */}
          <div className="grid md:grid-cols-3 gap-6 mb-8">
            {[
              { label: "Aptitude", score: aptitudeScore, icon: Brain },
              { label: "Technical", score: techAvg ?? 0, icon: Mic },
              { label: "HR", score: hrAvg ?? 0, icon: Video },
            ].map(({ label, score, icon: Icon }, i) => (
              <motion.div
                key={i}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.2 + i * 0.1 }}
                className="glass rounded-2xl p-8 text-center"
              >
                <Icon className="w-8 h-8 text-primary mx-auto mb-4" />
                <CircularProgress value={score} size={100} />
                <h3 className="font-semibold mt-4">{label}</h3>
                <p className="text-muted-foreground text-sm">{score}%</p>
              </motion.div>
            ))}
          </div>

          {/* AI Feedback */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.5 }}
            className="glass rounded-2xl p-8 mb-8"
          >
            <div className="flex items-center gap-3 mb-4">
              <Award className="w-6 h-6 text-primary" />
              <h3 className="text-xl font-bold">AI Feedback</h3>
            </div>

            {loadingReport ? (
              <div className="flex items-center gap-3 text-muted-foreground">
                <Loader2 className="w-5 h-5 animate-spin" />
                <p>AI is generating your personalized feedback...</p>
              </div>
            ) : (
              <p className="text-muted-foreground leading-relaxed">
                {aiSummary}
              </p>
            )}
          </motion.div>

          {/* Technical Detailed Breakdown */}
          {technicalScores.length > 0 && (
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.6 }}
              className="glass rounded-2xl p-8 mb-8"
            >
              <h3 className="text-xl font-bold mb-6">
                Technical Breakdown
              </h3>

              <div className="space-y-4">
                {technicalScores.map((s, i) => (
                  <div
                    key={i}
                    className="border border-border rounded-xl p-5"
                  >
                    <div className="flex justify-between items-start mb-2">
                      <p className="text-sm font-medium flex-1 pr-4">
                        {s.question}
                      </p>
                      <span className="gradient-text font-bold text-lg whitespace-nowrap">
                        {s.score}/10
                      </span>
                    </div>
                    <p className="text-sm text-muted-foreground">
                      {s.feedback}
                    </p>
                  </div>
                ))}
              </div>
            </motion.div>
          )}

          {/* Retry */}
          <div className="text-center">
            <button
              onClick={() => navigate("/")}
              className="glass px-8 py-3.5 rounded-xl font-semibold inline-flex items-center gap-2 hover:glow transition-all"
            >
              <RotateCcw className="w-5 h-5" />
              Take Another Interview
            </button>
          </div>
        </motion.div>
      </div>
    </div>
  );
};

export default Results;
