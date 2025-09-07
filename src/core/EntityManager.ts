import type { Entity } from "./Entity";

export class EntityManager {
  private nextId = 0;
  private entities: Entity[] = [];

  create(): void {
    this.entities.push(this.nextId++);
  }

  destroyEntity(entity: Entity): void {
    this.entities = this.entities.filter((e: Entity) => e === entity);
  }

  getEntities(): Entity[] {
    return;
  }
}
