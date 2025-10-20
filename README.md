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

```bash
# npm
npm install simkit-core

# yarn
yarn add simkit-core
```

## Features

- **High Performance**: Sparse-set component storage with query caching for fast iteration
- **Type Safe**: Full TypeScript support with generic components and type inference
- **Flexible Queries**: Filter entities with `with`, `without`, and `oneOf` constraints
- **Built-in Profiling**: Optional performance monitoring for systems, queries, and components
- **Snapshot Support**: Serialize and restore world state for save/load functionality
- **Development Mode**: Assertions and warnings during development, stripped in production

## Quick Start

```typescript
import { World, System, defineComponent } from "simkit-core";

interface Position { x: number; y: number; }
interface Velocity { dx: number; dy: number; }

const Position = defineComponent<Position>("Position", { x: 0, y: 0 });
const Velocity = defineComponent<Velocity>("Velocity", { dx: 0, dy: 0 });

class MovementSystem extends System {
  private query = this.world.createQuery({
    with: [Position, Velocity]
  });

  update(deltaTime: number): void {
    for (const entity of this.query.execute()) {
      const pos = this.world.getComponent(entity, Position)!;
      const vel = this.world.getComponent(entity, Velocity)!;

      pos.x += vel.dx * deltaTime;
      pos.y += vel.dy * deltaTime;
    }
  }
}

const world = new World();
world.addSystem(new MovementSystem(world));

const entity = world.createEntity();
world.addComponent(entity, Position, { x: 0, y: 0 });
world.addComponent(entity, Velocity, { dx: 1, dy: 1 });

world.update(16);
```

## Core Concepts

### Entities

Entities are unique identifiers (branded numbers) with packed index and generation counter to prevent stale references after destruction.

```typescript
const entity = world.createEntity();
world.destroyEntity(entity);
const isValid = world.entityManager.isEntityValid(entity);
```

### Components

Components are plain data objects defined with TypeScript interfaces. Use `defineComponent` to create component types with default values.

```typescript
interface Health { current: number; max: number; }

const Health = defineComponent<Health>("Health", {
  current: 100,
  max: 100
});

world.addComponent(entity, Health);
world.addComponent(entity, Health, { current: 80 });
world.removeComponent(entity, Health);
const health = world.getComponent(entity, Health);
```

### Queries

Queries efficiently filter entities based on component constraints. Results are cached and invalidated automatically when components change.

```typescript
const movingEntities = world.createQuery({
  with: [Position, Velocity],
  without: [Static],
  oneOf: [Player, Enemy]
});

for (const entity of movingEntities.execute()) {
  // Process entities
}
```

**Query constraints:**
- `with`: Entity must have all specified components
- `without`: Entity must not have any specified components
- `oneOf`: Entity must have at least one specified component

### Systems

Systems contain game logic and operate on entities with specific components. Systems have lifecycle hooks: `init()`, `update(deltaTime)`, and `cleanup()`.

```typescript
class DamageSystem extends System {
  private query = this.world.createQuery({ with: [Health, Damage] });

  init(): void {
    console.log("DamageSystem initialized");
  }

  update(deltaTime: number): void {
    for (const entity of this.query.execute()) {
      const health = this.world.getComponent(entity, Health)!;
      const damage = this.world.getComponent(entity, Damage)!;

      health.current -= damage.amount;

      if (health.current <= 0) {
        this.world.destroyEntity(entity);
      }
    }
  }

  cleanup(): void {
    console.log("DamageSystem cleaned up");
  }
}

world.addSystem(new DamageSystem(world));
world.removeSystem(system);
```

### Profiling

Enable profiling to monitor system execution time, query performance, and component operations.

```typescript
const world = new World({
  enableProfiling: true,
  maxFrameHistory: 60
});

world.update(16);

const profiler = world.getProfiler();
console.log(profiler.generateReport());
console.log(`FPS: ${profiler.getFPS()}`);
console.log(`Avg frame time: ${profiler.getAverageFrameTime()}ms`);
```

### Snapshots

Serialize and restore world state for save/load functionality or time travel debugging.

