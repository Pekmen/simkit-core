import type { System } from "./System.js";
import type { World } from "./World.js";

export class SystemManager {
  private systems: System[] = [];

  addSystem<T extends System>(
    world: World,
    systemClass: new (world: World) => T,
  ): T {
    const system = new systemClass(world);
    const systemName = systemClass.name || "AnonymousSystem";

    if (typeof system.init !== "function") {
      throw new Error(
        `SystemManager: System "${systemName}" is invalid. Missing required init() method. ` +
          `All systems must extend the System class and implement init(), update(), and cleanup().`,
      );
    }
    if (typeof system.update !== "function") {
      throw new Error(
        `SystemManager: System "${systemName}" is invalid. Missing required update() method. ` +
          `All systems must extend the System class and implement init(), update(), and cleanup().`,
      );
    }
    if (typeof system.cleanup !== "function") {
      throw new Error(
        `SystemManager: System "${systemName}" is invalid. Missing required cleanup() method. ` +
          `All systems must extend the System class and implement init(), update(), and cleanup().`,
      );
    }

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
