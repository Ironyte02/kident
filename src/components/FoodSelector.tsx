import { motion } from "framer-motion";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { FOOD_DATA, MEAL_LABELS, type MealCategory, type FoodSelections } from "@/lib/foodData";

interface FoodSelectorProps {
  selections: FoodSelections;
  onChange: (selections: FoodSelections) => void;
}

export default function FoodSelector({ selections, onChange }: FoodSelectorProps) {
  const toggle = (category: MealCategory, name: string) => {
    const current = selections[category];
    const updated = current.includes(name)
      ? current.filter((n) => n !== name)
      : [...current, name];
    onChange({ ...selections, [category]: updated });
  };

  return (
    <div className="space-y-4">
      {(Object.keys(FOOD_DATA) as MealCategory[]).map((category) => (
        <motion.div
          key={category}
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.3 }}
        >
          <Card>
            <CardHeader className="py-3 px-4">
              <CardTitle className="text-sm font-medium">
                {MEAL_LABELS[category]}
                {selections[category].length > 0 && (
                  <span className="ml-2 text-xs text-muted-foreground">
                    ({selections[category].length} selected)
                  </span>
                )}
              </CardTitle>
            </CardHeader>
            <CardContent className="px-4 pb-3">
              <div className="flex flex-wrap gap-2">
                {FOOD_DATA[category].map((item) => {
                  const isSelected = selections[category].includes(item.name);
                  return (
                    <button
                      key={item.name}
                      type="button"
                      onClick={() => toggle(category, item.name)}
                      className={`
                        relative z-10 px-3 py-1.5 rounded-full text-xs font-medium
                        transition-all duration-200 border cursor-pointer select-none
                        ${isSelected
                          ? "bg-primary text-primary-foreground border-primary shadow-sm scale-105"
                          : "bg-muted/50 text-foreground border-border hover:bg-muted hover:border-primary/40"
                        }
                      `}
                    >
                      {item.name}
                    </button>
                  );
                })}
              </div>
            </CardContent>
          </Card>
        </motion.div>
      ))}
    </div>
  );
}
