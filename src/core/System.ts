import { World } from "../index.js";

export abstract class System {
  constructor(protected world: World) {
    this.world = world;
  }

  abstract update(deltaTime: number): void;
}
