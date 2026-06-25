import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { t } from "@/lib/i18n";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { ArrowLeft } from "lucide-react";
import { toast } from "sonner";
import AnimatedBackground from "@/components/AnimatedBackground";
import PageTransition from "@/components/PageTransition";
import AppFooter from "@/components/AppFooter";

export default function AddChildPage() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [name, setName] = useState("");
  const [ageGroup, setAgeGroup] = useState("");
  const [gender, setGender] = useState("");
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) return;
    setLoading(true);

    const { error } = await supabase.from("children").insert({
      user_id: user.id,
      name,
      age_group: ageGroup,
      gender,
    });

    if (error) {
      toast.error(error.message);
    } else {
      toast.success(`${name} has been added!`);
      navigate("/");
    }
    setLoading(false);
  };

  return (
    <PageTransition>
      <AnimatedBackground />
      <div className="min-h-screen flex flex-col relative z-[2]">
        <div className="flex-1 p-4">
          <Button variant="ghost" size="sm" onClick={() => navigate("/")} className="mb-4">
            <ArrowLeft className="w-4 h-4 mr-1" /> {t.common.back}
          </Button>

          <Card className="max-w-lg mx-auto">
            <CardHeader>
              <CardTitle>{t.home.addChild}</CardTitle>
            </CardHeader>
            <CardContent>
              <form onSubmit={handleSubmit} className="space-y-4">
                <div>
                  <label className="text-sm font-medium text-foreground">{t.child.name}</label>
                  <Input value={name} onChange={(e) => setName(e.target.value)} required />
                </div>

                <div>
                  <label className="text-sm font-medium text-foreground">{t.child.ageGroup}</label>
                  <Select value={ageGroup} onValueChange={setAgeGroup} required>
                    <SelectTrigger><SelectValue placeholder="Select age group" /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="2-3">{t.child.ageGroups["2-3"]}</SelectItem>
                      <SelectItem value="3-6">{t.child.ageGroups["3-6"]}</SelectItem>
                      <SelectItem value="6-12">{t.child.ageGroups["6-12"]}</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div>
                  <label className="text-sm font-medium text-foreground">{t.child.gender}</label>
                  <Select value={gender} onValueChange={setGender} required>
                    <SelectTrigger><SelectValue placeholder="Select gender" /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="male">{t.child.male}</SelectItem>
                      <SelectItem value="female">{t.child.female}</SelectItem>
                      <SelectItem value="other">{t.child.other}</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <Button type="submit" className="w-full" disabled={loading || !ageGroup || !gender}>
                  {loading ? t.common.loading : t.child.save}
                </Button>
              </form>
            </CardContent>
          </Card>
        </div>
        <AppFooter />
      </div>
    </PageTransition>
  );
}
