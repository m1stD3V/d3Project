import { type Recipe, SPAWN } from "./items.ts";
import { isPassable, type Terrain } from "./terrain.ts";

export function canReach(recipes: Recipe[]): Recipe[] {
  const reached = new Set<string>();
  const made = new Set<Recipe>();

  // 1. Collect all items accessible with bare hands
  for (const [terrain, { items }] of Object.entries(SPAWN)) {
    if (isPassable(terrain as Terrain, {})) {
      for (const item of items) reached.add(item);
    }
  }

  // 2. Loop until no new recipes or barrier-opened items are discovered
  let changed = true;
  while (changed) {
    changed = false;
    for (const recipe of recipes) {
      if (made.has(recipe)) continue;

      const needsMet = Object.keys(recipe.needs).every((item) =>
        reached.has(item)
      );
      const toolMet = !recipe.tool || reached.has(recipe.tool);

      if (needsMet && toolMet) {
        made.add(recipe);
        reached.add(recipe.makes);

        // Add items from any terrain opened by this crafted item
        for (const [terrain, { items }] of Object.entries(SPAWN)) {
          if (isPassable(terrain as Terrain, { [recipe.makes]: 1 })) {
            for (const item of items) reached.add(item);
          }
        }

        changed = true;
      }
    }
  }

  // 3. Return any recipes that could not be crafted
  return recipes.filter((recipe) => !made.has(recipe));
}