```typescript
const snapshot = world.createSnapshot();

world.restoreFromSnapshot(snapshot);

interface CustomData {
  timestamp: Date;
}

const serializer = {
  serialize: (component: CustomData) => ({
    timestamp: component.timestamp.getTime()
  }),
  deserialize: (data: any) => ({
    timestamp: new Date(data.timestamp)
  })
};

world.registerComponentSerializer("CustomData", serializer);
```

## Advanced Usage

### Component Storage Access

Access underlying component storage for batch operations.

```typescript
const storage = world.getComponentStorage(Position);
const allPositions = storage?.getAllComponents();
const allEntities = storage?.getAllEntities();
```

### World Configuration

Configure world behavior at creation time.

```typescript
const world = new World({
  enableProfiling: true,
  maxFrameHistory: 120
});

world.enableProfiling();
world.disableProfiling();
```

### Entity Recycling

The entity manager maintains a free list of destroyed entity IDs for efficient reuse with generation counter increments.

```typescript
const entity1 = world.createEntity();
world.destroyEntity(entity1);

const entity2 = world.createEntity();
```

### Error Handling

The library includes comprehensive error checking in development mode (controlled by `process.env.NODE_ENV`).

```typescript
world.addComponent(entity, Position);

world.destroyEntity(entity);

const invalid = world.addComponent(entity, Position);
```

## API Reference

### World

```typescript
class World {
  constructor(config?: WorldConfig);

  createEntity(): EntityId;
  destroyEntity(entityId: EntityId): void;
  getAllEntities(): readonly EntityId[];
  getEntityCount(): number;

  addComponent<T>(entityId: EntityId, componentType: ComponentType<T>, data?: Partial<T>): boolean;
  removeComponent<T>(entityId: EntityId, componentType: ComponentType<T>): boolean;
  getComponent<T>(entityId: EntityId, componentType: ComponentType<T>): T | undefined;
  hasComponent<T>(entityId: EntityId, componentType: ComponentType<T>): boolean;
  getEntitiesWithComponent<T>(componentType: ComponentType<T>): readonly EntityId[] | undefined;
  getComponentStorage<T>(componentType: ComponentType<T>): ComponentStorage<T> | undefined;

  addSystem(system: System): void;
  removeSystem(system: System): boolean;
  getSystems(): readonly System[];
  clearSystems(): void;
  update(deltaTime: number): void;

  createQuery(config: QueryConfig): Query;
  removeQuery(query: Query): boolean;

  getProfiler(): Profiler;
  enableProfiling(): void;
  disableProfiling(): void;

  registerComponentSerializer<T>(componentName: string, serializer: ComponentSerializer<T>): void;
  createSnapshot(): WorldSnapshot;
  restoreFromSnapshot(snapshot: WorldSnapshot): void;

  destroy(): void;
}
```

### defineComponent

```typescript
function defineComponent<T>(
  name: string,
  defaultValues: T
): ComponentType<T>;

interface ComponentType<T> {
  name: string;
  create(data?: Partial<T>): T;
}
```

### System

```typescript
abstract class System {
  protected world: World;

  constructor(world: World);

  init(): void;
  abstract update(deltaTime: number): void;
  cleanup(): void;
}
```

### Query

```typescript
interface QueryConfig {
  with?: ComponentType<unknown>[];
  without?: ComponentType<unknown>[];
  oneOf?: ComponentType<unknown>[];
}

class Query {
  execute(): readonly EntityId[];
  markDirty(): void;
  tracksComponent(componentName: string): boolean;
}
```

### Profiler

```typescript
class Profiler {
  enable(): void;
  disable(): void;
  isEnabled(): boolean;

  start(name: string): void;
  end(name: string): void;
  measure<T>(name: string, fn: () => T): T;
  measureAsync<T>(name: string, fn: () => Promise<T>): Promise<T>;

  getStats(name: string): ProfilingStats | undefined;
  getAllStats(): Map<string, ProfilingStats>;

  endFrame(): void;
  getLastFrame(): FrameProfile | undefined;
  getFrameHistory(): readonly FrameProfile[];
  getAverageFrameTime(): number;
  getFPS(): number;

  setMaxFrameHistory(max: number): void;
  clear(): void;
  generateReport(): string;
}
```

## Development

```bash
git clone https://github.com/Pekmen/simkit-core.git
cd simkit-core
npm install
npm test
npm run build
```

## License

MIT
