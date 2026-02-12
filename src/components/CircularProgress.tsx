import { useId } from "react";
import { motion } from "framer-motion";

interface CircularProgressProps {
  value: number;
  size?: number;
}

const CircularProgress = ({ value, size = 120 }: CircularProgressProps) => {
  const id = useId();
  const strokeWidth = Math.max(size * 0.08, 4);
  const radius = (size - strokeWidth) / 2;
  const circumference = 2 * Math.PI * radius;
  const offset = circumference - (value / 100) * circumference;

  return (
    <div className="relative inline-flex items-center justify-center" style={{ width: size, height: size }}>
      <svg width={size} height={size} className="-rotate-90">
        <circle
          cx={size / 2} cy={size / 2} r={radius}
          fill="none" stroke="hsl(var(--secondary))" strokeWidth={strokeWidth}
        />
        <motion.circle
          cx={size / 2} cy={size / 2} r={radius}
          fill="none" stroke={`url(#${id})`}
          strokeWidth={strokeWidth} strokeLinecap="round"
          strokeDasharray={circumference}
          initial={{ strokeDashoffset: circumference }}
          animate={{ strokeDashoffset: offset }}
          transition={{ duration: 1.5, ease: "easeOut" }}
        />
        <defs>
          <linearGradient id={id} x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor="hsl(190, 95%, 50%)" />
            <stop offset="100%" stopColor="hsl(160, 80%, 42%)" />
          </linearGradient>
        </defs>
      </svg>
      <div className="absolute font-bold gradient-text" style={{ fontSize: size * 0.22 }}>
        {value}%
      </div>
    </div>
  );
};

export default CircularProgress;
