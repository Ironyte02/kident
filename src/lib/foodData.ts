/**
 * Indian kid-focused food data with ECC risk scoring.
 */

export interface FoodItem {
  name: string;
  riskScore: number; // -1 protective, 0 neutral, +1 low, +2 moderate, +3 high
}

export type MealCategory = "breakfast" | "lunch" | "dinner" | "snacks" | "drinks";

export const FOOD_DATA: Record<MealCategory, FoodItem[]> = {
  breakfast: [
    { name: "Idli", riskScore: 0 },
    { name: "Dosa (Plain)", riskScore: 0 },
    { name: "Masala Dosa", riskScore: 0 },
    { name: "Chapati", riskScore: 0 },
    { name: "Paratha", riskScore: 1 },
    { name: "Pongal", riskScore: 0 },
    { name: "Upma", riskScore: 0 },
    { name: "Poha", riskScore: 0 },
    { name: "Bread Butter", riskScore: 1 },
    { name: "Bread Jam", riskScore: 2 },
    { name: "Cereal", riskScore: 2 },
    { name: "Milk with Sugar", riskScore: 2 },
    { name: "Milk without Sugar", riskScore: -1 },
  ],
  lunch: [
    { name: "Rice with Sambar", riskScore: 1 },
    { name: "Rice with Dal", riskScore: 1 },
    { name: "Rice with Chicken Curry", riskScore: 1 },
    { name: "Rice with Fish Curry", riskScore: 1 },
    { name: "Rice with Egg Curry", riskScore: 1 },
    { name: "Curd Rice", riskScore: -1 },
    { name: "Lemon Rice", riskScore: 1 },
    { name: "Tomato Rice", riskScore: 1 },
    { name: "Biryani", riskScore: 1 },
    { name: "Chapati with Sabzi", riskScore: 1 },
    { name: "Roti with Dal", riskScore: 1 },
  ],
  dinner: [
    { name: "Rice with Sambar", riskScore: 1 },
    { name: "Rice with Dal", riskScore: 1 },
    { name: "Rice with Chicken Curry", riskScore: 1 },
    { name: "Rice with Fish Curry", riskScore: 1 },
    { name: "Rice with Egg Curry", riskScore: 1 },
    { name: "Curd Rice", riskScore: -1 },
    { name: "Lemon Rice", riskScore: 1 },
    { name: "Tomato Rice", riskScore: 1 },
    { name: "Biryani", riskScore: 1 },
    { name: "Chapati with Sabzi", riskScore: 1 },
    { name: "Roti with Dal", riskScore: 1 },
  ],
  snacks: [
    { name: "Biscuits", riskScore: 2 },
    { name: "Cream Biscuits", riskScore: 3 },
    { name: "Chocolates", riskScore: 3 },
    { name: "Candies", riskScore: 3 },
    { name: "Chips", riskScore: 2 },
    { name: "Mixture", riskScore: 2 },
    { name: "Murukku", riskScore: 2 },
    { name: "Samosa", riskScore: 2 },
    { name: "Pakora", riskScore: 2 },
    { name: "Bhel Puri", riskScore: 2 },
    { name: "Pani Puri", riskScore: 2 },
    { name: "Cake", riskScore: 3 },
    { name: "Pastries", riskScore: 3 },
    { name: "Ice Cream", riskScore: 3 },
    { name: "Popcorn", riskScore: 1 },
  ],
  drinks: [
    { name: "Water", riskScore: -1 },
    { name: "Plain Milk", riskScore: -1 },
    { name: "Milk with Sugar", riskScore: 2 },
    { name: "Tea", riskScore: 1 },
    { name: "Coffee", riskScore: 1 },
    { name: "Soft Drinks", riskScore: 3 },
    { name: "Packaged Juice", riskScore: 3 },
    { name: "Milkshake", riskScore: 2 },
    { name: "Flavored Milk", riskScore: 2 },
    { name: "Coconut Water", riskScore: -1 },
    { name: "Buttermilk", riskScore: -1 },
  ],
};

export const MEAL_LABELS: Record<MealCategory, string> = {
  breakfast: "🌅 Breakfast",
  lunch: "🍚 Lunch",
  dinner: "🌙 Dinner",
  snacks: "🍪 Snacks",
  drinks: "🥤 Drinks",
};

export type FoodSelections = Record<MealCategory, string[]>;

export function emptySelections(): FoodSelections {
  return { breakfast: [], lunch: [], dinner: [], snacks: [], drinks: [] };
}

/**
 * Calculate a food-based risk score from selections.
 * Returns a normalized value 0-100.
 */
export function calculateFoodRisk(selections: FoodSelections): number {
  let totalScore = 0;
  let itemCount = 0;

  for (const category of Object.keys(selections) as MealCategory[]) {
    const items = FOOD_DATA[category];
    for (const selected of selections[category]) {
      const item = items.find((i) => i.name === selected);
      if (item) {
        totalScore += item.riskScore;
        itemCount++;
      }
    }
  }

  if (itemCount === 0) return 0;

  // Max possible per item is 3, min is -1. Normalize to 0-100.
  // Average score range: -1 to 3 → shift to 0-4 → divide by 4 → multiply by 100
  const avgScore = totalScore / itemCount;
  const normalized = Math.min(100, Math.max(0, ((avgScore + 1) / 4) * 100));
  return Math.round(normalized);
}
