import { useState, useEffect, useRef, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import { Video, Volume2, Loader2, CheckCircle } from "lucide-react";
import { useInterview } from "@/contexts/InterviewContext";
import Navbar from "@/components/Navbar";
import WaveformVisualizer from "@/components/WaveformVisualizer";

const hrQuestions = [
  "Tell me about yourself and your journey in tech.",
  "Why should we hire you? What makes you stand out?",
  "What is your biggest weakness and how are you working on it?",
];

const hrFeedbacks = [
  "Good self-presentation with clear communication and confidence.",
  "Confident delivery highlighting relevant strengths effectively.",
  "Honest self-reflection demonstrating a growth mindset.",
];

const HRRound = () => {
  const navigate = useNavigate();
  const { setHrScores } = useInterview();
  const videoRef = useRef<HTMLVideoElement>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const [phase, setPhase] = useState<"setup" | "speaking" | "listening" | "evaluating" | "complete">("setup");
  const [currentQ, setCurrentQ] = useState(0);
  const [results, setResults] = useState<{ question: string; answer: string; score: number; feedback: string }[]>([]);
  const [cameraReady, setCameraReady] = useState(false);

  useEffect(() => {
    navigator.mediaDevices.getUserMedia({ video: true, audio: false })
      .then(stream => {
        streamRef.current = stream;
        if (videoRef.current) {
          videoRef.current.srcObject = stream;
          setCameraReady(true);
        }
      })
      .catch(() => setCameraReady(false));

    return () => {
      streamRef.current?.getTracks().forEach(t => t.stop());
    };
  }, []);

  const speak = useCallback((text: string): Promise<void> => {
    return new Promise(resolve => {
      if (!window.speechSynthesis) { resolve(); return; }
      const u = new SpeechSynthesisUtterance(text);
      u.rate = 0.9;
      u.onend = () => resolve();
      u.onerror = () => resolve();
      speechSynthesis.speak(u);
    });
  }, []);

  const listen = useCallback((): Promise<string> => {
    return new Promise(resolve => {
      const SR = window.SpeechRecognition || window.webkitSpeechRecognition;
      if (!SR) { resolve("Speech recognition not available."); return; }
      const r = new SR();
      r.continuous = false;
      r.lang = "en-US";
      let text = "";
      r.onresult = (e: SpeechRecognitionEvent) => { text = e.results[0][0].transcript; };
      r.onend = () => resolve(text || "No answer captured.");
      r.onerror = () => resolve("Error capturing audio.");
      r.start();
      setTimeout(() => { try { r.stop(); } catch {} }, 20000);
    });
  }, []);

  const runInterview = useCallback(async () => {
    const allResults: typeof results = [];
    for (let i = 0; i < hrQuestions.length; i++) {
      setCurrentQ(i);
      setPhase("speaking");
      await speak(hrQuestions[i]);

      setPhase("listening");
      const answer = await listen();

      setPhase("evaluating");
      await new Promise(r => setTimeout(r, 2000));

      const score = Math.floor(Math.random() * 2) + 7;
      allResults.push({ question: hrQuestions[i], answer, score, feedback: hrFeedbacks[i] });
      setResults([...allResults]);

      if (i < hrQuestions.length - 1) {
        await new Promise(r => setTimeout(r, 2000));
      }
    }
    setHrScores(allResults);
    setPhase("complete");
    setTimeout(() => navigate("/results"), 2500);
  }, [speak, listen, setHrScores, navigate]);

  return (
    <div className="min-h-screen bg-background">
      <Navbar />
      <div className="pt-32 pb-20 px-6 max-w-4xl mx-auto">
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}>
          <div className="text-center mb-8">
            <h1 className="text-3xl font-bold mb-2">HR <span className="gradient-text">Round</span></h1>
            <p className="text-muted-foreground">Video Interview • Question {currentQ + 1} of {hrQuestions.length}</p>
          </div>

          <div className="grid md:grid-cols-2 gap-6">
            {/* Webcam */}
            <div className="glass rounded-2xl overflow-hidden aspect-video relative">
              <video ref={videoRef} autoPlay muted playsInline className="w-full h-full object-cover scale-x-[-1]" />
              {!cameraReady && (
                <div className="absolute inset-0 flex flex-col items-center justify-center bg-secondary/50">
                  <Video className="w-12 h-12 text-muted-foreground mb-2" />
                  <p className="text-sm text-muted-foreground">Camera not available</p>
                </div>
              )}
              {cameraReady && (
                <div className="absolute top-3 right-3 flex items-center gap-2">
                  <div className="w-3 h-3 rounded-full bg-destructive animate-pulse" />
                  <span className="text-xs text-destructive font-medium">LIVE</span>
                </div>
              )}
            </div>

            {/* Status Panel */}
            <div className="glass rounded-2xl p-8 flex flex-col items-center justify-center text-center min-h-[240px]">
              <AnimatePresence mode="wait">
                {phase === "setup" && (
                  <motion.div key="setup" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
                    <Video className="w-12 h-12 text-primary mx-auto mb-4" />
                    <h3 className="font-semibold mb-2">Camera is {cameraReady ? "ready" : "loading..."}</h3>
                    <p className="text-sm text-muted-foreground mb-6">AI will ask HR questions. Answer naturally.</p>
                    <button
                      onClick={runInterview}
                      className="gradient-primary text-primary-foreground px-6 py-3 rounded-xl font-semibold hover:opacity-90 transition-all glow disabled:opacity-30"
                    >
                      Start HR Round
                    </button>
                  </motion.div>
                )}
                {phase === "speaking" && (
                  <motion.div key="speaking" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
                    <Volume2 className="w-12 h-12 text-primary mx-auto mb-4 animate-pulse" />
                    <h3 className="font-semibold mb-2">Interviewer is asking...</h3>
                    <p className="text-muted-foreground text-sm">{hrQuestions[currentQ]}</p>
                  </motion.div>
                )}
                {phase === "listening" && (
                  <motion.div key="listening" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
                    <WaveformVisualizer />
                    <p className="text-muted-foreground mt-4 text-sm">Listening to your answer...</p>
                  </motion.div>
                )}
                {phase === "evaluating" && (
                  <motion.div key="eval" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
                    <Loader2 className="w-12 h-12 text-primary mx-auto mb-4 animate-spin" />
                    <p className="text-muted-foreground">Evaluating response...</p>
                  </motion.div>
                )}
                {phase === "complete" && (
                  <motion.div key="done" initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }}>
                    <CheckCircle className="w-12 h-12 text-accent mx-auto mb-4" />
                    <h3 className="font-bold text-lg">HR Round Complete!</h3>
                    <p className="text-muted-foreground text-sm">Generating your report...</p>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          </div>
        </motion.div>
      </div>
    </div>
  );
};

export default HRRound;
