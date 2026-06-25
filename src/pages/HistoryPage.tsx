import { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { t } from "@/lib/i18n";
import { getRiskLevel } from "@/lib/riskCalculator";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { ArrowLeft } from "lucide-react";
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, ReferenceLine } from "recharts";
import AnimatedBackground from "@/components/AnimatedBackground";
import PageTransition from "@/components/PageTransition";
import AppFooter from "@/components/AppFooter";

interface Entry {
  id: string;
  entry_date: string;
  risk_score: number | null;
}

export default function HistoryPage() {
  const { childId } = useParams<{ childId: string }>();
  const { user } = useAuth();
  const navigate = useNavigate();
  const [entries, setEntries] = useState<Entry[]>([]);
  const [childName, setChildName] = useState("");
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!user || !childId) return;

    const fetchData = async () => {
      const [{ data: child }, { data: entriesData }] = await Promise.all([
        supabase.from("children").select("name").eq("id", childId).single(),
        supabase
          .from("daily_entries")
          .select("id, entry_date, risk_score")
          .eq("child_id", childId)
          .order("entry_date", { ascending: false })
          .limit(30),
      ]);

      setChildName(child?.name || "");
      setEntries(entriesData || []);
      setLoading(false);
    };

    fetchData();
  }, [user, childId]);

  const chartData = [...entries]
    .filter((e) => e.risk_score !== null)
    .reverse()
    .map((e) => ({
      date: new Date(e.entry_date + "T00:00:00").toLocaleDateString("en-IN", {
        day: "numeric",
        month: "short",
      }),
      score: e.risk_score!,
    }));

  const levelBadge = (score: number) => {
    const level = getRiskLevel(score);
    const colors = {
      low: "bg-risk-low/20 text-risk-low",
      moderate: "bg-risk-moderate/20 text-risk-moderate",
      high: "bg-risk-high/20 text-risk-high",
    };
    return (
      <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${colors[level]}`}>
        {score}% — {t.risk[level]}
      </span>
    );
  };

  return (
    <PageTransition>
      <AnimatedBackground />
      <div className="min-h-screen flex flex-col relative z-[2]">
        <div className="flex-1 p-4">
          <Button variant="ghost" size="sm" onClick={() => navigate("/")} className="mb-4">
            <ArrowLeft className="w-4 h-4 mr-1" /> {t.common.back}
          </Button>

          <div className="max-w-lg mx-auto">
            <h1 className="text-xl font-bold mb-1">{t.history.title}</h1>
            <p className="text-muted-foreground text-sm mb-4">{childName}</p>

            {loading ? (
              <p className="text-muted-foreground text-center py-8">{t.common.loading}</p>
            ) : entries.length === 0 ? (
              <Card>
                <CardContent className="text-center py-8 text-muted-foreground">
                  {t.history.noEntries}
                </CardContent>
              </Card>
            ) : (
              <div className="space-y-4">
                {chartData.length >= 2 && (
                  <Card>
                    <CardHeader className="py-3 px-4">
                      <CardTitle className="text-sm font-medium">{t.history.weeklyView}</CardTitle>
                    </CardHeader>
                    <CardContent className="px-2 pb-3">
                      <ResponsiveContainer width="100%" height={200}>
                        <LineChart data={chartData} margin={{ top: 5, right: 20, bottom: 5, left: 0 }}>
                          <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--muted))" />
                          <XAxis dataKey="date" tick={{ fontSize: 11 }} stroke="hsl(var(--muted-foreground))" />
                          <YAxis domain={[0, 100]} tick={{ fontSize: 11 }} stroke="hsl(var(--muted-foreground))" />
                          <Tooltip
                            contentStyle={{
                              backgroundColor: "hsl(var(--card))",
                              border: "1px solid hsl(var(--border))",
                              borderRadius: 8,
                              fontSize: 12,
                            }}
                            formatter={(value: number) => [`${value}%`, "Risk Score"]}
                          />
                          <ReferenceLine y={40} stroke="hsl(145, 65%, 45%)" strokeDasharray="4 4" />
                          <ReferenceLine y={70} stroke="hsl(0, 80%, 55%)" strokeDasharray="4 4" />
                          <Line
                            type="monotone"
                            dataKey="score"
                            stroke="hsl(var(--primary))"
                            strokeWidth={2.5}
                            dot={{ r: 4, fill: "hsl(var(--primary))" }}
                            activeDot={{ r: 6 }}
                          />
                        </LineChart>
                      </ResponsiveContainer>
                      <div className="flex justify-center gap-4 mt-2 text-[10px] text-muted-foreground">
                        <span className="flex items-center gap-1">
                          <span className="w-3 h-0.5 inline-block bg-[hsl(145,65%,45%)]" /> Low (&lt;40)
                        </span>
                        <span className="flex items-center gap-1">
                          <span className="w-3 h-0.5 inline-block bg-[hsl(0,80%,55%)]" /> High (&gt;70)
                        </span>
                      </div>
                    </CardContent>
                  </Card>
                )}

                {entries.map((entry) => (
                  <Card key={entry.id}>
                    <CardContent className="p-3 flex items-center justify-between">
                      <span className="text-sm font-medium">
                        {new Date(entry.entry_date + "T00:00:00").toLocaleDateString("en-IN", {
                          weekday: "short",
                          day: "numeric",
                          month: "short",
                        })}
                      </span>
                      {entry.risk_score !== null && levelBadge(entry.risk_score)}
                    </CardContent>
                  </Card>
                ))}
              </div>
            )}
          </div>
        </div>
        <AppFooter />
      </div>
    </PageTransition>
  );
}
