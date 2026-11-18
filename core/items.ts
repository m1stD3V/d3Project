import { gridValue, type Terrain, terrainAt } from "./terrain.ts";

export type ItemId =
  | "uranium"
  | "iron"
  | "platinum"
  | "water"
  | "scrap"
  | "fuel"
  | "hullPlate"
  | "wrench"
  | "ladder"
  | "darkMatter"
  | "finalShip";

export type Inventory = Partial<Record<ItemId, number>>;

export type TerrainName = Terrain;

export const ITEM_LABEL: Record<ItemId, string> = {
  uranium: "Uranium",
  iron: "Iron",
  platinum: "Platinum",
  water: "Water",
  scrap: "Scrap",
  fuel: "Fuel Cell",
  hullPlate: "Hull Plate",
  wrench: "Wrench",
  ladder: "Ladder",
  darkMatter: "Dark Matter",
  finalShip: "Final Ship",
};

export const SPAWN: Record<TerrainName, { chance: number; items: ItemId[] }> = {
  wasteland: { chance: 0.08, items: ["uranium"] },
  impact: { chance: 0.12, items: ["iron", "iron", "platinum"] },
  settlement: { chance: 0.07, items: ["water", "scrap"] },
  crash: { chance: 0, items: [] },
  chasm: { chance: 0.05, items: ["darkMatter"] },
};

export function cellKey(x: number, y: number): string {
  return `${x},${y}`;
}

export function itemAt(seed: number, x: number, y: number): ItemId | null {
  const { chance, items } = SPAWN[terrainAt(seed, x, y)];
  if (items.length === 0) return null;
  const roll = gridValue(seed + 3, x, y);
  if (roll >= chance) return null;
  return items[Math.floor((roll / chance) * items.length)];
}

export type Recipe = {
  id: string;
  label: string;
  makes: ItemId;
  needs: Inventory;
  at: TerrainName;
  tool?: ItemId;
};

export const RECIPES: Recipe[] = [
  {
    id: "wrench",
    label: "Wrench",
    makes: "wrench",
    needs: { iron: 2, scrap: 1 },
    at: "crash",
  },
  {
    id: "fuel",
    label: "Fuel Cell",
    makes: "fuel",
    needs: { uranium: 3, water: 1, darkMatter: 1 },
    at: "crash",
    tool: "wrench",
  },
  {
    id: "hullPlate",
    label: "Hull Plate",
    makes: "hullPlate",
    needs: { iron: 4, platinum: 1, scrap: 2 },
    at: "crash",
    tool: "wrench",
  },
  {
    id: "ladder",
    label: "Ladder",
    makes: "ladder",
    needs: { scrap: 3 },
    at: "crash",
    tool: "wrench",
  },
  {
    id: "finalShip",
    label: "Final Ship",
    makes: "finalShip",
    needs: { fuel: 1, hullPlate: 2 },
    at: "crash",
    tool: "wrench",
  },
];

export function count(inventory: Inventory, item: ItemId): number {
  return inventory[item] ?? 0;
}

export function add(inventory: Inventory, item: ItemId, amount = 1) {
  inventory[item] = count(inventory, item) + amount;
}

export function whyNot(
  inventory: Inventory,
  recipe: Recipe,
  terrain: string,
): string | null {
  if (terrain !== recipe.at) return `must craft at ${recipe.at}`;
  if (recipe.tool && count(inventory, recipe.tool) < 1) {
    return `need a ${ITEM_LABEL[recipe.tool]}`;
  }
  for (const [item, needed] of Object.entries(recipe.needs)) {
    if (count(inventory, item as ItemId) < needed) {
      return `need more ${ITEM_LABEL[item as ItemId]}`;
    }
  }
  return null;
}

export function spend(inventory: Inventory, recipe: Recipe) {
  for (const [item, needed] of Object.entries(recipe.needs)) {
    add(inventory, item as ItemId, -needed);
  }
}
