import { motion } from "framer-motion";

const WaveformVisualizer = () => {
  const bars = Array.from({ length: 24 }, (_, i) => i);

  return (
    <div className="flex items-center justify-center gap-[3px] h-16">
      {bars.map((i) => (
        <motion.div
          key={i}
          className="w-1 rounded-full gradient-primary"
          animate={{
            height: [6, Math.random() * 48 + 12, 6],
          }}
          transition={{
            duration: 0.4 + Math.random() * 0.6,
            repeat: Infinity,
            repeatType: "reverse",
            delay: i * 0.04,
          }}
        />
      ))}
    </div>
  );
};

export default WaveformVisualizer;
