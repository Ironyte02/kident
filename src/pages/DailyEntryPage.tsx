import { useState, useEffect, useMemo } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { t } from "@/lib/i18n";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { ArrowLeft, CheckCircle2 } from "lucide-react";
import { toast } from "sonner";
import type { DailyEntry, FreqOption, HealthyFreqOption, RiceFreqOption } from "@/lib/riskCalculator";
import { calculateRisk } from "@/lib/riskCalculator";
import { emptySelections, calculateFoodRisk, type FoodSelections } from "@/lib/foodData";
import FoodSelector from "@/components/FoodSelector";
import ConsentModal from "@/components/ConsentModal";
import AnalyzingLoader from "@/components/AnalyzingLoader";
import PageTransition from "@/components/PageTransition";
import AppFooter from "@/components/AppFooter";
import AnimatedBackground from "@/components/AnimatedBackground";

type FieldKey =
  | "mainMeals" | "sweetsFreq" | "snacksFreq" | "sweetDrinksFreq"
  | "tiffinFreq" | "healthyFreq" | "riceRotiFreq"
  | "brushFreq" | "toothpaste" | "rinseAfterMeals" | "extraCleaning"
  | "waterSource";

const DIET_FIELDS: FieldKey[] = ["mainMeals", "sweetsFreq", "snacksFreq", "sweetDrinksFreq", "tiffinFreq", "healthyFreq", "riceRotiFreq"];
const ORAL_FIELDS: FieldKey[] = ["brushFreq", "toothpaste", "rinseAfterMeals", "extraCleaning"];
const FLUORIDE_FIELDS: FieldKey[] = ["waterSource"];

