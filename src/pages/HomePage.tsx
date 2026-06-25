import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { t } from "@/lib/i18n";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Plus, Calendar, BarChart3, LogOut } from "lucide-react";
import kidentLogo from "@/assets/kident-emblem.png";
import PageTransition from "@/components/PageTransition";
import AppFooter from "@/components/AppFooter";
import AnimatedBackground from "@/components/AnimatedBackground";
import ThemeToggle from "@/components/ThemeToggle";
import PwaControls from "@/components/PwaControls";

interface Child {
  id: string;
  name: string;
  age_group: string;
  gender: string;
}

export default function HomePage() {
  const { user, signOut } = useAuth();
  const navigate = useNavigate();
  const [children, setChildren] = useState<Child[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!user) return;
    supabase
      .from("children")
      .select("*")
      .order("created_at", { ascending: true })
      .then(({ data }) => {
        setChildren(data || []);
        setLoading(false);
      });
  }, [user]);

  const genderIcon = (g: string) => {
    if (g === "male") return "👦";
    if (g === "female") return "👧";
    return "🧒";
  };

  return (
    <PageTransition>
      <AnimatedBackground />
      <div className="min-h-screen flex flex-col relative z-[2]">
        <header className="bg-card/70 backdrop-blur-lg border-b border-border/60 px-5 py-3.5 flex items-center justify-between sticky top-0 z-10">
          <div className="flex items-center gap-2.5">
            <img src={kidentLogo} alt="KiDent" className="h-10 w-auto" />
            <h1 className="text-2xl font-serif font-normal tracking-tight text-foreground leading-none">{t.app.name}</h1>
          </div>
          <div className="flex items-center gap-1">
            <ThemeToggle />
            <Button variant="ghost" size="sm" onClick={signOut}>
              <LogOut className="w-4 h-4 mr-1" />
              {t.common.logout}
            </Button>
          </div>
        </header>

        <main className="max-w-lg mx-auto p-5 space-y-6 flex-1 w-full">
          <div className="space-y-2 pt-2">
            <p className="text-[11px] uppercase tracking-[0.22em] text-accent font-semibold">Today</p>
            <h2 className="text-4xl font-serif font-normal tracking-tight text-balance leading-[1.05]">{t.home.title}</h2>
          </div>

          {loading ? (
            <div className="space-y-4 py-4">
              {[1, 2].map((i) => (
                <div key={i} className="h-24 rounded-lg bg-muted animate-pulse" />
              ))}
            </div>
          ) : children.length === 0 ? (
            <Card className="text-center py-8">
              <CardContent>
                <img src={kidentLogo} alt="" className="h-28 w-auto mx-auto mb-4 opacity-50" loading="lazy" />
                <p className="text-muted-foreground">{t.home.noChildren}</p>
              </CardContent>
            </Card>
          ) : (
            children.map((child, i) => (
              <motion.div
                key={child.id}
                initial={{ opacity: 0, y: 12 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: i * 0.08, duration: 0.3 }}
              >
                <Card className="overflow-hidden hover:shadow-md transition-shadow">
                  <CardContent className="p-4">
                    <div className="flex items-center gap-3 mb-3">
                      <span className="text-2xl">{genderIcon(child.gender)}</span>
                      <div>
                        <h3 className="font-semibold text-foreground">{child.name}</h3>
                        <p className="text-sm text-muted-foreground">
                          {t.child.ageGroups[child.age_group as keyof typeof t.child.ageGroups]} · {t.child[child.gender as keyof typeof t.child] as string}
                        </p>
                      </div>
                    </div>
                    <div className="flex gap-2">
                      <Button size="sm" className="flex-1" onClick={() => navigate(`/entry/${child.id}`)}>
                        <Calendar className="w-4 h-4 mr-1" /> {t.home.todayEntry}
                      </Button>
                      <Button size="sm" variant="outline" className="flex-1" onClick={() => navigate(`/history/${child.id}`)}>
                        <BarChart3 className="w-4 h-4 mr-1" /> {t.home.viewHistory}
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              </motion.div>
            ))
          )}

          <Button className="w-full" variant="secondary" onClick={() => navigate("/add-child")}>
            <Plus className="w-4 h-4 mr-1" /> {t.home.addChild}
          </Button>

          <PwaControls />
        </main>

        <AppFooter />
      </div>
    </PageTransition>
  );
}
