import { motion } from "framer-motion";
import { getRiskLevel } from "@/lib/riskCalculator";
import { t } from "@/lib/i18n";

const interpretations = {
  low: "Your child's oral health habits look great! Keep up the good routine.",
  moderate: "Some areas need attention. Small changes can make a big difference.",
  high: "Several risk factors detected. Please consult a dental professional soon.",
};

export default function AnimatedRiskBar({ score }: { score: number }) {
  const level = getRiskLevel(score);
  const levelColors = {
    low: "text-risk-low",
    moderate: "text-risk-moderate",
    high: "text-risk-high",
  };

  return (
    <div className="w-full max-w-lg space-y-4">
      {/* Score header */}
      <motion.div
        className="text-center"
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.3, duration: 0.5 }}
      >
        <motion.span
          className="text-5xl font-bold text-foreground"
          initial={{ scale: 0.5, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          transition={{ delay: 0.8, type: "spring", stiffness: 200 }}
        >
          {score}%
        </motion.span>
        <motion.p
          className={`text-lg font-semibold mt-1 ${levelColors[level]}`}
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 1.2 }}
        >
          {t.risk[level]}
        </motion.p>
      </motion.div>

      {/* Gradient bar */}
      <motion.div
        className="relative h-5 rounded-full overflow-hidden bg-muted"
        initial={{ opacity: 0, scaleX: 0.8 }}
        animate={{ opacity: 1, scaleX: 1 }}
        transition={{ delay: 0.2, duration: 0.4 }}
        style={{ transformOrigin: "left" }}
      >
        {/* Gradient background track */}
        <div
          className="absolute inset-0 rounded-full"
          style={{
            background: "linear-gradient(to right, hsl(145,65%,45%), hsl(55,95%,55%), hsl(25,95%,55%), hsl(0,80%,55%))",
          }}
        />
        {/* Mask to reveal only up to score */}
        <motion.div
          className="absolute inset-0 rounded-full bg-muted"
          initial={{ left: "0%" }}
          animate={{ left: `${score}%` }}
          transition={{ delay: 0.5, duration: 1.2, ease: [0.25, 0.1, 0.25, 1] }}
        />
        {/* Moving indicator dot */}
        <motion.div
          className="absolute top-1/2 -translate-y-1/2 w-6 h-6 rounded-full border-2 border-background shadow-lg"
          style={{
            background:
              score < 40
                ? "hsl(145,65%,45%)"
                : score < 70
                ? "hsl(45,95%,55%)"
                : "hsl(0,80%,55%)",
          }}
          initial={{ left: "0%" }}
          animate={{
            left: `calc(${score}% - 12px)`,
            boxShadow: [
              "0 0 0 0 hsla(0,0%,0%,0)",
              `0 0 12px 4px ${
                score < 40
                  ? "hsla(145,65%,45%,0.4)"
                  : score < 70
                  ? "hsla(45,95%,55%,0.4)"
                  : "hsla(0,80%,55%,0.4)"
              }`,
            ],
          }}
          transition={{
            left: { delay: 0.5, duration: 1.2, ease: [0.25, 0.1, 0.25, 1] },
            boxShadow: { delay: 1.7, duration: 1.5, repeat: Infinity, repeatType: "reverse" },
          }}
          whileHover={{ scale: 1.3 }}
          whileTap={{ scale: 0.9 }}
        />
      </motion.div>

      {/* Scale labels */}
      <div className="flex justify-between text-[10px] text-muted-foreground px-1">
        <span>0%</span>
        <span>Low</span>
        <span>Moderate</span>
        <span>High</span>
        <span>100%</span>
      </div>

      {/* Interpretation */}
      <motion.p
        className="text-sm text-muted-foreground text-center leading-relaxed"
        initial={{ opacity: 0, y: 8 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 1.8, duration: 0.5 }}
      >
        {interpretations[level]}
      </motion.p>
    </div>
  );
}
