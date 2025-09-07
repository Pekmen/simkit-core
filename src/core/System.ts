import type { World } from "./World";

export abstract class System {
  protected world: World;

  constructor(world: World) {
    this.world = world;
  }

  abstract update(deltaTime: number): void;
}
