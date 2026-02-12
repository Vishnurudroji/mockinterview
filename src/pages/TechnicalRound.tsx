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
  const { skills, setTechnicalScores } = useInterview();
  const { toast } = useToast();
  const [phase, setPhase] = useState<"loading" | "intro" | "speaking" | "listening" | "evaluating" | "complete">("loading");
  const [currentQ, setCurrentQ] = useState(0);
  const [transcript, setTranscript] = useState("");
  const [results, setResults] = useState<{ question: string; answer: string; score: number; feedback: string }[]>([]);
  const [questions, setQuestions] = useState<string[]>([]);

  // Fetch AI-generated questions on mount
  useEffect(() => {
    const fetchQuestions = async () => {
      try {
        const { data, error } = await supabase.functions.invoke("generate-questions", {
          body: { skills },
        });
        if (error) throw error;
        setQuestions(data.questions || []);
        setPhase("intro");
      } catch (err) {
        console.error("Failed to generate questions:", err);
        toast({ title: "Error", description: "Failed to generate questions. Using defaults.", variant: "destructive" });
        setQuestions(skills.slice(0, 3).map(s => `Explain how ${s} works and describe a challenging problem you solved with it.`));
        setPhase("intro");
      }
    };
    fetchQuestions();
  }, [skills, toast]);

  const speak = useCallback((text: string): Promise<void> => {
    return new Promise((resolve) => {
      if (!window.speechSynthesis) { resolve(); return; }
      const u = new SpeechSynthesisUtterance(text);
      u.rate = 0.9;
      u.onend = () => resolve();
      u.onerror = () => resolve();
      speechSynthesis.speak(u);
    });
  }, []);

  const listen = useCallback((): Promise<string> => {
    return new Promise((resolve) => {
      const SR = window.SpeechRecognition || window.webkitSpeechRecognition;
      if (!SR) { resolve("Speech recognition not supported."); return; }
      const recognition = new SR();
      recognition.continuous = false;
      recognition.interimResults = false;
      recognition.lang = "en-US";
      let result = "";
      recognition.onresult = (e: SpeechRecognitionEvent) => { result = e.results[0][0].transcript; };
      recognition.onend = () => resolve(result || "No answer captured.");
      recognition.onerror = () => resolve("Error capturing audio.");
      recognition.start();
      setTimeout(() => { try { recognition.stop(); } catch {} }, 15000);
    });
  }, []);

  const evaluateAnswer = useCallback(async (question: string, answer: string): Promise<{ score: number; feedback: string }> => {
    try {
      const { data, error } = await supabase.functions.invoke("evaluate-answer", {
        body: { question, answer, type: "technical" },
      });
      if (error) throw error;
      return { score: data.score || 5, feedback: data.feedback || "Evaluation complete." };
    } catch {
      return { score: 6, feedback: "AI evaluation unavailable. Default score assigned." };
    }
  }, []);

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
      const evaluation = await evaluateAnswer(questions[i], answer);

      allResults.push({ question: questions[i], answer, score: evaluation.score, feedback: evaluation.feedback });
      setResults([...allResults]);

      if (i < questions.length - 1) {
        await new Promise(r => setTimeout(r, 2000));
      }
    }
    setTechnicalScores(allResults);
    setPhase("complete");
    setTimeout(() => navigate("/hr"), 2500);
  }, [questions, speak, listen, evaluateAnswer, setTechnicalScores, navigate]);

  return (
    <div className="min-h-screen bg-background">
      <Navbar />
      <div className="pt-32 pb-20 px-6 max-w-2xl mx-auto">
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}>
          <div className="text-center mb-8">
            <h1 className="text-3xl font-bold mb-2">Technical <span className="gradient-text">Round</span></h1>
            <p className="text-muted-foreground">AI Voice Interview • Question {currentQ + 1} of {questions.length || 3}</p>
          </div>

          <div className="w-full h-2 bg-secondary rounded-full mb-10 overflow-hidden">
            <motion.div className="h-full gradient-primary rounded-full" animate={{ width: `${((currentQ + (phase === "complete" ? 1 : 0)) / (questions.length || 3)) * 100}%` }} />
          </div>

          <div className="glass rounded-2xl p-10 text-center min-h-[280px] flex items-center justify-center">
            <AnimatePresence mode="wait">
              {phase === "loading" && (
                <motion.div key="loading" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
                  <Loader2 className="w-16 h-16 text-primary mx-auto mb-6 animate-spin" />
                  <h2 className="text-xl font-semibold mb-4">AI is preparing your questions...</h2>
                  <p className="text-muted-foreground">Generating personalized questions based on your resume skills.</p>
                </motion.div>
              )}
              {phase === "intro" && (
                <motion.div key="intro" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
                  <Mic className="w-16 h-16 text-primary mx-auto mb-6" />
                  <h2 className="text-xl font-semibold mb-4">Ready for your technical interview?</h2>
                  <p className="text-muted-foreground mb-8">AI has generated {questions.length} questions based on your resume skills. Speak your answers clearly.</p>
                  <button onClick={runInterview} className="gradient-primary text-primary-foreground px-8 py-3.5 rounded-xl font-semibold glow hover:opacity-90 transition-all">
                    Begin Interview
                  </button>
                </motion.div>
              )}
              {phase === "speaking" && (
                <motion.div key="speaking" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
                  <Volume2 className="w-16 h-16 text-primary mx-auto mb-6 animate-pulse" />
                  <h2 className="text-xl font-semibold mb-4">AI is asking...</h2>
                  <p className="text-muted-foreground leading-relaxed">{questions[currentQ]}</p>
                </motion.div>
              )}
              {phase === "listening" && (
                <motion.div key="listening" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
                  <WaveformVisualizer />
                  <h2 className="text-xl font-semibold mb-2 mt-6">Listening...</h2>
                  <p className="text-muted-foreground">Speak your answer now</p>
                </motion.div>
              )}
              {phase === "evaluating" && (
                <motion.div key="eval" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
                  <Loader2 className="w-16 h-16 text-primary mx-auto mb-6 animate-spin" />
                  <h2 className="text-xl font-semibold mb-2">AI is evaluating your answer...</h2>
                  <p className="text-muted-foreground italic max-w-md mx-auto">"{transcript}"</p>
                </motion.div>
              )}
              {phase === "complete" && (
                <motion.div key="done" initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }}>
                  <CheckCircle className="w-16 h-16 text-accent mx-auto mb-4" />
                  <h2 className="text-2xl font-bold mb-2">Technical Round Complete!</h2>
                  <p className="text-muted-foreground">Moving to HR Round...</p>
                </motion.div>
              )}
            </AnimatePresence>
          </div>

          {results.length > 0 && phase !== "complete" && (
            <div className="mt-8 space-y-4">
              {results.map((r, i) => (
                <motion.div key={i} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="glass rounded-xl p-5">
                  <div className="flex justify-between items-start mb-1">
                    <p className="text-sm text-muted-foreground font-medium">Question {i + 1}</p>
                    <span className="gradient-text font-bold text-lg">{r.score}/10</span>
                  </div>
                  <p className="text-sm text-muted-foreground">{r.feedback}</p>
                </motion.div>
              ))}
            </div>
          )}
        </motion.div>
      </div>
    </div>
  );
};

export default TechnicalRound;
