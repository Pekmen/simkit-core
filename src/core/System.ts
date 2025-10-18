import { World } from "../index.js";

export abstract class System {
  constructor(protected world: World) {}

  init(): void {
    /* empty */
  }

  abstract update(deltaTime: number): void;

  cleanup(): void {
    /* empty */
  }
}
