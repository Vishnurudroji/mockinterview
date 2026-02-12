import { motion } from "framer-motion";
import { useNavigate } from "react-router-dom";
import { FileText, Brain, Mic, Video, ArrowRight, Sparkles } from "lucide-react";
import Navbar from "@/components/Navbar";
import heroBg from "@/assets/hero-bg.jpg";

const steps = [
  { icon: FileText, title: "Upload Resume", desc: "Drop your PDF and let AI extract your skills automatically" },
  { icon: Brain, title: "Aptitude Round", desc: "Quick assessment of your logical reasoning ability" },
  { icon: Mic, title: "Technical Round", desc: "AI-powered voice interview tailored to your skills" },
  { icon: Video, title: "HR Round", desc: "Video-based behavioral assessment with AI evaluation" },
];

const Index = () => {
  const navigate = useNavigate();

  return (
    <div className="min-h-screen bg-background">
      <Navbar />

      {/* Hero */}
      <section className="relative min-h-screen flex items-center justify-center overflow-hidden">
        <div className="absolute inset-0">
          <img src={heroBg} alt="" className="w-full h-full object-cover opacity-30" />
          <div className="absolute inset-0 bg-background/60" />
        </div>
        <div className="absolute top-1/4 left-1/4 w-[500px] h-[500px] bg-primary/8 rounded-full blur-[150px]" />
        <div className="absolute bottom-1/4 right-1/4 w-[400px] h-[400px] bg-accent/8 rounded-full blur-[120px]" />

        <div className="relative z-10 text-center px-6 max-w-4xl mx-auto">
          <motion.div initial={{ opacity: 0, y: 40 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.9 }}>
            <div className="inline-flex items-center gap-2 glass px-4 py-2 rounded-full mb-8">
              <Sparkles className="w-4 h-4 text-primary" />
              <span className="text-sm text-muted-foreground">AI-Powered Interview Platform</span>
            </div>
            <h1 className="text-5xl md:text-7xl font-extrabold leading-tight mb-6 tracking-tight">
              Experience the Future of{" "}
              <span className="gradient-text">Intelligent</span>{" "}
              Interviews
            </h1>
            <p className="text-xl text-muted-foreground max-w-2xl mx-auto mb-10 leading-relaxed">
              AI-powered voice-based interview simulation personalized to your resume.
              Practice, improve, and ace your next interview.
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <button
                onClick={() => navigate("/upload")}
                className="gradient-primary text-primary-foreground px-8 py-4 rounded-xl font-semibold text-lg flex items-center justify-center gap-2 hover:opacity-90 transition-all glow"
              >
                Start Interview <ArrowRight className="w-5 h-5" />
              </button>
              <a
                href="#process"
                className="glass px-8 py-4 rounded-xl font-semibold text-lg text-foreground hover:bg-secondary/50 transition-all text-center"
              >
                See How It Works
              </a>
            </div>
          </motion.div>
        </div>

        <motion.div
          className="absolute bottom-8 left-1/2 -translate-x-1/2"
          animate={{ y: [0, 10, 0] }}
          transition={{ duration: 2, repeat: Infinity }}
        >
          <div className="w-6 h-10 border-2 border-muted-foreground/30 rounded-full flex justify-center pt-2">
            <div className="w-1.5 h-3 bg-primary rounded-full" />
          </div>
        </motion.div>
      </section>

      {/* Why InterviewOS */}
      <section className="py-24 px-6">
        <div className="max-w-6xl mx-auto">
          <motion.div initial={{ opacity: 0 }} whileInView={{ opacity: 1 }} viewport={{ once: true }} className="text-center mb-16">
            <h2 className="text-4xl font-bold mb-4">Why <span className="gradient-text">InterviewOS</span>?</h2>
            <p className="text-muted-foreground text-lg max-w-2xl mx-auto">
              Unlike other platforms with predefined questions and no personalization,
              InterviewOS uses real AI to create a unique interview experience based on your resume.
            </p>
          </motion.div>
          <div className="grid md:grid-cols-3 gap-6">
            {[
              { title: "Personalized Questions", desc: "AI reads your resume and generates questions specific to your skills and experience." },
              { title: "Real-time Evaluation", desc: "Get instant AI feedback on your answers with detailed scoring and improvement tips." },
              { title: "Voice & Video", desc: "Practice with natural speech recognition and webcam-based HR simulation." },
            ].map((item, i) => (
              <motion.div
                key={i}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: i * 0.1 }}
                className="glass rounded-2xl p-8"
              >
                <h3 className="text-xl font-bold mb-3">{item.title}</h3>
                <p className="text-muted-foreground leading-relaxed">{item.desc}</p>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* Process */}
      <section id="process" className="py-24 px-6 relative">
        <div className="absolute inset-0 bg-secondary/20" />
        <div className="max-w-6xl mx-auto relative">
          <motion.div initial={{ opacity: 0 }} whileInView={{ opacity: 1 }} viewport={{ once: true }} className="text-center mb-16">
            <h2 className="text-4xl font-bold mb-4">How It <span className="gradient-text">Works</span></h2>
            <p className="text-muted-foreground text-lg">Four steps to your AI-powered interview experience</p>
          </motion.div>

          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6">
            {steps.map((step, i) => (
              <motion.div
                key={i}
                initial={{ opacity: 0, y: 30 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: i * 0.15 }}
                className="glass rounded-2xl p-8 group hover:glow transition-all duration-500"
              >
                <div className="w-14 h-14 gradient-primary rounded-xl flex items-center justify-center mb-6 group-hover:scale-110 transition-transform">
                  <step.icon className="w-7 h-7 text-primary-foreground" />
                </div>
                <div className="text-sm text-primary font-semibold mb-2">Step {i + 1}</div>
                <h3 className="text-xl font-bold mb-2">{step.title}</h3>
                <p className="text-muted-foreground text-sm leading-relaxed">{step.desc}</p>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="py-24 px-6">
        <div className="max-w-3xl mx-auto text-center">
          <motion.div initial={{ opacity: 0, y: 20 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }}>
            <h2 className="text-4xl font-bold mb-6">Ready to Ace Your Next Interview?</h2>
            <p className="text-muted-foreground text-lg mb-10">
              Start your AI-powered interview simulation now. It only takes a few minutes.
            </p>
            <button
              onClick={() => navigate("/upload")}
              className="gradient-primary text-primary-foreground px-10 py-4 rounded-xl font-semibold text-lg inline-flex items-center gap-2 hover:opacity-90 transition-all glow"
            >
              Start Interview <ArrowRight className="w-5 h-5" />
            </button>
          </motion.div>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t border-border py-10 px-6">
        <div className="max-w-6xl mx-auto flex flex-col md:flex-row justify-between items-center gap-4">
          <span className="text-xl font-bold gradient-text">InterviewOS</span>
          <p className="text-muted-foreground text-sm">© 2026 InterviewOS. AI-Powered Interview Simulation Platform.</p>
        </div>
      </footer>
    </div>
  );
};

export default Index;
