// The rules of the game. There is no clock here: a command updates the state at
// once, and the events it returns are a record of what happened. Whoever called
// apply() decides how, or whether, to show them over time.

import {
  add,
  cellKey,
  type Inventory,
  itemAt,
  type ItemId,
  RECIPES,
  spend,
  whyNot,
} from "./items.ts";
import { isPassable, type Terrain, terrainAt } from "./terrain.ts";

export type Cell = { x: number; y: number };

export type Direction = "north" | "south" | "east" | "west";

// Plain data that survives JSON. Terrain is absent because the seed can recompute
// it: besides the seed, only what the player has caused belongs here.
export type GameState = {
  seed: number;
  player: Cell;
  inventory: Inventory;
  taken: string[];
  ended: boolean;
};

// Command: https://gameprogrammingpatterns.com/command.html
export type Command =
  | { type: "move"; direction: Direction }
  | { type: "gather" }
  | { type: "craft"; recipe: string };

// Domain Event: https://martinfowler.com/eaaDev/DomainEvent.html
export type GameEvent =
  | { type: "moved"; from: Cell; to: Cell }
  | { type: "blocked"; at: Cell; toward: Cell; terrain: Terrain }
  | { type: "gathered"; at: Cell; item: ItemId }
  | { type: "crafted"; item: ItemId }
  | { type: "refused"; reason: string }
  | { type: "ended" };

const STEPS: Record<Direction, Cell> = {
  north: { x: 0, y: -1 },
  south: { x: 0, y: 1 },
  east: { x: 1, y: 0 },
  west: { x: -1, y: 0 },
};

// Singleton, avoided on purpose: tests make as many games as they need. https://gameprogrammingpatterns.com/singleton.html
export function newGame(seed: number): GameState {
  return {
    seed,
    player: { x: 0, y: 0 },
    inventory: {},
    taken: [],
    ended: false,
  };
}

// The single way in. It updates the state it is given and returns the events.
export function apply(state: GameState, command: Command): GameEvent[] {
  if (state.ended) return [];

  switch (command.type) {
    case "move":
      return move(state, command.direction);
    case "gather":
      return gather(state);
    case "craft":
      return craft(state, command.recipe);
  }
}

function move(state: GameState, direction: Direction): GameEvent[] {
  const step = STEPS[direction];
  // Events are retained and played back later, while state keeps changing. So an
  // event gets cells of its own, never an object that state still holds.
  // Aliasing Bug: https://martinfowler.com/bliki/AliasingBug.html
  // Cells in events act as a Value Object: https://martinfowler.com/bliki/ValueObject.html
  const from = { ...state.player };
  const to = { x: from.x + step.x, y: from.y + step.y };
  const terrain = terrainAt(state.seed, to.x, to.y);
  if (!isPassable(terrain, state.inventory)) {
    return [{ type: "blocked", at: from, toward: to, terrain }];
  }
  state.player.x = to.x;
  state.player.y = to.y;
  return [{ type: "moved", from, to }];
}

function gather(state: GameState): GameEvent[] {
  const at = { ...state.player };
  const key = cellKey(at.x, at.y);
  const item = itemAt(state.seed, at.x, at.y);
  if (!item || state.taken.includes(key)) {
    return [{ type: "refused", reason: "nothing here" }];
  }
  state.taken.push(key);
  add(state.inventory, item);
  return [{ type: "gathered", at, item }];
}

function craft(state: GameState, id: string): GameEvent[] {
  const recipe = RECIPES.find((r) => r.id === id);
  if (!recipe) return [{ type: "refused", reason: "unknown recipe" }];
  const terrain = terrainAt(state.seed, state.player.x, state.player.y);
  const reason = whyNot(state.inventory, recipe, terrain);
  if (reason) return [{ type: "refused", reason }];
  spend(state.inventory, recipe);
  add(state.inventory, recipe.makes);

  if (recipe.id === "finalShip") {
    state.ended = true;
    return [
      { type: "crafted", item: recipe.makes },
      { type: "ended" },
    ];
  }
  return [{ type: "crafted", item: recipe.makes }];
}
