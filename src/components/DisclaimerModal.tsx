import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { ShieldAlert } from "lucide-react";

interface Props {
  open: boolean;
  onAccept: () => void;
}

export default function DisclaimerModal({ open, onAccept }: Props) {
  const [checked, setChecked] = useState(false);

  return (
    <AnimatePresence>
      {open && (
        <motion.div
          className="fixed inset-0 z-50 flex items-end sm:items-center justify-center"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
        >
          <motion.div
            className="absolute inset-0 bg-foreground/40 backdrop-blur-sm"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
          />

          <motion.div
            className="relative z-10 w-full max-w-md mx-4 bg-card rounded-t-2xl sm:rounded-2xl shadow-2xl p-6 border"
            initial={{ y: 100, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            exit={{ y: 100, opacity: 0 }}
            transition={{ type: "spring", damping: 25, stiffness: 300 }}
          >
            <div className="flex items-center gap-3 mb-4">
              <div className="p-2 rounded-full bg-risk-moderate/20">
                <ShieldAlert className="w-6 h-6 text-risk-moderate" />
              </div>
              <h2 className="text-lg font-bold text-foreground">
                Important Notice
              </h2>
            </div>

            <div className="space-y-3 text-sm text-muted-foreground leading-relaxed">
              <p>
                This tool provides an <strong className="text-foreground">AI-based screening assessment</strong> of
                early childhood caries (ECC) risk. It is <strong className="text-foreground">not a medical diagnosis</strong>.
              </p>
              <p>
                Results are for informational and research purposes only. Always consult a qualified dental
                professional for clinical evaluation and treatment advice.
              </p>
            </div>

            <label className="flex items-start gap-3 mt-5 cursor-pointer">
              <Checkbox
                checked={checked}
                onCheckedChange={(v) => setChecked(!!v)}
                className="mt-0.5"
              />
              <span className="text-sm text-foreground leading-snug">
                I understand this is a screening tool, not a diagnosis, and I will consult a dentist for clinical advice.
              </span>
            </label>

            <Button
              className="w-full mt-5"
              disabled={!checked}
              onClick={onAccept}
            >
              I Understand — View Results
            </Button>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
