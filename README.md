# simkit-core

A lightweight, type-safe Entity-Component-System (ECS) library for TypeScript

<!-- BENCHMARK_START -->

## Performance

Latest benchmark results for version 0.7.7 (10/19/2025):

| Benchmark | Operations/sec |
|-----------|---------------:|
| Packed Iteration (5 queries) | 13,345 |
| Simple Iteration | 6,380 |
| Fragmented Iteration | 25,489 |
| Entity Cycle | 3,425 |
| Add/Remove Component | 4,568 |

### Benchmark Descriptions

- **Packed Iteration (5 queries)**: Tests core iteration overhead with multiple queries on 1,000 entities
- **Simple Iteration**: Tests independent systems on entities with different component combinations  
- **Fragmented Iteration**: Tests iteration through fragmented dataset (26 component types)
- **Entity Cycle**: Tests entity creation and destruction performance
- **Add/Remove Component**: Tests component addition and removal on existing entities

*Benchmarks run on Node.js v22.20.0 on linux*

<!-- BENCHMARK_END -->

## Installation

### Using npm

```bash
npm install simkit-core
```

### Using yarn

```bash
yarn add simkit-core
```

### Using pnpm

```bash
pnpm add simkit-core
```

### From GitHub

```bash
npm install github:Pekmen/simkit-core
```

### Development Installation

If you want to contribute or run the examples:

```bash
# Clone the repository
git clone https://github.com/Pekmen/simkit-core.git
cd simkit-core

# Install dependencies
npm install

# Run tests
npm test

# Build the library
npm run build

# Run the example
npm run start examples/basic.ts
```

## Features

- 🚀 **High Performance**: Optimized for game development and simulations
- 🔒 **Type Safe**: Full TypeScript support with type inference
- 🧩 **Simple API**: Easy to learn and use
- 🔧 **Flexible**: Supports complex component relationships
- 📦 **Lightweight**: Minimal dependencies and small bundle size
- 💾 **Serialization**: Built-in save/load functionality for persistent game states

## Quick Start

```typescript
import { World, System, defineComponent } from "simkit-core";

// Define components
interface Position {
  x: number;
  y: number;
}

interface Velocity {
  dx: number;
  dy: number;
}

const Position = defineComponent<Position>("Position", { x: 0, y: 0 });
const Velocity = defineComponent<Velocity>("Velocity", { dx: 0, dy: 0 });

// Create a system
class MovementSystem extends System {
  update(deltaTime: number): void {
    const entities = this.world.getAllEntities();

    for (const entity of entities) {
      const pos = this.world.getComponent(entity, Position);
      const vel = this.world.getComponent(entity, Velocity);

      if (pos && vel) {
        pos.x += vel.dx * deltaTime;
        pos.y += vel.dy * deltaTime;
      }
    }
  }
}

// Create world and add system
const world = new World();
world.addSystem(new MovementSystem(world));

// Create entities
const player = world.createEntity();
world.addComponent(player, Position, { x: 0, y: 0 });
world.addComponent(player, Velocity, { dx: 1, dy: 1 });

// Run the simulation
world.update(16); // 16ms delta time
```

## API Reference

### World

The main ECS container that manages entities, components, and systems.

```typescript
const world = new World();

// Entity management
const entity = world.createEntity();
world.destroyEntity(entity);
world.getAllEntities();
world.getEntityCount();

// Component management
world.addComponent(entity, ComponentType, data);
world.removeComponent(entity, ComponentType);
world.getComponent(entity, ComponentType);
world.hasComponent(entity, ComponentType);

// System management
world.addSystem(system);
world.update(deltaTime);
```

### defineComponent

Creates a component type with default values and type safety.

```typescript
interface Health {
  current: number;
  max: number;
}

const Health = defineComponent<Health>("Health", {
  current: 100,
  max: 100,
});

// Usage
world.addComponent(entity, Health, { current: 80 }); // max will be 100
```

### System

Base class for creating systems that operate on entities and components.

```typescript
class HealthSystem extends System {
  update(deltaTime: number): void {
    const entities = this.world.getAllEntities();

    for (const entity of entities) {
      const health = this.world.getComponent(entity, Health);
      if (health && health.current <= 0) {
        this.world.destroyEntity(entity);
      }
    }
  }
}
```

### Serialization

Save and load your entire game state with built-in JSON serialization.

```typescript
import { World, defineComponent } from "simkit-core";

// Define components
const Position = defineComponent("Position", { x: 0, y: 0 });
const Health = defineComponent("Health", { hp: 100 });

// Create and populate world
const world = new World();
const entity = world.createEntity();
world.addComponent(entity, Position, { x: 100, y: 200 });
world.addComponent(entity, Health, { hp: 80 });

// SAVE: Serialize world to JSON
const snapshot = world.toJSON();
const jsonString = JSON.stringify(snapshot);

// Save to localStorage (browser)
localStorage.setItem("gameState", jsonString);

// Or save to file (Node.js)
// fs.writeFileSync('savegame.json', jsonString);

// LOAD: Deserialize world from JSON
const savedData = localStorage.getItem("gameState");
if (savedData) {
  // Important: Provide all component types used in the saved world
  const restoredWorld = World.fromJSON(savedData, [Position, Health]);

  // All entities and components are restored
  console.log(restoredWorld.getEntityCount()); // Same as before
  console.log(restoredWorld.getComponent(entity, Position)); // { x: 100, y: 200 }
}
```

**Key Points:**

- **Systems and queries are NOT serialized** - they're runtime logic that should be recreated after loading
- **Component types must be provided** during deserialization - pass an array of all ComponentType objects
- **Entity IDs are preserved** - references to entities remain valid across save/load
- **Generation counters are maintained** - prevents stale entity reference bugs
- **Format is human-readable JSON** - easy to debug and inspect save files

See `examples/serialization.ts` for a complete example with multiple entities and components.

## License

MIT
