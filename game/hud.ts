import {
  add,
  type GameEvent,
  type GameState,
  type Inventory,
  ITEM_LABEL,
  type ItemId,
  RECIPES,
  spend,
  terrainAt,
} from "../core/mod.ts";

function element(id: string): HTMLElement {
  return document.getElementById(id)!;
}

function describe(event: GameEvent): string {
  switch (event.type) {
    case "moved":
      return `moved to ${event.to.x}, ${event.to.y}`;
    case "blocked":
      return `blocked by ${event.terrain} at ${event.toward.x}, ${event.toward.y}`;
    case "gathered":
      return `gathered ${ITEM_LABEL[event.item]}`;
    case "crafted":
      return `crafted ${ITEM_LABEL[event.item]}`;
    case "refused":
      return event.reason;
    case "ended":
      return "repaired the ship and escaped !";
  }
}

// The readout, as ordinary page elements that CSS can style and that assistive
// tools can read. It changes only as events play.
export class Hud {
  private readonly seed: number;
  private readonly counts: Inventory;

  constructor(state: GameState) {
    this.seed = state.seed;
    this.counts = { ...state.inventory };
    this.showPosition(state.player.x, state.player.y);
    this.showInventory();
  }

  show(event: GameEvent) {
    element("live").textContent = describe(event);
    if (event.type === "moved") this.showPosition(event.to.x, event.to.y);
    if (event.type === "gathered") {
      add(this.counts, event.item);
      this.showInventory();
    }
    if (event.type === "crafted") {
      const recipe = RECIPES.find((r) => r.makes === event.item);
      if (recipe) spend(this.counts, recipe);
      add(this.counts, event.item);
      this.showInventory();
    }
    if (event.type === "ended") {
      element("victory").hidden = false;
    }
  }

  private showPosition(x: number, y: number) {
    element("position").textContent = `${x}, ${y}`;
    element("terrain").textContent = terrainAt(this.seed, x, y);
  }

  private showInventory() {
    const list = element("inventory");
    list.replaceChildren();
    for (const [item, amount] of Object.entries(this.counts)) {
      if (!amount) continue;
      const row = document.createElement("li");
      row.textContent = `${ITEM_LABEL[item as ItemId]}: ${amount}`;
      list.append(row);
    }
  }
}
