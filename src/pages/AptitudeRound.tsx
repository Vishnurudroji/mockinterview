import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import { CheckCircle, ArrowRight } from "lucide-react";
import { useInterview } from "@/contexts/InterviewContext";
import Navbar from "@/components/Navbar";

const questions = [
  {
    q: "What is the time complexity of binary search?",
    options: ["O(n)", "O(log n)", "O(n²)", "O(1)"],
    correct: 1,
  },
  {
    q: "Which data structure uses FIFO ordering?",
    options: ["Stack", "Queue", "Tree", "Graph"],
    correct: 1,
  },
  {
    q: "What does REST stand for?",
    options: [
      "Representational State Transfer",
      "Remote Execution Service Technology",
      "Reliable Structured Transmission",
      "Real-time Event Streaming Transfer",
    ],
    correct: 0,
  },
];

const AptitudeRound = () => {
  const navigate = useNavigate();
  const { setAptitudeScore } = useInterview();
  const [current, setCurrent] = useState(0);
  const [selected, setSelected] = useState<number | null>(null);
  const [answers, setAnswers] = useState<number[]>([]);
  const [showResult, setShowResult] = useState(false);

  const handleNext = () => {
    if (selected === null) return;
    const newAnswers = [...answers, selected];
    setAnswers(newAnswers);

    if (current < questions.length - 1) {
      setCurrent(current + 1);
      setSelected(null);
    } else {
      const score = newAnswers.reduce((acc, ans, i) => acc + (ans === questions[i].correct ? 1 : 0), 0);
      setAptitudeScore(Math.round((score / questions.length) * 100));
      setShowResult(true);
      setTimeout(() => navigate("/technical"), 2000);
    }
  };

  return (
    <div className="min-h-screen bg-background">
      <Navbar />
      <div className="pt-32 pb-20 px-6 max-w-2xl mx-auto">
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}>
          <div className="text-center mb-8">
            <h1 className="text-3xl font-bold mb-2">Aptitude <span className="gradient-text">Round</span></h1>
            <p className="text-muted-foreground">Question {current + 1} of {questions.length}</p>
          </div>

          <div className="w-full h-2 bg-secondary rounded-full mb-10 overflow-hidden">
            <motion.div
              className="h-full gradient-primary rounded-full"
              animate={{ width: `${((current + (showResult ? 1 : 0)) / questions.length) * 100}%` }}
            />
          </div>

          <AnimatePresence mode="wait">
            {showResult ? (
              <motion.div key="result" initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }} className="glass rounded-2xl p-12 text-center">
                <CheckCircle className="w-16 h-16 text-accent mx-auto mb-4" />
                <h2 className="text-2xl font-bold mb-2">Round Complete!</h2>
                <p className="text-muted-foreground">Moving to Technical Round...</p>
              </motion.div>
            ) : (
              <motion.div key={current} initial={{ opacity: 0, x: 30 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -30 }} className="glass rounded-2xl p-8">
                <h2 className="text-xl font-semibold mb-6">{questions[current].q}</h2>
                <div className="space-y-3">
                  {questions[current].options.map((opt, i) => (
                    <button
                      key={i}
                      onClick={() => setSelected(i)}
                      className={`w-full text-left p-4 rounded-xl border transition-all ${
                        selected === i
                          ? "border-primary bg-primary/10 text-foreground"
                          : "border-border bg-secondary/30 text-muted-foreground hover:border-muted-foreground"
                      }`}
                    >
                      {opt}
                    </button>
                  ))}
                </div>
                <button
                  onClick={handleNext}
                  disabled={selected === null}
                  className="w-full mt-8 gradient-primary text-primary-foreground py-3.5 rounded-xl font-semibold flex items-center justify-center gap-2 disabled:opacity-30 transition-all"
                >
                  {current < questions.length - 1 ? "Next Question" : "Complete Round"}
                  <ArrowRight className="w-5 h-5" />
                </button>
              </motion.div>
            )}
          </AnimatePresence>
        </motion.div>
      </div>
    </div>
  );
};

export default AptitudeRound;
