# simkit-core

A lightweight, type-safe Entity-Component-System (ECS) library for TypeScript

<!-- BENCHMARK_START -->

## Performance

Latest benchmark results for version 0.8.2 (11/5/2025):

| Benchmark | Operations/sec |
|-----------|---------------:|
| Packed Iteration (5 queries) | 9,900 |
| Simple Iteration | 8,318 |
| Fragmented Iteration | 22,402 |
| Entity Cycle | 3,548 |
| Add/Remove Component | 6,429 |

### Benchmark Descriptions

- **Packed Iteration (5 queries)**: Tests core iteration overhead with multiple queries on 1,000 entities
- **Simple Iteration**: Tests independent systems on entities with different component combinations
- **Fragmented Iteration**: Tests iteration through fragmented dataset (26 component types)
- **Entity Cycle**: Tests entity creation and destruction performance
- **Add/Remove Component**: Tests component addition and removal on existing entities

*Benchmarks run on Node.js v22.16.0 on linux*

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

### Development

```bash
# Clone the repository
git clone https://github.com/Pekmen/simkit-core.git
cd simkit-core

# Install dependencies
npm install

# Build and test
npm run build
npm test

# Run examples
npx tsx examples/basic.ts
```

## Features

- 🚀 **High Performance**: Optimized for game development and simulations
- 🔒 **Type Safe**: Full TypeScript support with type inference
- 🧩 **Simple API**: Easy to learn and use
- 🔧 **Flexible**: Supports complex component relationships
- 📦 **Lightweight**: Minimal dependencies and small bundle size

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
  private query = this.world.query(Position, Velocity);

  update(deltaTime: number): void {
    for (const [entity, pos, vel] of this.query) {
      pos.x += vel.dx * deltaTime;
      pos.y += vel.dy * deltaTime;
    }
  }
}

// Create world and add system
const world = new World();
world.addSystem(new MovementSystem(world));

// Create entity
const player = world.createEntity();
world.addComponent(player, Position, { x: 0, y: 0 });
world.addComponent(player, Velocity, { dx: 1, dy: 1 });

// Run simulation
world.update(0.016); // 16ms delta time
```

## API Reference

### World

```typescript
const world = new World();

// Entities
const entity = world.createEntity();
world.destroyEntity(entity);

// Components
world.addComponent(entity, ComponentType, data);
world.removeComponent(entity, ComponentType);
world.getComponent(entity, ComponentType);
world.hasComponent(entity, ComponentType);

// Systems & Updates
world.addSystem(system);
world.update(deltaTime);

// Queries
const query = world.query(Position, Velocity);
for (const [entity, pos, vel] of query) {
  /* ... */
}

// (Persistence removed from core) For persistence, implement an external
// serializer that converts a World's in-memory state to/from a stable format.
```

### defineComponent

```typescript
interface Health {
  current: number;
  max: number;
}
const Health = defineComponent<Health>("Health", { current: 100, max: 100 });

// Partial data uses defaults
world.addComponent(entity, Health, { current: 80 }); // max = 100
```

### System

```typescript
class HealthSystem extends System {
  private query = this.world.query(Health);

  update(deltaTime: number): void {
    for (const [entity, health] of this.query) {
      if (health.current <= 0) {
        this.world.destroyEntity(entity);
      }
    }
  }
}
```

## License

MIT
