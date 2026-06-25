import { motion } from "framer-motion";
import { Button } from "@/components/ui/button";
import { ArrowLeft } from "lucide-react";
import { useNavigate } from "react-router-dom";
import AppFooter from "@/components/AppFooter";
import AnimatedBackground from "@/components/AnimatedBackground";
import PageTransition from "@/components/PageTransition";

const sections = [
  {
    title: "1. Information We Collect",
    content:
      "We collect information you provide when registering an account (email address), child demographic data (age group, gender), and daily oral health entries (dietary habits, brushing frequency, fluoride exposure). We do not collect photographs, biometric data, or personally identifiable health records.",
  },
  {
    title: "2. How We Use Your Information",
    content:
      "Your data is used solely for generating AI-based ECC risk screening scores and contributing to anonymized research datasets. We do not sell, rent, or share your personal data with third parties for marketing purposes.",
  },
  {
    title: "3. Data Storage & Security",
    content:
      "All data is stored on secure, encrypted cloud infrastructure. Access is restricted to authorized research personnel. We implement industry-standard security measures including encryption in transit and at rest.",
  },
  {
    title: "4. Your Rights",
    content:
      "You may request access to, correction of, or deletion of your personal data at any time by contacting the research team. You may withdraw consent and delete your account, which will remove all associated data.",
  },
  {
    title: "5. Children's Privacy",
    content:
      "We do not collect data directly from children. All data is entered by a parent or legal guardian who has provided informed consent. No child's name is shared outside the platform.",
  },
  {
    title: "6. Changes to This Policy",
    content:
      "We may update this Privacy Policy periodically. Any changes will be communicated through the app. Continued use of the app after changes constitutes acceptance.",
  },
  {
    title: "7. Contact",
    content:
      "For questions about this Privacy Policy, please contact the research team through the channels provided at your enrollment center.",
  },
];

export default function PrivacyPage() {
  const navigate = useNavigate();
  return (
    <PageTransition>
      <AnimatedBackground />
      <div className="min-h-screen flex flex-col relative z-[2]">
        <div className="sticky top-0 z-10 bg-card/90 backdrop-blur border-b px-4 py-3 flex items-center gap-3">
          <Button variant="ghost" size="icon" onClick={() => navigate(-1)}>
            <ArrowLeft className="w-4 h-4" />
          </Button>
          <h1 className="text-lg font-bold text-foreground">Privacy Policy</h1>
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
