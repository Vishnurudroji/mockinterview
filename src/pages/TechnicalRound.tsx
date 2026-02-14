import { useState, useCallback, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import { Mic, Volume2, Loader2, CheckCircle } from "lucide-react";
import { useInterview } from "@/contexts/InterviewContext";
import { supabase } from "@/integrations/supabase/client";
import Navbar from "@/components/Navbar";
import WaveformVisualizer from "@/components/WaveformVisualizer";
import { useToast } from "@/hooks/use-toast";

const TechnicalRound = () => {
  const navigate = useNavigate();
  const { skills, setTechnicalScores, selectedMode } = useInterview();
  const { toast } = useToast();

  const [phase, setPhase] = useState<
    "loading" | "intro" | "speaking" | "listening" | "evaluating" | "complete"
  >("loading");

  const [currentQ, setCurrentQ] = useState(0);
  const [transcript, setTranscript] = useState("");
  const [results, setResults] = useState<
    { question: string; answer: string; score: number; feedback: string }[]
  >([]);
  const [questions, setQuestions] = useState<string[]>([]);

  // Fetch AI-generated questions
  useEffect(() => {
    const fetchQuestions = async () => {
      try {
        const { data, error } = await supabase.functions.invoke(
          "generate-questions",
          { body: { skills } }
        );

        if (error) throw error;

        setQuestions(data.questions || []);
        setPhase("intro");
      } catch (err) {
        console.error("Failed to generate questions:", err);

        toast({
          title: "Error",
          description: "Failed to generate questions. Using defaults.",
          variant: "destructive",
        });

        setQuestions(
          skills.slice(0, 3).map((s) => `What is ${s} and why is it used?`)
        );

        setPhase("intro");
      }
    };

    fetchQuestions();
  }, [skills, toast]);

  // Text-to-speech
  const speak = useCallback((text: string): Promise<void> => {
    return new Promise((resolve) => {
      if (!window.speechSynthesis) {
        resolve();
        return;
      }
      const u = new SpeechSynthesisUtterance(text);
      u.rate = 0.9;
      u.onend = () => resolve();
      u.onerror = () => resolve();
      speechSynthesis.speak(u);
    });
  }, []);

  // Speech-to-text
  const listen = useCallback((): Promise<string> => {
    return new Promise((resolve) => {
      const SR =
        window.SpeechRecognition || window.webkitSpeechRecognition;

      if (!SR) {
        resolve("Speech recognition not supported.");
        return;
      }

      const recognition = new SR();
      recognition.continuous = false;
      recognition.interimResults = false;
      recognition.lang = "en-US";

      let result = "";

      recognition.onresult = (e: SpeechRecognitionEvent) => {
        result = e.results[0][0].transcript;
      };

      recognition.onend = () =>
        resolve(result || "No answer captured.");

      recognition.onerror = () =>
        resolve("Error capturing audio.");

      recognition.start();

      setTimeout(() => {
        try {
          recognition.stop();
        } catch {}
      }, 15000);
    });
  }, []);

  // Evaluate answer
  const evaluateAnswer = useCallback(
    async (
      question: string,
      answer: string
    ): Promise<{ score: number; feedback: string }> => {
      try {
        const { data, error } =
          await supabase.functions.invoke("evaluate-answer", {
            body: { question, answer, type: "technical" },
          });

        if (error) throw error;

        return {
          score: data.score || 5,
          feedback: data.feedback || "Evaluation complete.",
        };
      } catch {
        return {
          score: 6,
          feedback: "AI evaluation unavailable. Default score assigned.",
        };
      }
    },
    []
  );

  // Interview flow
  const runInterview = useCallback(async () => {
    const allResults: typeof results = [];

    for (let i = 0; i < questions.length; i++) {
      setCurrentQ(i);
      setTranscript("");
      setPhase("speaking");

      await speak(questions[i]);

      setPhase("listening");
      const answer = await listen();
      setTranscript(answer);

      setPhase("evaluating");
      const evaluation = await evaluateAnswer(
        questions[i],
        answer
      );

      allResults.push({
        question: questions[i],
        answer,
        score: evaluation.score,
        feedback: evaluation.feedback,
      });

      setResults([...allResults]);

      if (i < questions.length - 1) {
        await new Promise((r) => setTimeout(r, 2000));
      }
    }

    setTechnicalScores(allResults);
    setPhase("complete");

    setTimeout(() => {
      if (selectedMode === "all") {
        navigate("/hr");
      } else {
        navigate("/results");
      }
    }, 2500);
  }, [
    questions,
    speak,
    listen,
    evaluateAnswer,
    setTechnicalScores,
    navigate,
    selectedMode,
  ]);

  return (
    <div className="min-h-screen bg-background">
      <Navbar />
      <div className="pt-32 pb-20 px-6 max-w-2xl mx-auto">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
        >
          <div className="text-center mb-8">
            <h1 className="text-3xl font-bold mb-2">
              Technical <span className="gradient-text">Round</span>
            </h1>
            <p className="text-muted-foreground">
              AI Voice Interview • Question {currentQ + 1} of{" "}
              {questions.length || 3}
            </p>
          </div>

          <div className="glass rounded-2xl p-10 text-center min-h-[380px] flex flex-col justify-center">
            <AnimatePresence mode="wait">

              {phase === "loading" && (
                <Loader2 className="w-16 h-16 text-primary mx-auto animate-spin" />
              )}

              {phase === "intro" && (
                <motion.div key="intro" initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
                  <Mic className="w-16 h-16 text-primary mx-auto mb-6" />
                  <h2 className="text-xl font-semibold mb-4">
                    Ready for your technical interview?
                  </h2>
                  <button
                    onClick={runInterview}
                    className="gradient-primary text-primary-foreground px-8 py-3.5 rounded-xl font-semibold"
                  >
                    Begin Interview
                  </button>
                </motion.div>
              )}

              {(phase === "speaking" ||
                phase === "listening" ||
                phase === "evaluating") && (
                <motion.div
                  key={currentQ}
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  className="space-y-6"
                >
                  <h2 className="text-lg font-semibold text-primary">
                    Question {currentQ + 1}
                  </h2>

                  <p className="text-xl font-medium">
                    {questions[currentQ]}
                  </p>

                  {/* 🔥 Skill Focus Added */}
                  <div className="text-sm text-muted-foreground">
                    Skill Focus: {skills[currentQ] || "General Technical Knowledge"}
                  </div>

                  {phase === "speaking" && (
                    <div className="flex flex-col items-center">
                      <Volume2 className="w-10 h-10 text-accent mb-2 animate-pulse" />
                      <p className="text-muted-foreground">AI is asking...</p>
                    </div>
                  )}

                  {phase === "listening" && (
                    <div className="flex flex-col items-center">
                      <WaveformVisualizer />
                      <p className="text-muted-foreground mt-3">
                        Listening... Speak clearly.
                      </p>
                    </div>
                  )}

                  {phase === "evaluating" && (
                    <div className="flex flex-col items-center">
                      <Loader2 className="w-10 h-10 text-primary animate-spin mb-2" />
                      <p className="text-muted-foreground">
                        Evaluating your answer...
                      </p>
                    </div>
                  )}

                  {transcript && (
                    <div className="bg-secondary/30 rounded-xl p-4 text-left mt-4">
                      <p className="text-sm text-muted-foreground mb-1">
                        Your Answer:
                      </p>
                      <p className="font-medium">{transcript}</p>
                    </div>
                  )}
                </motion.div>
              )}

              {phase === "complete" && (
                <motion.div key="complete" initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
                  <CheckCircle className="w-16 h-16 text-accent mx-auto mb-4" />
                  <h2 className="text-2xl font-bold mb-2">
                    Technical Round Complete!
                  </h2>
                  <p className="text-muted-foreground">
                    {selectedMode === "all"
                      ? "Moving to HR Round..."
                      : "Generating your report..."}
                  </p>
                </motion.div>
              )}

            </AnimatePresence>
          </div>
        </motion.div>
      </div>
    </div>
  );
};

export default TechnicalRound;
