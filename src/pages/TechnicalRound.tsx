import { useState, useMemo, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import { Mic, Volume2, Loader2, CheckCircle } from "lucide-react";
import { useInterview } from "@/contexts/InterviewContext";
import Navbar from "@/components/Navbar";
import WaveformVisualizer from "@/components/WaveformVisualizer";

const feedbacks = [
  "Strong understanding demonstrated with good practical examples.",
  "Clear explanation with solid technical depth and structure.",
  "Well-structured answer showing real-world experience and knowledge.",
];

const TechnicalRound = () => {
  const navigate = useNavigate();
  const { skills, setTechnicalScores } = useInterview();
  const [phase, setPhase] = useState<"intro" | "speaking" | "listening" | "evaluating" | "complete">("intro");
  const [currentQ, setCurrentQ] = useState(0);
  const [transcript, setTranscript] = useState("");
  const [results, setResults] = useState<{ question: string; answer: string; score: number; feedback: string }[]>([]);

  const questions = useMemo(() => [
    `Explain how ${skills[0] || "React"} handles state management and what patterns you prefer.`,
    `Describe a challenging project where you used ${skills[1] || "TypeScript"} and how you solved a key problem.`,
    `How would you design a scalable API using ${skills[2] || "Node.js"}? Walk me through your approach.`,
  ], [skills]);

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
      if (!SR) { resolve("Speech recognition not supported. This is a text placeholder answer."); return; }
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
      await new Promise(r => setTimeout(r, 2000));

      const score = Math.floor(Math.random() * 3) + 7;
      allResults.push({ question: questions[i], answer, score, feedback: feedbacks[i] });
      setResults([...allResults]);

      if (i < questions.length - 1) {
        await new Promise(r => setTimeout(r, 2000));
      }
    }
    setTechnicalScores(allResults);
    setPhase("complete");
    setTimeout(() => navigate("/hr"), 2500);
  }, [questions, speak, listen, setTechnicalScores, navigate]);

  return (
    <div className="min-h-screen bg-background">
      <Navbar />
      <div className="pt-32 pb-20 px-6 max-w-2xl mx-auto">
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}>
          <div className="text-center mb-8">
            <h1 className="text-3xl font-bold mb-2">Technical <span className="gradient-text">Round</span></h1>
            <p className="text-muted-foreground">AI Voice Interview • Question {currentQ + 1} of {questions.length}</p>
          </div>

          <div className="w-full h-2 bg-secondary rounded-full mb-10 overflow-hidden">
            <motion.div className="h-full gradient-primary rounded-full" animate={{ width: `${((currentQ + (phase === "complete" ? 1 : 0)) / questions.length) * 100}%` }} />
          </div>

          <div className="glass rounded-2xl p-10 text-center min-h-[280px] flex items-center justify-center">
            <AnimatePresence mode="wait">
              {phase === "intro" && (
                <motion.div key="intro" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
                  <Mic className="w-16 h-16 text-primary mx-auto mb-6" />
                  <h2 className="text-xl font-semibold mb-4">Ready for your technical interview?</h2>
                  <p className="text-muted-foreground mb-8">AI will ask questions based on your resume skills. Speak your answers clearly.</p>
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
                  <h2 className="text-xl font-semibold mb-2">Evaluating your answer...</h2>
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
