import { assertEquals } from "@std/assert";
import {
  apply,
  type GameState,
  isPassable,
  itemAt,
  newGame,
  terrainAt,
} from "./mod.ts";

// Each test has a Given-When-Then shape: https://martinfowler.com/bliki/GivenWhenThen.html
const SEED = 121;

// A state with the player just west of a cell that is, or is not, passable.
// Searching keeps these tests honest if the terrain formula changes.
function besideEasternCell(passable: boolean): GameState {
  for (let x = 2; x < 10_000; x++) {
    const here = isPassable(terrainAt(SEED, x, 0));
    const east = isPassable(terrainAt(SEED, x + 1, 0));
    if (here && east === passable) {
      return {
        seed: SEED,
        player: { x, y: 0 },
        inventory: {},
        taken: [],
        ended: false,
      };
    }
  }
  throw new Error("Found no suitable cell on this row.");
}

Deno.test("moving onto passable terrain moves the player", () => {
  const state = besideEasternCell(true);
  const { x, y } = state.player;

  const events = apply(state, { type: "move", direction: "east" });

  assertEquals(state.player, { x: x + 1, y });
  assertEquals(events, [
    {
      type: "moved",
      from: { x, y },
      to: { x: x + 1, y },
    },
  ]);
});

Deno.test("a blocked move changes nothing and reports why", () => {
  const state = besideEasternCell(false);
  const snapshot = JSON.parse(JSON.stringify(state));
  const { x, y } = state.player;
  const target = { x: x + 1, y };

  const events = apply(state, { type: "move", direction: "east" });

  assertEquals(state, snapshot);
  assertEquals(events, [
    {
      type: "blocked",
      at: { x, y },
      toward: target,
      terrain: terrainAt(SEED, target.x, target.y),
    },
  ]);
});

Deno.test("an event keeps its cells while state moves on", () => {
  const state = besideEasternCell(true);
  const { x, y } = state.player;

  const first = apply(state, { type: "move", direction: "east" });
  const second = apply(state, { type: "move", direction: "west" });
  apply(state, { type: "move", direction: "east" });

  // Both retained events still report the cells from when they happened, even
  // though state.player has since changed.
  assertEquals(first, [
    {
      type: "moved",
      from: { x, y },
      to: { x: x + 1, y },
    },
  ]);
  assertEquals(second, [
    {
      type: "moved",
      from: { x: x + 1, y },
      to: { x, y },
    },
  ]);
});

Deno.test("an item can be gathered once, then the cell is empty", () => {
  const state = newGame(SEED);
  let found: { x: number; y: number } | null = null;
  for (let x = 4; x < 500 && !found; x++) {
    if (itemAt(SEED, x, 0)) found = { x, y: 0 };
  }
  state.player = found!;
  const item = itemAt(SEED, found!.x, found!.y)!;

  const first = apply(state, { type: "gather" });
  const second = apply(state, { type: "gather" });

  assertEquals(first[0].type, "gathered");
  assertEquals(state.inventory[item], 1);
  assertEquals(second, [{ type: "refused", reason: "nothing here" }]);
});

Deno.test(
  "crafting is refused without materials and spends them when made",
  () => {
    const state = newGame(SEED);
    assertEquals(apply(state, { type: "craft", recipe: "wrench" }), [
      { type: "refused", reason: "need more Iron" },
    ]);

    state.inventory = { iron: 2, scrap: 1 };
    assertEquals(apply(state, { type: "craft", recipe: "wrench" }), [
      { type: "crafted", item: "wrench" },
    ]);
    assertEquals(state.inventory, { iron: 0, scrap: 0, wrench: 1 });
  },
);
