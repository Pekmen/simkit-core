import type { System } from "./System.js";
import type { World } from "./World.js";
import { assert } from "./assert.js";

export class SystemManager {
  private systems: System[] = [];

  addSystem<T extends System>(
    world: World,
    systemClass: new (world: World) => T,
  ): T {
    const system = new systemClass(world);

    assert(
      typeof system.init === "function",
      "System must have an init method",
    );
    assert(
      typeof system.update === "function",
      "System must have an update method",
    );
    assert(
      typeof system.cleanup === "function",
      "System must have a cleanup method",
    );

    this.systems.push(system);
    system.init();
    return system;
  }

  removeSystem(system: System): boolean {
    const index = this.systems.indexOf(system);
    if (index === -1) return false;

    system.cleanup();
    this.systems.splice(index, 1);
    return true;
  }

  getSystems(): readonly System[] {
    return this.systems;
  }

  clearSystems(): void {
    for (const system of this.systems) {
      system.cleanup();
    }
    this.systems = [];
  }

  update(deltaTime: number): void {
    for (const system of this.systems) {
      system.update(deltaTime);
    }
  }
}