export default function DailyEntryPage() {
  const { childId } = useParams<{ childId: string }>();
  const { user } = useAuth();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [analyzing, setAnalyzing] = useState(false);
  const [consentOpen, setConsentOpen] = useState(true);
  const [consented, setConsented] = useState(false);

  const [childAge, setChildAge] = useState(5);
  const [childGender, setChildGender] = useState<"Boy" | "Girl">("Boy");

  // Food selections (new meal-based system)
  const [foodSelections, setFoodSelections] = useState<FoodSelections>(emptySelections);

  useEffect(() => {
    if (!childId) return;
    supabase.from("children").select("age_group, gender").eq("id", childId).single().then(({ data }) => {
      if (data) {
        const ageMap: Record<string, number> = { "2-3": 3, "3-6": 5, "6-12": 9 };
        setChildAge(ageMap[data.age_group] ?? 5);
        setChildGender(data.gender === "female" ? "Girl" : "Boy");
      }
    });
  }, [childId]);

  const [touched, setTouched] = useState<Set<FieldKey>>(new Set());
  const touch = (key: FieldKey) => setTouched((prev) => new Set(prev).add(key));

  const [mainMeals, setMainMeals] = useState<DailyEntry["mainMeals"] | "">("");
  const [sweetsFreq, setSweetsFreq] = useState<FreqOption | "">("");
  const [snacksFreq, setSnacksFreq] = useState<FreqOption | "">("");
  const [sweetDrinksFreq, setSweetDrinksFreq] = useState<FreqOption | "">("");
  const [tiffinFreq, setTiffinFreq] = useState<FreqOption | "">("");
  const [healthyFreq, setHealthyFreq] = useState<HealthyFreqOption | "">("");
  const [riceRotiFreq, setRiceRotiFreq] = useState<RiceFreqOption | "">("");
  const [brushFreq, setBrushFreq] = useState<DailyEntry["brushFreq"] | "">("");
  const [toothpaste, setToothpaste] = useState<DailyEntry["toothpaste"] | "">("");
  const [rinseAfterMeals, setRinseAfterMeals] = useState<DailyEntry["rinseAfterMeals"] | "">("");
  const [extraCleaning, setExtraCleaning] = useState<DailyEntry["extraCleaning"] | "">("");
  const [waterSource, setWaterSource] = useState<DailyEntry["waterSource"] | "">("");
  const [fluorideTreatment, setFluorideTreatment] = useState<DailyEntry["fluorideTreatment"]>("No/Don't know");

  const allFields: Record<FieldKey, string> = {
    mainMeals, sweetsFreq, snacksFreq, sweetDrinksFreq,
    tiffinFreq, healthyFreq, riceRotiFreq,
    brushFreq, toothpaste, rinseAfterMeals, extraCleaning,
    waterSource,
  };

  const allRequired: FieldKey[] = [...DIET_FIELDS, ...ORAL_FIELDS, ...FLUORIDE_FIELDS];
  const isComplete = useMemo(() => allRequired.every((k) => allFields[k] !== ""), [allFields]);

  const tabComplete = (fields: FieldKey[]) => fields.every((k) => allFields[k] !== "");
  const dietDone = tabComplete(DIET_FIELDS);
  const oralDone = tabComplete(ORAL_FIELDS);
  const fluorideDone = tabComplete(FLUORIDE_FIELDS);

  // Check if at least some food items are selected
  const hasFoodSelections = Object.values(foodSelections).some((arr) => arr.length > 0);

  const handleSubmit = async () => {
    if (!user || !childId) return;
    if (!isComplete) {
      toast.error("Please fill in all fields across all tabs before saving.");
      return;
    }

    setAnalyzing(true);

    const entry: DailyEntry = {
      age: childAge, gender: childGender,
      mainMeals: mainMeals as DailyEntry["mainMeals"],
      sweetsFreq: sweetsFreq as FreqOption,
      snacksFreq: snacksFreq as FreqOption,
      sweetDrinksFreq: sweetDrinksFreq as FreqOption,
      tiffinFreq: tiffinFreq as FreqOption,
      healthyFreq: healthyFreq as HealthyFreqOption,
      riceRotiFreq: riceRotiFreq as RiceFreqOption,
      brushFreq: brushFreq as DailyEntry["brushFreq"],
      toothpaste: toothpaste as DailyEntry["toothpaste"],
      rinseAfterMeals: rinseAfterMeals as DailyEntry["rinseAfterMeals"],
      extraCleaning: extraCleaning as DailyEntry["extraCleaning"],
      waterSource: waterSource as DailyEntry["waterSource"],
      fluorideTreatment,
    };

    const baseResult = calculateRisk(entry);

    // Combine with food-based risk scoring
    const foodRisk = calculateFoodRisk(foodSelections);
    const FOOD_WEIGHT = 0.25; // food influences 25% of final score
    const combinedScore = Math.round(
      baseResult.score * (1 - FOOD_WEIGHT) + foodRisk * FOOD_WEIGHT
    );
    const finalScore = Math.min(100, Math.max(0, combinedScore));

    // Simulate analysis time for engaging UX
    await new Promise((r) => setTimeout(r, 3600));

    const { error } = await supabase.from("daily_entries").upsert(
      {
        child_id: childId, user_id: user.id,
        entry_date: new Date().toISOString().split("T")[0],
        diet_data: {
          mainMeals, sweetsFreq, snacksFreq, sweetDrinksFreq,
          tiffinFreq, healthyFreq, riceRotiFreq,
          foodSelections,
        } as any,
        oral_habits_data: { brushFreq, toothpaste, rinseAfterMeals, extraCleaning } as any,
        fluoride_data: { waterSource, fluorideTreatment } as any,
        risk_score: finalScore,
        recommendations: baseResult.recommendations.map((r) => r.message_en),
      },
      { onConflict: "child_id,entry_date" }
    );

    if (error) {
      toast.error(error.message);
      setAnalyzing(false);
    } else {
      navigate(`/result/${childId}`, {
        state: { score: finalScore, recommendations: baseResult.recommendations },
      });
    }
  };

  const freq4Options: FreqOption[] = ["Never/Rarely", "1-2 times per week", "3-4 times per week", "Daily"];
  const TabCheck = ({ done }: { done: boolean }) =>
    done ? <CheckCircle2 className="w-3.5 h-3.5 text-risk-low inline ml-1" /> : null;

  if (analyzing) {
    return (
      <PageTransition>
        <div className="min-h-screen bg-background flex items-center justify-center">
          <AnalyzingLoader />
        </div>
      </PageTransition>
    );
  }

  return (
    <PageTransition>
      <AnimatedBackground />
      <ConsentModal
        open={consentOpen && !consented}
        onConsent={() => { setConsented(true); setConsentOpen(false); }}
        onCancel={() => navigate("/")}
      />

      <div className="min-h-screen flex flex-col relative z-[2]">
        <div className="flex-1 p-4">
          <Button variant="ghost" size="sm" onClick={() => navigate("/")} className="mb-4 relative z-20">
            <ArrowLeft className="w-4 h-4 mr-1" /> {t.common.back}
          </Button>

          <Tabs defaultValue="food" className="max-w-lg mx-auto relative z-20">
            <TabsList className="grid w-full grid-cols-4">
              <TabsTrigger value="food">🍱 Food{hasFoodSelections && <CheckCircle2 className="w-3.5 h-3.5 text-risk-low inline ml-1" />}</TabsTrigger>
              <TabsTrigger value="diet">🍽 Frequency<TabCheck done={dietDone} /></TabsTrigger>
              <TabsTrigger value="oral">🪥 Oral<TabCheck done={oralDone} /></TabsTrigger>
              <TabsTrigger value="fluoride">💧 Fluoride<TabCheck done={fluorideDone} /></TabsTrigger>
            </TabsList>

            {/* NEW: Food Selection Tab */}
            <TabsContent value="food" className="mt-4">
              <FoodSelector selections={foodSelections} onChange={setFoodSelections} />
            </TabsContent>

            <TabsContent value="diet" className="space-y-4 mt-4">
              <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.3 }}>
                <Card className="relative z-20">
                  <CardHeader className="py-3 px-4"><CardTitle className="text-sm font-medium">Main Meals per Day</CardTitle></CardHeader>
                  <CardContent className="px-4 pb-3">
                    <Select value={mainMeals} onValueChange={(v) => { setMainMeals(v as DailyEntry["mainMeals"]); touch("mainMeals"); }}>
                      <SelectTrigger className={mainMeals === "" ? "text-muted-foreground relative z-20" : "relative z-20"}><SelectValue placeholder="Select…" /></SelectTrigger>
                      <SelectContent className="z-50">
                        <SelectItem value="2 meals">2 meals</SelectItem>
                        <SelectItem value="3 meals">3 meals</SelectItem>
                        <SelectItem value="More than 3 meals">More than 3 meals</SelectItem>
                      </SelectContent>
                    </Select>
                  </CardContent>
                </Card>
                <div className="space-y-4 mt-4">
                  <FreqCard label="Sweets / Desserts" value={sweetsFreq} options={freq4Options} onChange={(v) => { setSweetsFreq(v); touch("sweetsFreq"); }} />
                  <FreqCard label="Snacks (Chips, Namkeen, Street Food)" value={snacksFreq} options={freq4Options} onChange={(v) => { setSnacksFreq(v); touch("snacksFreq"); }} />
                  <FreqCard label="Sweet Drinks (Juice, Soft Drinks)" value={sweetDrinksFreq} options={freq4Options} onChange={(v) => { setSweetDrinksFreq(v); touch("sweetDrinksFreq"); }} />
                  <FreqCard label="Tiffin / Packed Snacks" value={tiffinFreq} options={freq4Options} onChange={(v) => { setTiffinFreq(v); touch("tiffinFreq"); }} />
                  <FreqCard label="Healthy Foods (Fruits, Vegetables)" value={healthyFreq} options={["Never/Rarely", "1 time daily", "2-3 times daily", "With every meal"]} onChange={(v) => { setHealthyFreq(v as HealthyFreqOption); touch("healthyFreq"); }} />
                  <FreqCard label="Rice / Roti Frequency" value={riceRotiFreq} options={["Never/Rarely", "1 time daily", "2 times daily", "More than 2 times daily"]} onChange={(v) => { setRiceRotiFreq(v as RiceFreqOption); touch("riceRotiFreq"); }} />
                </div>
              </motion.div>
            </TabsContent>

            <TabsContent value="oral" className="space-y-4 mt-4">
              <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.3 }}>
                <Card className="relative z-20">
                  <CardContent className="p-4 space-y-4">
                    <div>
                      <label className="text-sm font-medium">{t.oral.brushingCount}</label>
                      <Select value={brushFreq} onValueChange={(v) => { setBrushFreq(v as DailyEntry["brushFreq"]); touch("brushFreq"); }}>
                        <SelectTrigger className={brushFreq === "" ? "text-muted-foreground" : ""}><SelectValue placeholder="Select…" /></SelectTrigger>
                        <SelectContent className="z-50">
                          <SelectItem value="Rarely/Never">Rarely / Never</SelectItem>
                          <SelectItem value="Once">Once</SelectItem>
                          <SelectItem value="Twice">Twice</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                    <div>
                      <label className="text-sm font-medium">{t.oral.toothpaste}</label>
                      <Select value={toothpaste} onValueChange={(v) => { setToothpaste(v as DailyEntry["toothpaste"]); touch("toothpaste"); }}>
                        <SelectTrigger className={toothpaste === "" ? "text-muted-foreground" : ""}><SelectValue placeholder="Select…" /></SelectTrigger>
                        <SelectContent className="z-50">
                          <SelectItem value="Fluoride">{t.oral.fluoride}</SelectItem>
                          <SelectItem value="Non-fluoride">{t.oral.nonFluoride}</SelectItem>
                          <SelectItem value="Don't know">{t.oral.dontKnow}</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                    <div>
                      <label className="text-sm font-medium">{t.oral.rinsedAfterMeals}</label>
                      <Select value={rinseAfterMeals} onValueChange={(v) => { setRinseAfterMeals(v as DailyEntry["rinseAfterMeals"]); touch("rinseAfterMeals"); }}>
                        <SelectTrigger className={rinseAfterMeals === "" ? "text-muted-foreground" : ""}><SelectValue placeholder="Select…" /></SelectTrigger>
                        <SelectContent className="z-50">
                          <SelectItem value="Never">Never</SelectItem>
                          <SelectItem value="Rarely">Rarely</SelectItem>
                          <SelectItem value="Sometimes">Sometimes</SelectItem>
                          <SelectItem value="Always">Always</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                    <div>
                      <label className="text-sm font-medium">{t.oral.flossedOrMouthwash}</label>
                      <Select value={extraCleaning} onValueChange={(v) => { setExtraCleaning(v as DailyEntry["extraCleaning"]); touch("extraCleaning"); }}>
                        <SelectTrigger className={extraCleaning === "" ? "text-muted-foreground" : ""}><SelectValue placeholder="Select…" /></SelectTrigger>
                        <SelectContent className="z-50">
                          <SelectItem value="No">No</SelectItem>
                          <SelectItem value="Sometimes">Sometimes</SelectItem>
                          <SelectItem value="Yes, regularly">Yes, regularly</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                  </CardContent>
                </Card>
              </motion.div>
            </TabsContent>

            <TabsContent value="fluoride" className="space-y-4 mt-4">
              <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.3 }}>
                <Card className="relative z-20">
                  <CardContent className="p-4 space-y-4">
                    <div>
                      <label className="text-sm font-medium">{t.fluoride.waterSource}</label>
                      <Select value={waterSource} onValueChange={(v) => { setWaterSource(v as DailyEntry["waterSource"]); touch("waterSource"); }}>
                        <SelectTrigger className={waterSource === "" ? "text-muted-foreground" : ""}><SelectValue placeholder="Select…" /></SelectTrigger>
                        <SelectContent className="z-50">
                          <SelectItem value="Well/borewell">Well / Borewell</SelectItem>
                          <SelectItem value="Tap/municipal">Tap / Municipal</SelectItem>
                          <SelectItem value="Bottled">Bottled Water</SelectItem>
                          <SelectItem value="Filtered (RO/purifier)">Filtered (RO/purifier)</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                    <div className="flex items-center justify-between">
                      <label className="text-sm font-medium">{t.fluoride.professionalTreatment}</label>
                      <Switch checked={fluorideTreatment === "Yes"} onCheckedChange={(v) => setFluorideTreatment(v ? "Yes" : "No/Don't know")} />
                    </div>
                  </CardContent>
                </Card>
              </motion.div>
            </TabsContent>
          </Tabs>

          <div className="max-w-lg mx-auto mt-6 relative z-20">
            <Button className="w-full" onClick={handleSubmit} disabled={loading || !isComplete}>
              {loading ? t.common.loading : t.risk.saveEntry}
            </Button>
            {!isComplete && (
              <p className="text-xs text-muted-foreground text-center mt-2">
                Complete all fields in every tab to enable saving.
              </p>
            )}
          </div>
        </div>
        <AppFooter />
      </div>
    </PageTransition>
  );
}

function FreqCard({ label, value, options, onChange }: {
  label: string; value: string; options: string[]; onChange: (v: any) => void;
}) {
  return (
    <Card className="relative z-20">
      <CardHeader className="py-3 px-4"><CardTitle className="text-sm font-medium">{label}</CardTitle></CardHeader>
      <CardContent className="px-4 pb-3">
        <Select value={value} onValueChange={onChange}>
          <SelectTrigger className={value === "" ? "text-muted-foreground" : ""}><SelectValue placeholder="Select…" /></SelectTrigger>
          <SelectContent className="z-50">
            {options.map((opt) => (<SelectItem key={opt} value={opt}>{opt}</SelectItem>))}
          </SelectContent>
        </Select>
      </CardContent>
    </Card>
  );
}
