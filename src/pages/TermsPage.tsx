import { motion } from "framer-motion";
import { Button } from "@/components/ui/button";
import { ArrowLeft } from "lucide-react";
import { useNavigate } from "react-router-dom";
import AppFooter from "@/components/AppFooter";
import AnimatedBackground from "@/components/AnimatedBackground";
import PageTransition from "@/components/PageTransition";

const sections = [
  {
    title: "1. Acceptance of Terms",
    content:
      "By accessing or using KiDent, you agree to be bound by these Terms of Use. If you do not agree, please do not use the application.",
  },
  {
    title: "2. Nature of the Service",
    content:
      "KiDent is an AI-based screening tool for research purposes. It provides risk assessment scores for Early Childhood Caries (ECC) based on lifestyle and hygiene data entered by parents or guardians. It is NOT a medical device, does NOT provide diagnosis, and does NOT recommend treatment.",
  },
  {
    title: "3. User Responsibilities",
    content:
      "You must be a parent or legal guardian of any child whose data you enter. You are responsible for the accuracy of information provided. You must not use the app as a substitute for professional dental consultation.",
  },
  {
    title: "4. No Medical Advice",
    content:
      "The risk scores and recommendations provided are for informational and research purposes only. They do not constitute medical advice, diagnosis, or treatment recommendations. Always seek the advice of a qualified dental professional.",
  },
  {
    title: "5. Intellectual Property",
    content:
      "All content, algorithms, and designs within KiDent are the intellectual property of the research team. Unauthorized reproduction or distribution is prohibited.",
  },
  {
    title: "6. Limitation of Liability",
    content:
      "The research team and developers shall not be liable for any direct, indirect, or consequential damages arising from the use of this screening tool. Use is at your own discretion.",
  },
  {
    title: "7. Modifications",
    content:
      "We reserve the right to modify these terms at any time. Continued use after modifications constitutes acceptance of the updated terms.",
  },
];

export default function TermsPage() {
  const navigate = useNavigate();
  return (
    <PageTransition>
      <AnimatedBackground />
      <div className="min-h-screen flex flex-col relative z-[2]">
        <div className="sticky top-0 z-10 bg-card/90 backdrop-blur border-b px-4 py-3 flex items-center gap-3">
          <Button variant="ghost" size="icon" onClick={() => navigate(-1)}>
            <ArrowLeft className="w-4 h-4" />
          </Button>
          <h1 className="text-lg font-bold text-foreground">Terms of Use</h1>
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
