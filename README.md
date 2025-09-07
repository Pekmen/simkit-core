# SimKit ECS Library

A **lightweight, type-safe Entity-Component-System (ECS) library** for TypeScript.

It allows you to create entities, attach components, define systems, and run simulations in a structured and type-safe way.

---

## Getting Started

Clone the repository:

```bash
git clone git@github.com:Pekmen/simkit-ecs.git
```

Then import modules directly from the `src` folder:

```ts
import { World, defineComponent, System } from "./src/core";
```

---

## Components

Define components with `defineComponent`. Components hold data for your entities.

```ts
import { defineComponent } from "./src/core";

interface Position {
  x: number;
  y: number;
}
interface Velocity {
  dx: number;
  dy: number;
}

const PositionComponent = defineComponent<Position>("Position", { x: 0, y: 0 });
const VelocityComponent = defineComponent<Velocity>("Velocity", {
  dx: 0,
  dy: 0,
});
```

- **`create(data?)`** returns a component object, merging defaults with optional overrides.

---

## Entities

Create entities and attach components via the `World`.

```ts
import { World } from "./src/core";

const world = new World();
const player = world.createEntity();
world.addComponent(player, PositionComponent, { x: 5, y: 5 });
world.addComponent(player, VelocityComponent, { dx: 1, dy: 1 });
```

- `createEntity()` → returns a unique `EntityId`.
- `destroyEntity(entityId)` → removes the entity and its components.

---

## Systems

Define logic by extending `System`. Systems update entities each frame.

```ts
import { System } from "./src/core";

class MovementSystem extends System {
  update(deltaTime: number) {
    for (const entity of [player]) {
      const pos = this.world.getComponent(entity, PositionComponent);
      const vel = this.world.getComponent(entity, VelocityComponent);
      if (pos && vel) {
        pos.x += vel.dx * deltaTime;
        pos.y += vel.dy * deltaTime;
        this.world.updateComponent(entity, PositionComponent, () => pos);
      }
    }
  }
}

world.addSystem(new MovementSystem(world));
```

- `update(deltaTime)` is called every simulation tick.
- Access components through the world, update safely.

---

## Updating Components

Read and modify components using `getComponent` and `updateComponent`.

```ts
const pos = world.getComponent(player, PositionComponent);
if (pos) {
  pos.x += 10;
  world.updateComponent(player, PositionComponent, () => pos);
}
```

- `updateComponent` returns `false` if the component does not exist.

---

## Removing Components

```ts
world.removeComponent(player, VelocityComponent); // returns true if removed
world.removeComponent(player, VelocityComponent); // returns false if not present
```

---

## Running the Simulation

```ts
console.log("Before update:", world.getComponent(player, PositionComponent));
world.update(1); // advance 1 time unit
console.log("After update:", world.getComponent(player, PositionComponent));
```

---

## Example Usage

You can see full runnable examples in the `examples/` folder:

- `examples/basic.ts` — basic creation, components, systems, and updates.

---

## API Overview

| Class / Function                  | Description                                    |
| --------------------------------- | ---------------------------------------------- |
| `World`                           | Manages entities, components, and systems.     |
| `System`                          | Base class for game logic systems.             |
| `ComponentStorage`                | Internal storage for a single component type.  |
| `ComponentRegistry`               | Tracks all component storages.                 |
| `defineComponent(name, defaults)` | Defines a typed component with default values. |

**World Methods**

- `createEntity(): EntityId`
- `destroyEntity(entityId: EntityId): void`
- `addComponent(entityId, componentType, data?)`
- `removeComponent(entityId, componentType)`
- `getComponent(entityId, componentType)`
- `updateComponent(entityId, componentType, updater)`
- `hasComponent(entityId, componentType)`
- `addSystem(system: System)`
- `update(deltaTime: number)`

---

This README provides everything a user needs to **start using SimKit ECS**, including components, entities, systems, updates, and example references.
