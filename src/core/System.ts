import type { World } from "../index.js";

export abstract class System {
  constructor(protected world: World) {}

  // eslint-disable-next-line @typescript-eslint/no-empty-function
  init(): void {}

  abstract update(deltaTime: number): void;

  // eslint-disable-next-line @typescript-eslint/no-empty-function
  cleanup(): void {}
}
