import { assertEquals } from "@std/assert";
import { apply, newGame } from "./mod.ts";

Deno.test("commands after ending change nothing and return empty", () => {
  const state = newGame(121);
  state.ended = true;
  const snapshot = JSON.parse(JSON.stringify(state));

  assertEquals(apply(state, { type: "move", direction: "east" }), []);
  assertEquals(apply(state, { type: "gather" }), []);
  assertEquals(apply(state, { type: "craft", recipe: "wrench" }), []);
  assertEquals(state, snapshot);
});
