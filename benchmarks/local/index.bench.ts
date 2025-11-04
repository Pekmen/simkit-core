import { bench, describe } from "vitest";
import { World, defineComponent } from "../src/index.js";

// Define component types
const ComponentA = defineComponent("A", { value: 0 });
const ComponentB = defineComponent("B", { value: 0 });
const ComponentC = defineComponent("C", { value: 0 });
const ComponentD = defineComponent("D", { value: 0 });
const ComponentE = defineComponent("E", { value: 0 });
const ComponentData = defineComponent("Data", { value: 0 });

// Define components Z through A for fragmented iteration
const ComponentZ = defineComponent("Z", { value: 0 });
const ComponentY = defineComponent("Y", { value: 0 });
const ComponentX = defineComponent("X", { value: 0 });
const ComponentW = defineComponent("W", { value: 0 });
const ComponentV = defineComponent("V", { value: 0 });
const ComponentU = defineComponent("U", { value: 0 });
const ComponentT = defineComponent("T", { value: 0 });
const ComponentS = defineComponent("S", { value: 0 });
const ComponentR = defineComponent("R", { value: 0 });
const ComponentQ = defineComponent("Q", { value: 0 });
const ComponentP = defineComponent("P", { value: 0 });
const ComponentO = defineComponent("O", { value: 0 });
const ComponentN = defineComponent("N", { value: 0 });
const ComponentM = defineComponent("M", { value: 0 });
const ComponentL = defineComponent("L", { value: 0 });
const ComponentK = defineComponent("K", { value: 0 });
const ComponentJ = defineComponent("J", { value: 0 });
const ComponentI = defineComponent("I", { value: 0 });
const ComponentH = defineComponent("H", { value: 0 });
const ComponentG = defineComponent("G", { value: 0 });
const ComponentF = defineComponent("F", { value: 0 });

describe("Packed Iteration (5 queries)", () => {
  bench("packed_5", () => {
    const world = new World();

    // Setup: 1,000 entities with (A, B, C, D, E) components
    for (let i = 0; i < 1000; i++) {
      const entity = world.createEntity();
      world.addComponent(entity, ComponentA, { value: 1 });
      world.addComponent(entity, ComponentB, { value: 1 });
      world.addComponent(entity, ComponentC, { value: 1 });
      world.addComponent(entity, ComponentD, { value: 1 });
      world.addComponent(entity, ComponentE, { value: 1 });
    }

    // Create queries
    const queryA = world.query(ComponentA);
    const queryB = world.query(ComponentB);
    const queryC = world.query(ComponentC);
    const queryD = world.query(ComponentD);
    const queryE = world.query(ComponentE);

    // Test: Iterate through all entities with each component and double its value
    for (const [entity, comp] of queryA) {
      comp.value *= 2;
    }

    for (const [entity, comp] of queryB) {
      comp.value *= 2;
    }

    for (const [entity, comp] of queryC) {
      comp.value *= 2;
    }

    for (const [entity, comp] of queryD) {
      comp.value *= 2;
    }

    for (const [entity, comp] of queryE) {
      comp.value *= 2;
    }

    world.destroy();
  });
});

