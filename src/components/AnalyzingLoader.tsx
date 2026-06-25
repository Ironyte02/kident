import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";

const steps = [
  { label: "Reviewing dietary patterns…", icon: "🍽" },
  { label: "Analyzing oral hygiene habits…", icon: "🪥" },
  { label: "Evaluating fluoride exposure…", icon: "💧" },
  { label: "Generating risk assessment…", icon: "📊" },
];

export default function AnalyzingLoader() {
  const [step, setStep] = useState(0);

  useEffect(() => {
    const interval = setInterval(() => {
      setStep((s) => (s < steps.length - 1 ? s + 1 : s));
    }, 900);
    return () => clearInterval(interval);
  }, []);

  return (
    <div className="flex flex-col items-center justify-center py-12 space-y-6">
      {/* Pulsing ring */}
      <div className="relative">
        <motion.div
          className="w-16 h-16 rounded-full border-4 border-primary/30"
          animate={{ scale: [1, 1.3, 1], opacity: [0.6, 0.2, 0.6] }}
          transition={{ duration: 1.5, repeat: Infinity, ease: "easeInOut" }}
        />
        <motion.div
          className="absolute inset-0 flex items-center justify-center text-2xl"
          animate={{ rotate: [0, 360] }}
          transition={{ duration: 3, repeat: Infinity, ease: "linear" }}
        >
          🦷
        </motion.div>
      </div>

      {/* Step labels */}
      <div className="h-8">
        <AnimatePresence mode="wait">
          <motion.p
            key={step}
            className="text-sm text-muted-foreground text-center"
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -8 }}
            transition={{ duration: 0.3 }}
          >
            {steps[step].icon} {steps[step].label}
          </motion.p>
        </AnimatePresence>
      </div>

      {/* Step dots */}
      <div className="flex gap-2">
        {steps.map((_, i) => (
          <motion.div
            key={i}
            className="w-2 h-2 rounded-full"
            animate={{
              backgroundColor: i <= step ? "hsl(var(--primary))" : "hsl(var(--muted))",
              scale: i === step ? 1.3 : 1,
            }}
            transition={{ duration: 0.3 }}
          />
        ))}
      </div>
    </div>
  );
}
