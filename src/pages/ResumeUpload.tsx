import { useState, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import { Upload, FileText, CheckCircle, Loader2 } from "lucide-react";
import { useInterview } from "@/contexts/InterviewContext";
import { supabase } from "@/integrations/supabase/client";
import Navbar from "@/components/Navbar";
import { useToast } from "@/hooks/use-toast";

const ResumeUpload = () => {
  const navigate = useNavigate();
  const { setSkills, setResumeFile } = useInterview();
  const { toast } = useToast();
  const [file, setFile] = useState<File | null>(null);
  const [processing, setProcessing] = useState(false);
  const [dragOver, setDragOver] = useState(false);

  const handleFile = useCallback((f: File) => {
    if (f.type === "application/pdf") setFile(f);
  }, []);

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setDragOver(false);
    const f = e.dataTransfer.files[0];
    if (f) handleFile(f);
  }, [handleFile]);

  const extractTextFromPDF = async (file: File): Promise<string> => {
    // Read file as array buffer and extract basic text
    const buffer = await file.arrayBuffer();
    const bytes = new Uint8Array(buffer);
    let text = "";
    for (let i = 0; i < bytes.length; i++) {
      const char = bytes[i];
      if ((char >= 32 && char <= 126) || char === 10 || char === 13) {
        text += String.fromCharCode(char);
      }
    }
    // Clean up PDF artifacts and extract readable content
    const cleaned = text
      .replace(/\/[A-Z][a-zA-Z]*\s*/g, " ")
      .replace(/\d+ \d+ obj/g, " ")
      .replace(/endobj/g, " ")
      .replace(/stream[\s\S]*?endstream/g, " ")
      .replace(/<<[\s\S]*?>>/g, " ")
      .replace(/\s+/g, " ")
      .trim();
    return cleaned || file.name;
  };

  const handleUpload = async () => {
    if (!file) return;
    setProcessing(true);
    try {
      const resumeText = await extractTextFromPDF(file);
      
      const { data, error } = await supabase.functions.invoke("extract-skills", {
        body: { resumeText },
      });

      if (error) throw error;

      const skills = data.skills || ["JavaScript", "React", "Node.js"];
      setSkills(skills);
      setResumeFile(file.name);
      toast({ title: "Skills Extracted!", description: `Found ${skills.length} skills from your resume.` });
      navigate("/aptitude");
    } catch (err) {
      console.error("Upload error:", err);
      toast({ title: "Error", description: "Failed to extract skills. Using defaults.", variant: "destructive" });
      setSkills(["JavaScript", "React", "Node.js", "Python", "SQL"]);
      setResumeFile(file.name);
      navigate("/aptitude");
    } finally {
      setProcessing(false);
    }
  };

  return (
    <div className="min-h-screen bg-background">
      <Navbar />
      <div className="pt-32 pb-20 px-6 max-w-2xl mx-auto">
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}>
          <div className="text-center mb-12">
            <h1 className="text-4xl font-bold mb-4">Upload Your <span className="gradient-text">Resume</span></h1>
            <p className="text-muted-foreground text-lg">AI will extract your skills and tailor the interview</p>
          </div>

          <div
            onDragOver={(e) => { e.preventDefault(); setDragOver(true); }}
            onDragLeave={() => setDragOver(false)}
            onDrop={handleDrop}
            onClick={() => document.getElementById("resume-input")?.click()}
            className={`glass rounded-2xl p-16 text-center cursor-pointer transition-all duration-300 ${
              dragOver ? "glow border-primary/50" : ""
            } ${file ? "glow-accent" : ""}`}
          >
            <input
              id="resume-input"
              type="file"
              accept=".pdf"
              className="hidden"
              onChange={(e) => e.target.files?.[0] && handleFile(e.target.files[0])}
            />
            {file ? (
              <div className="flex flex-col items-center gap-4">
                <CheckCircle className="w-16 h-16 text-accent" />
                <p className="text-xl font-semibold">{file.name}</p>
                <p className="text-muted-foreground">{(file.size / 1024).toFixed(1)} KB</p>
              </div>
            ) : (
              <div className="flex flex-col items-center gap-4">
                <Upload className="w-16 h-16 text-muted-foreground" />
                <p className="text-xl font-semibold">Drop your resume here</p>
                <p className="text-muted-foreground">or click to browse (PDF only)</p>
              </div>
            )}
          </div>

          {file && (
            <motion.button
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              onClick={handleUpload}
              disabled={processing}
              className="w-full mt-8 gradient-primary text-primary-foreground py-4 rounded-xl font-semibold text-lg flex items-center justify-center gap-2 hover:opacity-90 transition-all glow disabled:opacity-50"
            >
              {processing ? (
                <><Loader2 className="w-5 h-5 animate-spin" /> Extracting Skills with AI...</>
              ) : (
                <><FileText className="w-5 h-5" /> Analyze Resume</>
              )}
            </motion.button>
          )}
        </motion.div>
      </div>
    </div>
  );
};

export default ResumeUpload;
