import { World, defineComponent, Query } from "../../dist/index.js";

const ComponentA = defineComponent("A", { value: 0 });
const ComponentB = defineComponent("B", { value: 0 });
const ComponentC = defineComponent("C", { value: 0 });
const ComponentD = defineComponent("D", { value: 0 });
const ComponentE = defineComponent("E", { value: 0 });
const ComponentData = defineComponent("Data", { value: 0 });
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

let packedWorld: World;
let packedQueryA: Query<any>;
let packedQueryB: Query<any>;
let packedQueryC: Query<any>;
let packedQueryD: Query<any>;
let packedQueryE: Query<any>;

export function setupPackedIteration(): void {
  packedWorld = new World();

  // Setup: 1,000 entities with (A, B, C, D, E) components
  for (let i = 0; i < 1000; i++) {
    const entity = packedWorld.createEntity();
    packedWorld.addComponent(entity, ComponentA, { value: 1 });
    packedWorld.addComponent(entity, ComponentB, { value: 1 });
    packedWorld.addComponent(entity, ComponentC, { value: 1 });
    packedWorld.addComponent(entity, ComponentD, { value: 1 });
    packedWorld.addComponent(entity, ComponentE, { value: 1 });
  }

  // Create queries
  packedQueryA = packedWorld.query(ComponentA);
  packedQueryB = packedWorld.query(ComponentB);
  packedQueryC = packedWorld.query(ComponentC);
  packedQueryD = packedWorld.query(ComponentD);
  packedQueryE = packedWorld.query(ComponentE);
}

export function benchPackedIteration(): void {
  // Query-based iteration for Component A
  for (const [entity, comp] of packedQueryA) {
    comp.value *= 2;
  }

  // Query-based iteration for Component B
  for (const [entity, comp] of packedQueryB) {
    comp.value *= 2;
  }

  // Query-based iteration for Component C
  for (const [entity, comp] of packedQueryC) {
    comp.value *= 2;
  }

  // Query-based iteration for Component D
  for (const [entity, comp] of packedQueryD) {
    comp.value *= 2;
  }

  // Query-based iteration for Component E
  for (const [entity, comp] of packedQueryE) {
    comp.value *= 2;
  }
}

export function cleanupPackedIteration(): void {
  packedWorld.destroy();
}

let simpleWorld: World;
let simpleQueryAB: Query<any>;
let simpleQueryCD: Query<any>;
let simpleQueryCE: Query<any>;

export function setupSimpleIteration(): void {
  simpleWorld = new World();

  // 1,000 entities with (A, B) components
  for (let i = 0; i < 1000; i++) {
    const entity = simpleWorld.createEntity();
    simpleWorld.addComponent(entity, ComponentA, { value: 1 });
    simpleWorld.addComponent(entity, ComponentB, { value: 1 });
  }

  // 1,000 entities with (A, B, C) components
  for (let i = 0; i < 1000; i++) {
    const entity = simpleWorld.createEntity();
    simpleWorld.addComponent(entity, ComponentA, { value: 1 });
    simpleWorld.addComponent(entity, ComponentB, { value: 1 });
    simpleWorld.addComponent(entity, ComponentC, { value: 1 });
  }

  // 1,000 entities with (A, B, C, D) components
  for (let i = 0; i < 1000; i++) {
    const entity = simpleWorld.createEntity();
    simpleWorld.addComponent(entity, ComponentA, { value: 1 });
    simpleWorld.addComponent(entity, ComponentB, { value: 1 });
    simpleWorld.addComponent(entity, ComponentC, { value: 1 });
    simpleWorld.addComponent(entity, ComponentD, { value: 1 });
  }

  // 1,000 entities with (A, B, C, E) components
  for (let i = 0; i < 1000; i++) {
    const entity = simpleWorld.createEntity();
    simpleWorld.addComponent(entity, ComponentA, { value: 1 });
    simpleWorld.addComponent(entity, ComponentB, { value: 1 });
    simpleWorld.addComponent(entity, ComponentC, { value: 1 });
    simpleWorld.addComponent(entity, ComponentE, { value: 1 });
  }

  // Create and store queries
  simpleQueryAB = simpleWorld.query(ComponentA, ComponentB);
  simpleQueryCD = simpleWorld.query(ComponentC, ComponentD);
  simpleQueryCE = simpleWorld.query(ComponentC, ComponentE);
}

