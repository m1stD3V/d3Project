import { assertEquals } from "@std/assert";
import { canReach, type Recipe, RECIPES } from "./mod.ts";

Deno.test("all real recipes can be reached", () => {
  assertEquals(canReach(RECIPES), []);
});

Deno.test("a recipe requiring its own output is unreachable", () => {
  const brokenRecipe: Recipe = {
    id: "loop",
    label: "Loop",
    makes: "fuel",
    needs: { fuel: 1 },
    at: "crash",
  };
  assertEquals(canReach([brokenRecipe]), [brokenRecipe]);
});
