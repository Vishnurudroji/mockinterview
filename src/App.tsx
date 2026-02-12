import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { InterviewProvider } from "@/contexts/InterviewContext";
import Index from "./pages/Index";
import ResumeUpload from "./pages/ResumeUpload";
import AptitudeRound from "./pages/AptitudeRound";
import TechnicalRound from "./pages/TechnicalRound";
import HRRound from "./pages/HRRound";
import Results from "./pages/Results";
import NotFound from "./pages/NotFound";

const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <InterviewProvider>
        <Toaster />
        <Sonner />
        <BrowserRouter>
          <Routes>
            <Route path="/" element={<Index />} />
            <Route path="/upload" element={<ResumeUpload />} />
            <Route path="/aptitude" element={<AptitudeRound />} />
            <Route path="/technical" element={<TechnicalRound />} />
            <Route path="/hr" element={<HRRound />} />
            <Route path="/results" element={<Results />} />
            <Route path="*" element={<NotFound />} />
          </Routes>
        </BrowserRouter>
      </InterviewProvider>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;
