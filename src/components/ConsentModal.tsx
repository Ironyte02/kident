import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { ShieldCheck } from "lucide-react";
import { Link } from "react-router-dom";

interface Props {
  open: boolean;
  onConsent: () => void;
  onCancel: () => void;
}

export default function ConsentModal({ open, onConsent, onCancel }: Props) {
  const [parentConfirm, setParentConfirm] = useState(false);
  const [dataConsent, setDataConsent] = useState(false);

  const allChecked = parentConfirm && dataConsent;

  return (
    <AnimatePresence>
      {open && (
        <motion.div
          className="fixed inset-0 z-50 flex items-center justify-center p-4"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
        >
          <motion.div
            className="absolute inset-0 bg-foreground/40 backdrop-blur-sm"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onCancel}
          />
          <motion.div
            className="relative z-10 w-full max-w-md bg-card rounded-2xl shadow-2xl p-6 border"
            initial={{ scale: 0.9, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            exit={{ scale: 0.9, opacity: 0 }}
            transition={{ type: "spring", damping: 25, stiffness: 300 }}
          >
            <div className="flex items-center gap-3 mb-4">
              <div className="p-2 rounded-full bg-primary/10">
                <ShieldCheck className="w-6 h-6 text-primary" />
              </div>
              <h2 className="text-lg font-bold text-foreground">Consent Required</h2>
            </div>

            <p className="text-sm text-muted-foreground leading-relaxed mb-4">
              Before proceeding, please confirm the following as a parent or legal guardian of the child.
            </p>

            <div className="space-y-4">
              <label className="flex items-start gap-3 cursor-pointer">
                <Checkbox
                  checked={parentConfirm}
                  onCheckedChange={(v) => setParentConfirm(!!v)}
                  className="mt-0.5"
                />
                <span className="text-sm text-foreground leading-snug">
                  I confirm I am the parent or legal guardian of the child whose data is being entered.
                </span>
              </label>

              <label className="flex items-start gap-3 cursor-pointer">
                <Checkbox
                  checked={dataConsent}
                  onCheckedChange={(v) => setDataConsent(!!v)}
                  className="mt-0.5"
                />
                <span className="text-sm text-foreground leading-snug">
                  I consent to the processing of this data for ECC risk screening and research purposes.
                </span>
              </label>
            </div>

            <div className="flex gap-2 text-xs text-muted-foreground mt-4">
              <Link to="/privacy" className="underline hover:text-primary transition-colors">Privacy Policy</Link>
              <span>·</span>
              <Link to="/terms" className="underline hover:text-primary transition-colors">Terms of Use</Link>
              <span>·</span>
              <Link to="/conditions" className="underline hover:text-primary transition-colors">Terms & Conditions</Link>
            </div>

            <div className="flex gap-3 mt-5">
              <Button variant="outline" className="flex-1" onClick={onCancel}>Cancel</Button>
              <Button className="flex-1" disabled={!allChecked} onClick={onConsent}>
                I Agree — Continue
              </Button>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
