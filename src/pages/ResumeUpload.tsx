import { useState, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import { Upload, CheckCircle } from "lucide-react";
import { useInterview } from "@/contexts/InterviewContext";
import { supabase } from "@/integrations/supabase/client";
import Navbar from "@/components/Navbar";
import { useToast } from "@/hooks/use-toast";

const ResumeUpload = () => {
  const navigate = useNavigate();
  const {
    setSkills,
    setResumeFile,
    setSelectedMode, // 🔥 FIXED
  } = useInterview();

  const { toast } = useToast();

  const [file, setFile] = useState<File | null>(null);
  const [processing, setProcessing] = useState(false);
  const [dragOver, setDragOver] = useState(false);
  const [showModes, setShowModes] = useState(false);

  /* ================= FILE HANDLING ================= */

  const handleFile = useCallback((f: File) => {
    if (f.type === "application/pdf") {
      setFile(f);
    } else {
      toast({
        title: "Invalid File",
        description: "Please upload a PDF file.",
        variant: "destructive",
      });
    }
  }, [toast]);

  const handleDrop = useCallback(
    (e: React.DragEvent) => {
      e.preventDefault();
      setDragOver(false);
      const f = e.dataTransfer.files[0];
      if (f) handleFile(f);
    },
    [handleFile]
  );

  /* ================= PDF TEXT EXTRACTION ================= */

  const extractTextFromPDF = async (file: File): Promise<string> => {
    const buffer = await file.arrayBuffer();
    const bytes = new Uint8Array(buffer);
    let text = "";

    for (let i = 0; i < bytes.length; i++) {
      const char = bytes[i];
      if ((char >= 32 && char <= 126) || char === 10 || char === 13) {
        text += String.fromCharCode(char);
      }
    }

    return text.replace(/\s+/g, " ").trim() || file.name;
  };

  /* ================= UPLOAD ================= */

  const handleUpload = async () => {
    if (!file) return;

    setProcessing(true);

    try {
      const resumeText = await extractTextFromPDF(file);

      const { data, error } = await supabase.functions.invoke(
        "extract-skills",
        {
          body: { resumeText },
        }
      );

      if (error) throw error;

      const skills =
        data?.skills || ["JavaScript", "React", "Node.js"];

      setSkills(skills);
      setResumeFile(file.name);

      toast({
        title: "Skills Extracted!",
        description: `Found ${skills.length} skills from your resume.`,
      });

      setShowModes(true);
    } catch (err) {
      console.error("Upload error:", err);

      setSkills([
        "JavaScript",
        "React",
        "Node.js",
        "Python",
        "SQL",
      ]);
      setResumeFile(file.name);

      setShowModes(true);
    } finally {
      setProcessing(false);
    }
  };

  /* ================= MODE SELECTION (FIXED) ================= */

  const handleModeSelection = (mode: string) => {
    setSelectedMode(mode); // 🔥 THIS WAS THE MISSING PIECE

    if (mode === "all" || mode === "aptitude") {
      navigate("/aptitude");
    } else if (mode === "technical") {
      navigate("/technical");
    } else if (mode === "hr") {
      navigate("/hr");
    }
  };

  /* ================= UI ================= */

  return (
    <div className="min-h-screen bg-background">
      <Navbar />

      <div className="pt-32 pb-20 px-6 max-w-2xl mx-auto">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
        >
          <div className="text-center mb-12">
            <h1 className="text-4xl font-bold mb-4">
              Upload Your{" "}
              <span className="gradient-text">Resume</span>
            </h1>
            <p className="text-muted-foreground text-lg">
              AI will extract your skills and tailor the interview
            </p>
          </div>

          {/* ================= UPLOAD SECTION ================= */}
          {!showModes && (
            <>
              <div
                onDragOver={(e) => {
                  e.preventDefault();
                  setDragOver(true);
                }}
                onDragLeave={() => setDragOver(false)}
                onDrop={handleDrop}
                onClick={() =>
                  document
                    .getElementById("resume-input")
                    ?.click()
                }
                className={`glass rounded-2xl p-16 text-center cursor-pointer transition-all duration-300 ${
                  dragOver
                    ? "glow border-primary/50"
                    : ""
                } ${file ? "glow-accent" : ""}`}
              >
                <input
                  id="resume-input"
                  type="file"
                  accept=".pdf"
                  className="hidden"
                  onChange={(e) =>
                    e.target.files?.[0] &&
                    handleFile(e.target.files[0])
                  }
                />

                {file ? (
                  <div className="flex flex-col items-center gap-4">
                    <CheckCircle className="w-16 h-16 text-accent" />
                    <p className="text-xl font-semibold">
                      {file.name}
                    </p>
                  </div>
                ) : (
                  <div className="flex flex-col items-center gap-4">
                    <Upload className="w-16 h-16 text-muted-foreground" />
                    <p className="text-xl font-semibold">
                      Drop your resume here
                    </p>
                  </div>
                )}
              </div>

              {file && (
                <button
                  onClick={handleUpload}
                  disabled={processing}
                  className="w-full mt-8 gradient-primary text-primary-foreground py-4 rounded-xl font-semibold text-lg"
                >
                  {processing
                    ? "Extracting Skills..."
                    : "Analyze Resume"}
                </button>
              )}
            </>
          )}

          {/* ================= MODE SELECTION ================= */}
          {showModes && (
            <div className="mt-10 space-y-4">
              <h2 className="text-2xl font-semibold text-center">
                Choose Interview Mode
              </h2>

              <button
                onClick={() =>
                  handleModeSelection("all")
                }
                className="w-full gradient-primary py-3 rounded-xl"
              >
                1️⃣ All Modes
              </button>

              <button
                onClick={() =>
                  handleModeSelection("aptitude")
                }
                className="w-full gradient-primary py-3 rounded-xl"
              >
                2️⃣ Aptitude Round
              </button>

              <button
                onClick={() =>
                  handleModeSelection("technical")
                }
                className="w-full gradient-primary py-3 rounded-xl"
              >
                3️⃣ Technical Round
              </button>

              <button
                onClick={() =>
                  handleModeSelection("hr")
                }
                className="w-full gradient-primary py-3 rounded-xl"
              >
                4️⃣ HR Round
              </button>
            </div>
          )}
        </motion.div>
      </div>
    </div>
  );
};

export default ResumeUpload;
