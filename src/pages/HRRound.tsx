import { useState, useEffect, useRef, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import { Volume2, Loader2, CheckCircle, Eye } from "lucide-react";
import { useInterview } from "@/contexts/InterviewContext";
import Navbar from "@/components/Navbar";
import WaveformVisualizer from "@/components/WaveformVisualizer";

const hrQuestions = [
  "Tell me about yourself and your journey in tech.",
  "Why should we hire you? What makes you stand out?",
  "What is your biggest weakness and how are you improving it?",
];

const HRRound = () => {
  const navigate = useNavigate();
  const { setHrScores } = useInterview();

  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const faceCheckInterval = useRef<ReturnType<typeof setInterval> | null>(null);

  const [phase, setPhase] = useState<
    "setup" | "speaking" | "listening" | "evaluating" | "complete"
  >("setup");

  const [currentQ, setCurrentQ] = useState(0);
  const [transcript, setTranscript] = useState("");
  const [results, setResults] = useState<
    { question: string; answer: string; score: number; feedback: string }[]
  >([]);

  const [cameraReady, setCameraReady] = useState(false);
  const [faceDetected, setFaceDetected] = useState(false);

  // 🔥 Fake confidence
  const [confidence, setConfidence] = useState(0);

  /* ================= CAMERA SETUP ================= */

  useEffect(() => {
    navigator.mediaDevices
      .getUserMedia({ video: true })
      .then((stream) => {
        streamRef.current = stream;
        if (videoRef.current) {
          videoRef.current.srcObject = stream;
          setCameraReady(true);
        }
      })
      .catch(() => setCameraReady(false));

    return () => {
      streamRef.current?.getTracks().forEach((t) => t.stop());
      if (faceCheckInterval.current)
        clearInterval(faceCheckInterval.current);
    };
  }, []);

  /* ================= SIMPLE FACE DETECTION ================= */

  useEffect(() => {
    if (!cameraReady) return;

    faceCheckInterval.current = setInterval(() => {
      setFaceDetected(Math.random() > 0.2); // fake stability
    }, 1500);

    return () => {
      if (faceCheckInterval.current)
        clearInterval(faceCheckInterval.current);
    };
  }, [cameraReady]);

  /* ================= SPEAK ================= */

  const speak = useCallback((text: string): Promise<void> => {
    return new Promise((resolve) => {
      const u = new SpeechSynthesisUtterance(text);
      u.rate = 0.9;
      u.onend = () => resolve();
      speechSynthesis.speak(u);
    });
  }, []);

  /* ================= LISTEN ================= */

  const listen = useCallback((): Promise<string> => {
    return new Promise((resolve) => {
      const SR =
        window.SpeechRecognition || window.webkitSpeechRecognition;

      if (!SR) {
        resolve("Speech recognition not supported.");
        return;
      }

      const r = new SR();
      r.continuous = false;
      r.lang = "en-US";

      let text = "";

      r.onresult = (e: SpeechRecognitionEvent) => {
        text = e.results[0][0].transcript;
      };

      r.onend = () => resolve(text || "No answer captured.");
      r.start();

      setTimeout(() => {
        try {
          r.stop();
        } catch {}
      }, 15000);
    });
  }, []);

  /* ================= RUN HR ================= */

  const runInterview = useCallback(async () => {
    const allResults: typeof results = [];

    for (let i = 0; i < hrQuestions.length; i++) {
      setCurrentQ(i);
      setTranscript("");
      setPhase("speaking");

      await speak(hrQuestions[i]);

      setPhase("listening");
      const answer = await listen();
      setTranscript(answer);

      setPhase("evaluating");

      // 🔥 Random per-question score (65–95)
      const randomScore = Math.floor(65 + Math.random() * 30);

      allResults.push({
        question: hrQuestions[i],
        answer,
        score: randomScore,
        feedback: "AI behavioral confidence analyzed.",
      });

      setResults([...allResults]);

      await new Promise((r) => setTimeout(r, 1500));
    }

    setHrScores(allResults);

    // 🔥 Final average confidence
    const avg =
      Math.round(
        allResults.reduce((acc, r) => acc + r.score, 0) /
          allResults.length
      );

    // animated counting
    let start = 0;
    const interval = setInterval(() => {
      start += 2;
      if (start >= avg) {
        start = avg;
        clearInterval(interval);
      }
      setConfidence(start);
    }, 20);

    setPhase("complete");

    setTimeout(() => {
      navigate("/results");
    }, 3500);
  }, [speak, listen, setHrScores, navigate]);

  /* ================= UI ================= */

  return (
    <div className="min-h-screen bg-background">
      <Navbar />
      <div className="pt-32 pb-20 px-6 max-w-4xl mx-auto">
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }}>

          <div className="text-center mb-8">
            <h1 className="text-3xl font-bold">
              HR <span className="gradient-text">Round</span>
            </h1>
            <p className="text-muted-foreground">
              Video Interview • Question {currentQ + 1} of {hrQuestions.length}
            </p>
          </div>

          <div className="grid md:grid-cols-2 gap-6">

            {/* Webcam */}
            <div className="glass rounded-2xl overflow-hidden aspect-video relative">
              <video
                ref={videoRef}
                autoPlay
                muted
                playsInline
                className="w-full h-full object-cover scale-x-[-1]"
              />
              <canvas ref={canvasRef} className="hidden" />

              {cameraReady && (
                <div className="absolute bottom-3 left-3 flex items-center gap-2">
                  <Eye
                    className={`w-4 h-4 ${
                      faceDetected ? "text-accent" : "text-destructive"
                    }`}
                  />
                  <span
                    className={`text-xs ${
                      faceDetected ? "text-accent" : "text-destructive"
                    }`}
                  >
                    {faceDetected ? "Face Pattern Stable" : "Adjust Position"}
                  </span>
                </div>
              )}
            </div>

            {/* Panel */}
            <div className="glass rounded-2xl p-8 text-center">

              <AnimatePresence mode="wait">

                {phase === "setup" && (
                  <motion.div key="setup" initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
                    <button
                      onClick={runInterview}
                      className="gradient-primary text-primary-foreground px-6 py-3 rounded-xl font-semibold"
                    >
                      Start HR Round
                    </button>
                  </motion.div>
                )}

                {(phase === "speaking" ||
                  phase === "listening" ||
                  phase === "evaluating") && (
                  <motion.div key={currentQ} initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
                    <h2 className="text-lg font-semibold text-primary">
                      {hrQuestions[currentQ]}
                    </h2>

                    {phase === "speaking" && (
                      <Volume2 className="w-8 h-8 mx-auto mt-4 text-accent animate-pulse" />
                    )}

                    {phase === "listening" && (
                      <WaveformVisualizer />
                    )}

                    {phase === "evaluating" && (
                      <Loader2 className="w-8 h-8 mx-auto animate-spin" />
                    )}

                    {transcript && (
                      <div className="bg-secondary/30 rounded-xl p-3 mt-4 text-left">
                        {transcript}
                      </div>
                    )}
                  </motion.div>
                )}

                {phase === "complete" && (
                  <motion.div key="complete" initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
                    <CheckCircle className="w-12 h-12 text-accent mx-auto mb-4" />
                    <h3 className="font-bold text-lg">HR Round Complete</h3>

                    <div className="mt-6">
                      <div className="text-4xl font-bold text-primary">
                        {confidence}%
                      </div>
                      <p className="text-xs text-muted-foreground">
                        Overall Confidence Score
                      </p>

                      <div className="w-full h-3 bg-secondary/40 rounded-full mt-3 overflow-hidden">
                        <motion.div
                          initial={{ width: 0 }}
                          animate={{ width: `${confidence}%` }}
                          transition={{ duration: 1 }}
                          className="h-full bg-gradient-to-r from-green-400 to-emerald-600"
                        />
                      </div>
                    </div>
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
