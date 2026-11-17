import { assertEquals } from "@std/assert";
import { apply, newGame } from "./mod.ts";

// Barrier tests: Confirms chasm is impassable without item,
// opens when holding a ladder, and allows gathering rare items once inside
Deno.test("shut before", () => {
  const state = newGame(121);
  state.player = { x: 6, y: 0 };
  const events = apply(state, { type: "move", direction: "east" });

  assertEquals(state.player, { x: 6, y: 0 });

  assertEquals(events, [
    {
      type: "blocked",
      at: { x: 6, y: 0 },
      toward: { x: 7, y: 0 },
      terrain: "chasm",
    },
  ]);
});

Deno.test("open after", () => {
  const state = newGame(121);
  state.player = { x: 6, y: 0 };
  state.inventory = { ladder: 1 };
  const events = apply(state, { type: "move", direction: "east" });

  assertEquals(state.player, { x: 7, y: 0 });

  assertEquals(events, [
    {
      type: "moved",
      from: { x: 6, y: 0 },
      to: { x: 7, y: 0 },
    },
  ]);
});

Deno.test("gathering and working inside", () => {
  const state = newGame(121);
  state.player = { x: 8, y: 0 };
  state.inventory = { ladder: 1 };
  const events = apply(state, { type: "gather" });

  assertEquals(state.player, { x: 8, y: 0 });

  assertEquals(events, [
    {
      type: "gathered",
      at: { x: 8, y: 0 },
      item: "darkMatter",
    },
  ]);

  assertEquals(state.inventory.darkMatter, 1);
});
