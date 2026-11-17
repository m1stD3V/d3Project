import {
  type Command,
  type GameState,
  RECIPES,
  terrainAt,
  whyNot,
} from "../core/mod.ts";

// Renders recipe buttons and updates labels in place so keyboard focus isn't lost
export class RecipeBook {
  private readonly state: GameState;
  private readonly buttons: HTMLButtonElement[] = [];

  constructor(
    listElement: HTMLElement,
    state: GameState,
    craft: (command: Command) => void,
  ) {
    this.state = state;
    for (const recipe of RECIPES) {
      const li = document.createElement("li");
      const button = document.createElement("button");
      button.type = "button";
      button.addEventListener("click", (event) => {
        craft({ type: "craft", recipe: recipe.id });
        // Mouse clicks return focus so arrow keys keep moving; keyboard keeps focus
        if (event.detail > 0) button.blur();
      });
      li.append(button);
      listElement.append(li);
      this.buttons.push(button);
    }
    this.update();
  }

  update() {
    const { x, y } = this.state.player;
    const terrain = terrainAt(this.state.seed, x, y);
    for (let i = 0; i < RECIPES.length; i++) {
      const recipe = RECIPES[i];
      const button = this.buttons[i];
      const reason = whyNot(this.state.inventory, recipe, terrain);
      if (!reason) {
        button.textContent = `Craft ${recipe.label}`;
      } else {
        button.textContent = `${recipe.label} (${reason})`;
      }
    }
  }
}
