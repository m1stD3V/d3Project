# SpaceCrafter

SpaceCrafter is a game in which you are a stranded space explorer thrust into a dangerous, near inhabitable planet, and you must repair your ship to escape. You gather materials from the different enviornments to craft key components while managing your own surivial. Will you fix the ship in time? Or will the next castaway find your bones upon this dead planet?

Link: https://m1std3v.github.io/d3Project/

How to Play: Use the arrow keys to move the player, press E to gather resources, and click to craft items.

How to Run Locally: deno task setup, deno task dev, deno task test

How to Add a Recipe: Add a new row to RECIPES in core/items.ts

Promoted Bug: Crafting away from the Crash Site

While playing we clicked the items outside of the crash site and realize we we're able to create the item. So our Rule became all recipes must be crafted on the spaceship workshop tiles. The test now lives in core/recipe_test.ts

```ts
Deno.test("crafting away from required terrain is refused and changes nothing", () => {
  const state = newGame(121);
  state.player = { x: 6, y: 0 }; // wasteland, away from crash site
  state.inventory = { iron: 2, scrap: 1 };
  const snapshot = JSON.parse(JSON.stringify(state));
  const events = apply(state, { type: "craft", recipe: "wrench" });
  assertEquals(state, snapshot);
  assertEquals(events, [{ type: "refused", reason: "must craft at crash" }]);
});
```
