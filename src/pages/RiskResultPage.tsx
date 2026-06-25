import { useState } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import { t } from "@/lib/i18n";
import { getRiskLevel, type Recommendation, type RiskLevel } from "@/lib/riskCalculator";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Home, Utensils, ShieldCheck, AlertTriangle } from "lucide-react";
import kidentLogo from "@/assets/kident-emblem.png";
import AnimatedRiskBar from "@/components/AnimatedRiskBar";
import DisclaimerModal from "@/components/DisclaimerModal";
import PageTransition from "@/components/PageTransition";
import AppFooter from "@/components/AppFooter";
import AnimatedBackground from "@/components/AnimatedBackground";

const stagger = {
  hidden: { opacity: 0 },
  show: { opacity: 1, transition: { staggerChildren: 0.12, delayChildren: 2 } },
};
const fadeUp = {
  hidden: { opacity: 0, y: 12 },
  show: { opacity: 1, y: 0, transition: { duration: 0.4 } },
};

const infoCards: Record<RiskLevel, { diet: string; hygiene: string; factors: string }> = {
  low: {
    diet: "Your child's diet is well-balanced with limited sugar intake. Keep maintaining healthy eating habits!",
    hygiene: "Oral hygiene practices are excellent. Regular brushing and rinsing are helping protect the teeth.",
    factors: "No significant risk factors detected. Continue regular dental check-ups every 6 months.",
  },
  moderate: {
    diet: "Consider reducing sugary snacks and drinks. Encourage more fruits, vegetables, and water instead.",
    hygiene: "There's room for improvement in brushing and rinsing habits. Aim for twice-daily brushing with fluoride toothpaste.",
    factors: "Some risk factors are present. A dental visit is recommended to assess and prevent potential issues.",
  },
  high: {
    diet: "High sugar consumption detected. It's important to significantly reduce sweets, sugary drinks, and frequent snacking.",
    hygiene: "Oral hygiene needs immediate attention. Ensure brushing twice daily with fluoride toothpaste and rinsing after every meal.",
    factors: "Multiple risk factors detected. Please schedule a dental appointment as soon as possible for professional evaluation.",
  },
};

export default function RiskResultPage() {
  const navigate = useNavigate();
  const location = useLocation();
  const { score = 50, recommendations = [] } = (location.state as any) || {};
  const [disclaimerOpen, setDisclaimerOpen] = useState(true);
  const [resultsVisible, setResultsVisible] = useState(false);
  const level = getRiskLevel(score);
  const info = infoCards[level];

  return (
    <PageTransition>
      <AnimatedBackground />
      <DisclaimerModal
        open={disclaimerOpen}
        onAccept={() => {
          setDisclaimerOpen(false);
          setResultsVisible(true);
        }}
      />

      {resultsVisible && (
        <div className="min-h-screen flex flex-col relative z-[2]">
          <div className="flex-1 p-4 flex flex-col items-center">
            <motion.img
              src={kidentLogo}
              alt=""
              className="h-28 w-auto mb-4"
              initial={{ scale: 0.3, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              transition={{ type: "spring", stiffness: 200, delay: 0.1 }}
            />

            <motion.h1
              className="text-2xl font-bold mb-6 text-foreground"
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.2 }}
            >
              {t.risk.title}
            </motion.h1>

            <AnimatedRiskBar score={score} />

            <motion.div
              className="w-full max-w-lg mt-6 grid gap-4"
              variants={stagger}
              initial="hidden"
              animate="show"
            >
              <motion.div variants={fadeUp}>
                <Card className="shadow-md hover:shadow-lg transition-shadow duration-300">
                  <CardHeader className="pb-2 pt-4 px-4">
                    <CardTitle className="text-sm font-semibold flex items-center gap-2 text-foreground">
                      <Utensils className="w-4 h-4 text-secondary" />
                      Diet Habits
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="px-4 pb-4 pt-0">
                    <p className="text-sm text-muted-foreground leading-relaxed">{info.diet}</p>
                  </CardContent>
                </Card>
              </motion.div>

              <motion.div variants={fadeUp}>
                <Card className="shadow-md hover:shadow-lg transition-shadow duration-300">
                  <CardHeader className="pb-2 pt-4 px-4">
                    <CardTitle className="text-sm font-semibold flex items-center gap-2 text-foreground">
                      <ShieldCheck className="w-4 h-4 text-primary" />
                      Oral Hygiene
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="px-4 pb-4 pt-0">
                    <p className="text-sm text-muted-foreground leading-relaxed">{info.hygiene}</p>
                  </CardContent>
                </Card>
              </motion.div>

              <motion.div variants={fadeUp}>
                <Card className="shadow-md hover:shadow-lg transition-shadow duration-300">
                  <CardHeader className="pb-2 pt-4 px-4">
                    <CardTitle className="text-sm font-semibold flex items-center gap-2 text-foreground">
                      <AlertTriangle className="w-4 h-4 text-destructive" />
                      Risk Factors
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="px-4 pb-4 pt-0">
                    <p className="text-sm text-muted-foreground leading-relaxed">{info.factors}</p>
                  </CardContent>
                </Card>
              </motion.div>

              <motion.div variants={fadeUp}>
                <Card className="shadow-md hover:shadow-lg transition-shadow duration-300">
                  <CardContent className="p-4">
                    <h3 className="font-semibold text-foreground mb-3">{t.risk.recommendations}</h3>
                    <ul className="space-y-2">
                      {recommendations.map((rec: Recommendation | string, i: number) => (
                        <motion.li
                          key={i}
                          className="flex items-start gap-2 text-sm text-foreground"
                          initial={{ opacity: 0, x: -8 }}
                          animate={{ opacity: 1, x: 0 }}
                          transition={{ delay: 2.2 + i * 0.1 }}
                          whileHover={{ x: 4 }}
                        >
                          <span className="text-secondary mt-0.5">•</span>
                          {typeof rec === "string" ? rec : rec.message_en}
                        </motion.li>
                      ))}
                    </ul>
                  </CardContent>
                </Card>
              </motion.div>
            </motion.div>

            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 2.5 }}
            >
              <Button className="mt-6 mb-4" onClick={() => navigate("/")}>
                <Home className="w-4 h-4 mr-1" /> {t.risk.back}
              </Button>
            </motion.div>
          </div>
          <AppFooter />
        </div>
      )}
    </PageTransition>
  );
}
