import { motion } from "framer-motion";
import { Button } from "@/components/ui/button";
import { ArrowLeft } from "lucide-react";
import { useNavigate } from "react-router-dom";
import AppFooter from "@/components/AppFooter";
import AnimatedBackground from "@/components/AnimatedBackground";
import PageTransition from "@/components/PageTransition";

const sections = [
  {
    title: "1. Eligibility",
    content:
      "This application is intended for parents or legal guardians of children aged 2–13 years residing in India. By using this application, you confirm you meet these criteria.",
  },
  {
    title: "2. Scope of Use",
    content:
      "KiDent is designed exclusively for AI-based ECC risk screening for research purposes. It must not be used for clinical decision-making, insurance assessments, or any purpose beyond research-based risk awareness.",
  },
  {
    title: "3. Data Collection & Consent",
    content:
      "By using this app, you consent to the collection and processing of the data you enter (demographic information, dietary habits, oral hygiene practices, and fluoride exposure) for the purpose of generating risk scores and contributing to anonymized research datasets.",
  },
  {
    title: "4. Disclaimer of Warranties",
    content:
      'The application is provided "as is" without warranties of any kind, express or implied. The research team does not warrant that the risk scores will be accurate, complete, or suitable for any particular purpose.',
  },
  {
    title: "5. Research Use",
    content:
      "Anonymized and aggregated data may be used in research publications and reports. No personally identifiable information will be included in any published research without explicit additional consent.",
  },
  {
    title: "6. Account Termination",
    content:
      "You may delete your account at any time, which will remove all personal and child data from the system. The research team reserves the right to suspend accounts that violate these conditions.",
  },
  {
    title: "7. Governing Law",
    content:
      "These terms are governed by the laws of India. Any disputes shall be subject to the jurisdiction of courts in the location of the principal research institution.",
  },
];

export default function ConditionsPage() {
  const navigate = useNavigate();
  return (
    <PageTransition>
      <AnimatedBackground />
      <div className="min-h-screen flex flex-col relative z-[2]">
        <div className="sticky top-0 z-10 bg-card/90 backdrop-blur border-b px-4 py-3 flex items-center gap-3">
          <Button variant="ghost" size="icon" onClick={() => navigate(-1)}>
            <ArrowLeft className="w-4 h-4" />
          </Button>
          <h1 className="text-lg font-bold text-foreground">Terms & Conditions</h1>
        </div>
        <main className="max-w-2xl mx-auto px-4 py-8 space-y-8 flex-1">
          <p className="text-sm text-muted-foreground">Last updated: April 2026</p>
          {sections.map((s, i) => (
            <motion.section
              key={i}
              initial={{ opacity: 0, y: 16 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, margin: "-40px" }}
              transition={{ duration: 0.4, delay: i * 0.05 }}
            >
              <h2 className="text-base font-semibold text-foreground mb-2">{s.title}</h2>
              <p className="text-sm text-muted-foreground leading-relaxed">{s.content}</p>
            </motion.section>
          ))}
        </main>
        <AppFooter />
      </div>
    </PageTransition>
  );
}