describe("Simple Iteration", () => {
  bench("simple_iter", () => {
    const world = new World();

    // Setup: Different entity sets with different component combinations
    // 1,000 entities with (A, B) components
    for (let i = 0; i < 1000; i++) {
      const entity = world.createEntity();
      world.addComponent(entity, ComponentA, { value: 1 });
      world.addComponent(entity, ComponentB, { value: 1 });
    }

    // 1,000 entities with (A, B, C) components
    for (let i = 0; i < 1000; i++) {
      const entity = world.createEntity();
      world.addComponent(entity, ComponentA, { value: 1 });
      world.addComponent(entity, ComponentB, { value: 1 });
      world.addComponent(entity, ComponentC, { value: 1 });
    }

    // 1,000 entities with (A, B, C, D) components
    for (let i = 0; i < 1000; i++) {
      const entity = world.createEntity();
      world.addComponent(entity, ComponentA, { value: 1 });
      world.addComponent(entity, ComponentB, { value: 1 });
      world.addComponent(entity, ComponentC, { value: 1 });
      world.addComponent(entity, ComponentD, { value: 1 });
    }

    // 1,000 entities with (A, B, C, E) components
    for (let i = 0; i < 1000; i++) {
      const entity = world.createEntity();
      world.addComponent(entity, ComponentA, { value: 1 });
      world.addComponent(entity, ComponentB, { value: 1 });
      world.addComponent(entity, ComponentC, { value: 1 });
      world.addComponent(entity, ComponentE, { value: 1 });
    }

    // Create queries for the three systems
    const queryAB = world.query(ComponentA, ComponentB);
    const queryCD = world.query(ComponentC, ComponentD);
    const queryCE = world.query(ComponentC, ComponentE);

    // System 1: (A, B) - swap values
    for (const [entity, compA, compB] of queryAB) {
      const temp = compA.value;
      compA.value = compB.value;
      compB.value = temp;
    }

    // System 2: (C, D) - swap values
    for (const [entity, compC, compD] of queryCD) {
      const temp = compC.value;
      compC.value = compD.value;
      compD.value = temp;
    }

    // System 3: (C, E) - swap values
    for (const [entity, compC, compE] of queryCE) {
      const temp = compC.value;
      compC.value = compE.value;
      compE.value = temp;
    }

    world.destroy();
  });
});

describe("Fragmented Iteration", () => {
  bench("frag_iter", () => {
    const world = new World();

    // 26 component types (A through Z), each with 100 entities plus a Data component
    const componentTypes = [
      ComponentA,
      ComponentB,
      ComponentC,
      ComponentD,
      ComponentE,
      ComponentF,
      ComponentG,
      ComponentH,
      ComponentI,
      ComponentJ,
      ComponentK,
      ComponentL,
      ComponentM,
      ComponentN,
      ComponentO,
      ComponentP,
      ComponentQ,
      ComponentR,
      ComponentS,
      ComponentT,
      ComponentU,
      ComponentV,
      ComponentW,
      ComponentX,
      ComponentY,
      ComponentZ,
    ];

    for (const componentType of componentTypes) {
      for (let i = 0; i < 100; i++) {
        const entity = world.createEntity();
        world.addComponent(entity, componentType, { value: 1 });
        world.addComponent(entity, ComponentData, { value: 1 });
      }
    }

    // Create queries
    const queryData = world.query(ComponentData);
    const queryZ = world.query(ComponentZ);

    // Test: Iterate through all entities with Data component and double its value
    for (const [entity, comp] of queryData) {
      comp.value *= 2;
    }

    // Iterate through all entities with Z component and double its value
    for (const [entity, comp] of queryZ) {
      comp.value *= 2;
    }

    world.destroy();
  });
});

describe("Entity Cycle", () => {
  bench("entity_cycle", () => {
    const world = new World();

    // Setup: 1,000 entities with a single A component
    for (let i = 0; i < 1000; i++) {
      const entity = world.createEntity();
      world.addComponent(entity, ComponentA, { value: 1 });
    }

    // Create queries
    const queryA = world.query(ComponentA);
    const queryB = world.query(ComponentB);

    // Test: Iterate through all entities and create 1 entity with B component
    const entitiesToCreate: number[] = [];
    for (const [_entity] of queryA) {
      const newEntity = world.createEntity();
      world.addComponent(newEntity, ComponentB, { value: 1 });
      entitiesToCreate.push(newEntity);
    }

    // Then iterate through all entities with B component and destroy them
    for (const [entity] of queryB) {
      world.destroyEntity(entity);
    }

    world.destroy();
  });
});

describe("Add / Remove", () => {
  bench("add_remove", () => {
    const world = new World();

    // Setup: 1,000 entities with a single A component
    for (let i = 0; i < 1000; i++) {
      const entity = world.createEntity();
      world.addComponent(entity, ComponentA, { value: 1 });
    }

    // Create query
    const queryA = world.query(ComponentA);

    // Test: Iterate through all entities, adding B component
    for (const [entity] of queryA) {
      world.addComponent(entity, ComponentB, { value: 1 });
    }

    // Then iterate through all entities again, removing their B component
    for (const [entity] of queryA) {
      world.removeComponent(entity, ComponentB);
    }

    world.destroy();
  });
});
