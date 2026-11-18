import { assert, assertEquals } from "@std/assert";
import { apply, newGame, RECIPES, SPAWN } from "./mod.ts";

//Recipe content and rule tests: check that every ingredient has a source,
// failed crafts change nothing, and successful crafts deduct materials dynamically
Deno.test("every recipe ingredient has a source", () => {
  const sources = new Set<string>();

  for (const entry of Object.values(SPAWN)) {
    for (const item of entry.items) {
      sources.add(item);
    }
  }

  for (const recipe of RECIPES) {
    sources.add(recipe.makes);
  }

  for (const check of RECIPES) {
    if (check.tool) {
      assert(
        sources.has(check.tool),
        `recipe ${check.id} requires tool ${check.tool}, which has no source`,
      );
    }

    const ingredients = Object.keys(check.needs);
    for (const ingredient of ingredients) {
      assert(
        sources.has(ingredient),
        `recipe ${check.id} requires ${ingredient}, which has no source`,
      );
    }
  }
});

Deno.test("a failed craft changes nothing and reports why", () => {
  const state = newGame(121);
  const snapshot = JSON.parse(JSON.stringify(state));

  const events = apply(state, { type: "craft", recipe: RECIPES[0].id });

  assertEquals(state, snapshot);
  assertEquals(events[0].type, "refused");
});

Deno.test("crafting spends materials and grants player correct item", () => {
  const recipe = RECIPES[0];
  const state = newGame(121);

  state.inventory = { ...recipe.needs };

  if (recipe.tool) state.inventory[recipe.tool] = 1;

  const events = apply(state, { type: "craft", recipe: recipe.id });

  assertEquals(events, [{ type: "crafted", item: recipe.makes }]);

  assertEquals(state.inventory[recipe.makes], 1);

  for (const item of Object.keys(recipe.needs)) {
    assertEquals(state.inventory[item as keyof typeof state.inventory], 0);
  }
});

Deno.test("crafting away from required terrain is refused and changes nothing", () => {
  const state = newGame(121);
  state.player = { x: 6, y: 0 }; // wasteland, away from crash site
  state.inventory = { iron: 2, scrap: 1 };
  const snapshot = JSON.parse(JSON.stringify(state));
  const events = apply(state, { type: "craft", recipe: "wrench" });
  assertEquals(state, snapshot);
  assertEquals(events, [{ type: "refused", reason: "must craft at crash" }]);
});

Deno.test("a crafted event remains unchanged when crafting again", () => {
  const recipe = RECIPES[0];
  const state = newGame(121);
  state.inventory = { iron: 4, scrap: 2 };

  const first = apply(state, { type: "craft", recipe: recipe.id });
  const second = apply(state, { type: "craft", recipe: recipe.id });

  assertEquals(first, [{ type: "crafted", item: recipe.makes }]);
  assertEquals(second, [{ type: "crafted", item: recipe.makes }]);
});
