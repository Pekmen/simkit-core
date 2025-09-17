import type { World } from "./World.js";

export abstract class System {
  constructor(protected world: World) {
    this.world = world;
  }

  abstract update(deltaTime: number): void;
}
