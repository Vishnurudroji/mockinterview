import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import { CheckCircle, ArrowRight } from "lucide-react";
import { useInterview } from "@/contexts/InterviewContext";
import Navbar from "@/components/Navbar";

const questions = [
  {
    q: "If a train travels 360 km in 4 hours, what is its average speed in km/h?",
    options: ["80 km/h", "90 km/h", "100 km/h", "70 km/h"],
    correct: 1,
  },
  {
    q: "A is twice as old as B. If A is 30 years old, how old will B be in 5 years?",
    options: ["15", "20", "25", "10"],
    correct: 1,
  },
  {
    q: "Complete the series: 2, 6, 18, 54, __",
    options: ["108", "162", "72", "216"],
    correct: 1,
  },
  {
    q: "If all roses are flowers and some flowers fade quickly, which statement is true?",
    options: [
      "All roses fade quickly",
      "Some roses may fade quickly",
      "No roses fade quickly",
      "All flowers are roses",
    ],
    correct: 1,
  },
  {
    q: "A shopkeeper sells an item at 20% profit. If the cost price is ₹500, what is the selling price?",
    options: ["₹550", "₹600", "₹650", "₹700"],
    correct: 1,
  },
];

const AptitudeRound = () => {
  const navigate = useNavigate();
  const { setAptitudeScore, selectedMode } = useInterview();

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
      // 🔥 Calculate final score
      const correctCount = newAnswers.reduce(
        (acc, ans, i) => acc + (ans === questions[i].correct ? 1 : 0),
        0
      );

      const percentage = Math.round(
        (correctCount / questions.length) * 100
      );

      // ✅ Store score in context
      setAptitudeScore(percentage);

      // 🔍 DEBUG LOG
      console.log("====== APTITUDE DEBUG ======");
      console.log("Correct Answers:", correctCount);
      console.log("Final Percentage:", percentage);
      console.log("============================");

      setShowResult(true);

      setTimeout(() => {
        if (selectedMode === "all") {
          console.log("Mode inside Aptitude:", selectedMode);

          navigate("/technical");
        } else {
          console.log("Mode inside Aptitude:", selectedMode);

          navigate("/results");
        }
      }, 2000);
    }
  };

  return (
    <div className="min-h-screen bg-background">
      <Navbar />
      <div className="pt-32 pb-20 px-6 max-w-2xl mx-auto">
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
          <div className="text-center mb-8">
            <h1 className="text-3xl font-bold">
              Aptitude <span className="gradient-text">Round</span>
            </h1>
            <p className="text-muted-foreground">
              Question {current + 1} of {questions.length}
            </p>
          </div>

          <AnimatePresence mode="wait">
            {showResult ? (
              <motion.div
                key="result"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                className="glass rounded-2xl p-12 text-center"
              >
                <CheckCircle className="w-16 h-16 text-accent mx-auto mb-4" />
                <h2 className="text-2xl font-bold">
                  Aptitude Round Complete!
                </h2>
                <p className="text-muted-foreground">
                  {selectedMode === "all"
                    ? "Moving to Technical Round..."
                    : "Generating your report..."}
                </p>
              </motion.div>
            ) : (
              <motion.div
                key={current}
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className="glass rounded-2xl p-8"
              >
                <h2 className="text-xl font-semibold mb-6">
                  {questions[current].q}
                </h2>

                <div className="space-y-3">
                  {questions[current].options.map((opt, i) => (
                    <button
                      key={i}
                      onClick={() => setSelected(i)}
                      className={`w-full text-left p-4 rounded-xl border ${
                        selected === i
                          ? "border-primary bg-primary/10"
                          : "border-border bg-secondary/30"
                      }`}
                    >
                      {opt}
                    </button>
                  ))}
                </div>

                <button
                  onClick={handleNext}
                  disabled={selected === null}
                  className="w-full mt-8 gradient-primary py-3.5 rounded-xl font-semibold disabled:opacity-30"
                >
                  {current < questions.length - 1
                    ? "Next Question"
                    : "Complete Round"}
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
