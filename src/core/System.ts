import type { World } from "../index.js";

export abstract class System {
  protected world!: World;

  /** @internal */
  setWorld(world: World): void {
    this.world = world;
  }

  init?(): void;

  abstract update(deltaTime: number): void;

  cleanup?(): void;
}
