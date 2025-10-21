import type { World } from "../index.js";
import { assert } from "./assert.js";

export abstract class System {
  constructor(protected world: World) {
    assert(Boolean(world), "World must be provided to System");
  }

  // eslint-disable-next-line @typescript-eslint/no-empty-function
  init(): void {}

  abstract update(deltaTime: number): void;

  // eslint-disable-next-line @typescript-eslint/no-empty-function
  cleanup(): void {}
}