export function benchSimpleIteration(): void {
  for (const [entity, compA, compB] of simpleQueryAB) {
    const temp = compA.value;
    compA.value = compB.value;
    compB.value = temp;
  }

  for (const [entity, compC, compD] of simpleQueryCD) {
    const temp = compC.value;
    compC.value = compD.value;
    compD.value = temp;
  }

  for (const [entity, compC, compE] of simpleQueryCE) {
    const temp = compC.value;
    compC.value = compE.value;
    compE.value = temp;
  }
}

export function cleanupSimpleIteration(): void {
  simpleWorld.destroy();
}

let fragWorld: World;
let fragQueryData: Query<any>;
let fragQueryZ: Query<any>;

export function setupFragmentedIteration(): void {
  fragWorld = new World();

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
      const entity = fragWorld.createEntity();
      fragWorld.addComponent(entity, componentType, { value: 1 });
      fragWorld.addComponent(entity, ComponentData, { value: 1 });
    }
  }

  // Create and store queries
  fragQueryData = fragWorld.query(ComponentData);
  fragQueryZ = fragWorld.query(ComponentZ);
}

export function benchFragmentedIteration(): void {
  // Query-based iteration for ComponentData
  for (const [entity, comp] of fragQueryData) {
    comp.value *= 2;
  }

  // Query-based iteration for ComponentZ
  for (const [entity, comp] of fragQueryZ) {
    comp.value *= 2;
  }
}

export function cleanupFragmentedIteration(): void {
  fragWorld.destroy();
}

let cycleWorld: World;
let cycleQueryA: Query<any>;
let cycleQueryB: Query<any>;

export function setupEntityCycle(): void {
  cycleWorld = new World();

  // Setup: 1,000 entities with a single A component
  for (let i = 0; i < 1000; i++) {
    const entity = cycleWorld.createEntity();
    cycleWorld.addComponent(entity, ComponentA, { value: 1 });
  }

  // Create and store queries
  cycleQueryA = cycleWorld.query(ComponentA);
  cycleQueryB = cycleWorld.query(ComponentB);
}

export function benchEntityCycle(): void {
  // Iterate through all entities and create 1 entity with B component
  for (const [_entity] of cycleQueryA) {
    const newEntity = cycleWorld.createEntity();
    cycleWorld.addComponent(newEntity, ComponentB, { value: 1 });
  }

  // Then iterate through all entities with B component and destroy them
  // Collect entities first to avoid modifying during iteration
  const entitiesToDestroy: any[] = [];
  for (const [entity] of cycleQueryB) {
    entitiesToDestroy.push(entity);
  }
  for (const entity of entitiesToDestroy) {
    cycleWorld.destroyEntity(entity);
  }
}

export function cleanupEntityCycle(): void {
  cycleWorld.destroy();
}

let addRemoveWorld: World;
let addRemoveQueryA: Query<any>;

export function setupAddRemove(): void {
  addRemoveWorld = new World();

  // Setup: 1,000 entities with a single A component
  for (let i = 0; i < 1000; i++) {
    const entity = addRemoveWorld.createEntity();
    addRemoveWorld.addComponent(entity, ComponentA, { value: 1 });
  }

  // Create and store query
  addRemoveQueryA = addRemoveWorld.query(ComponentA);
}

export function benchAddRemove(): void {
  // Iterate through all entities, adding B component
  for (const [entity] of addRemoveQueryA) {
    addRemoveWorld.addComponent(entity, ComponentB, { value: 1 });
  }

  // Then iterate through all entities again, removing their B component
  for (const [entity] of addRemoveQueryA) {
    addRemoveWorld.removeComponent(entity, ComponentB);
  }
}

export function cleanupAddRemove(): void {
  addRemoveWorld.destroy();
}
