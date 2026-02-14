import { createContext, useContext, useState, ReactNode } from "react";

interface ScoreEntry {
  question: string;
  answer: string;
  score: number;
  feedback: string;
}

interface InterviewState {
  skills: string[];
  resumeFile: string | null;
  aptitudeScore: number;
  technicalScores: ScoreEntry[];
  hrScores: ScoreEntry[];

  selectedMode: string;
  setSelectedMode: (m: string) => void;

  setSkills: (s: string[]) => void;
  setResumeFile: (f: string | null) => void;
  setAptitudeScore: (s: number) => void;
  setTechnicalScores: (s: ScoreEntry[]) => void;
  setHrScores: (s: ScoreEntry[]) => void;
}

const InterviewContext = createContext<InterviewState | null>(null);

export const useInterview = () => {
  const ctx = useContext(InterviewContext);
  if (!ctx) throw new Error("useInterview must be used within InterviewProvider");
  return ctx;
};

export const InterviewProvider = ({ children }: { children: ReactNode }) => {
  const [skills, setSkills] = useState<string[]>([]);
  const [resumeFile, setResumeFile] = useState<string | null>(null);
  const [aptitudeScore, setAptitudeScore] = useState(0);
  const [technicalScores, setTechnicalScores] = useState<ScoreEntry[]>([]);
  const [hrScores, setHrScores] = useState<ScoreEntry[]>([]);
  const [selectedMode, setSelectedMode] = useState<string>("all"); // 🔥 IMPORTANT

  return (
    <InterviewContext.Provider
      value={{
        skills,
        setSkills,
        resumeFile,
        setResumeFile,
        aptitudeScore,
        setAptitudeScore,
        technicalScores,
        setTechnicalScores,
        hrScores,
        setHrScores,
        selectedMode,
        setSelectedMode,
      }}
    >
      {children}
    </InterviewContext.Provider>
  );
};
