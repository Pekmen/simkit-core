import type { World } from "../index.js";
import { assert } from "./assert.js";

export abstract class System {
  constructor(protected world: World) {
    assert(Boolean(world), "World must be provided to System");
  }

  init?(): void;

  abstract update(deltaTime: number): void;

  cleanup?(): void;
}
