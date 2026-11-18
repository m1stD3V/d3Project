import { assertEquals } from "@std/assert";
import run from "./run.json" with { type: "json" };
import { apply, type Command, type GameEvent, newGame } from "./mod.ts";

function play() {
  const state = newGame(run.seed);
  const events: GameEvent[] = [];
  for (const command of run.commands as Command[]) {
    events.push(...apply(state, command));
  }
  return { state, events };
}

Deno.test("replaying recorded run finishes the game", () => {
  const { state } = play();
  assertEquals(state.ended, true);
  assertEquals(state.inventory.finalShip, 1);
});

Deno.test("replaying the run is completely deterministic", () => {
  const first = play();
  const start = Date.now();
  while (Date.now() === start);
  const second = play();
  assertEquals(first, second);
});
