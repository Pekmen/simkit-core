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
let packedQueryA: Query;
let packedQueryB: Query;
let packedQueryC: Query;
let packedQueryD: Query;
let packedQueryE: Query;

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
  packedQueryA = packedWorld.createQuery({ with: [ComponentA] });
  packedQueryB = packedWorld.createQuery({ with: [ComponentB] });
  packedQueryC = packedWorld.createQuery({ with: [ComponentC] });
  packedQueryD = packedWorld.createQuery({ with: [ComponentD] });
  packedQueryE = packedWorld.createQuery({ with: [ComponentE] });
}

export function benchPackedIteration(): void {
  // Query-based iteration for Component A
  for (const entity of packedQueryA.execute()) {
    const comp = packedWorld.getComponent(entity, ComponentA);
    if (comp) {
      comp.value *= 2;
    }
  }

  // Query-based iteration for Component B
  for (const entity of packedQueryB.execute()) {
    const comp = packedWorld.getComponent(entity, ComponentB);
    if (comp) {
      comp.value *= 2;
    }
  }

  // Query-based iteration for Component C
  for (const entity of packedQueryC.execute()) {
    const comp = packedWorld.getComponent(entity, ComponentC);
    if (comp) {
      comp.value *= 2;
    }
  }

  // Query-based iteration for Component D
  for (const entity of packedQueryD.execute()) {
    const comp = packedWorld.getComponent(entity, ComponentD);
    if (comp) {
      comp.value *= 2;
    }
  }

  // Query-based iteration for Component E
  for (const entity of packedQueryE.execute()) {
    const comp = packedWorld.getComponent(entity, ComponentE);
    if (comp) {
      comp.value *= 2;
    }
  }
}

export function cleanupPackedIteration(): void {
  packedWorld.destroy();
}

let simpleWorld: World;
let simpleQueryAB: Query;
let simpleQueryCD: Query;
let simpleQueryCE: Query;

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

  // Create queries for the three systems
  simpleQueryAB = simpleWorld.createQuery({ with: [ComponentA, ComponentB] });
  simpleQueryCD = simpleWorld.createQuery({ with: [ComponentC, ComponentD] });
  simpleQueryCE = simpleWorld.createQuery({ with: [ComponentC, ComponentE] });
}

export function benchSimpleIteration(): void {
  const storageA = simpleWorld.getComponentStorage(ComponentA);
  const storageB = simpleWorld.getComponentStorage(ComponentB);

  if (storageA && storageB) {
    const entities = simpleQueryAB.execute();
    for (let i = 0; i < entities.length; i++) {
      const entity = entities[i];
      const compA = storageA.getComponent(entity);
      const compB = storageB.getComponent(entity);
      if (compA && compB) {
        const temp = compA.value;
        compA.value = compB.value;
        compB.value = temp;
      }
    }
  }

  const storageC = simpleWorld.getComponentStorage(ComponentC);
  const storageD = simpleWorld.getComponentStorage(ComponentD);

  if (storageC && storageD) {
    const entities = simpleQueryCD.execute();
    for (let i = 0; i < entities.length; i++) {
      const entity = entities[i];
      const compC = storageC.getComponent(entity);
      const compD = storageD.getComponent(entity);
      if (compC && compD) {
        const temp = compC.value;
        compC.value = compD.value;
        compD.value = temp;
      }
    }
  }

  const storageE = simpleWorld.getComponentStorage(ComponentE);

  if (storageC && storageE) {
    const entities = simpleQueryCE.execute();
    for (let i = 0; i < entities.length; i++) {
      const entity = entities[i];
      const compC = storageC.getComponent(entity);
      const compE = storageE.getComponent(entity);
      if (compC && compE) {
        const temp = compC.value;
        compC.value = compE.value;
        compE.value = temp;
      }
    }
  }
}

export function cleanupSimpleIteration(): void {
  simpleWorld.destroy();
}

let fragWorld: World;
let fragQueryData: Query;
let fragQueryZ: Query;

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

  fragQueryData = fragWorld.createQuery({ with: [ComponentData] });
  fragQueryZ = fragWorld.createQuery({ with: [ComponentZ] });
}

export function benchFragmentedIteration(): void {
  // Query-based iteration for ComponentData
  for (const entity of fragQueryData.execute()) {
    const comp = fragWorld.getComponent(entity, ComponentData);
    if (comp) {
      comp.value *= 2;
    }
  }

  // Query-based iteration for ComponentZ
  for (const entity of fragQueryZ.execute()) {
    const comp = fragWorld.getComponent(entity, ComponentZ);
    if (comp) {
      comp.value *= 2;
    }
  }
}

export function cleanupFragmentedIteration(): void {
  fragWorld.destroy();
}

let cycleWorld: World;
let cycleQueryA: Query;
let cycleQueryB: Query;

export function setupEntityCycle(): void {
  cycleWorld = new World();

  // Setup: 1,000 entities with a single A component
  for (let i = 0; i < 1000; i++) {
    const entity = cycleWorld.createEntity();
    cycleWorld.addComponent(entity, ComponentA, { value: 1 });
  }

  cycleQueryA = cycleWorld.createQuery({ with: [ComponentA] });
  cycleQueryB = cycleWorld.createQuery({ with: [ComponentB] });
}

export function benchEntityCycle(): void {
  // Iterate through all entities and create 1 entity with B component
  for (const _entity of cycleQueryA.execute()) {
    const newEntity = cycleWorld.createEntity();
    cycleWorld.addComponent(newEntity, ComponentB, { value: 1 });
  }

  // Then iterate through all entities with B component and destroy them
  for (const entity of cycleQueryB.execute()) {
    cycleWorld.destroyEntity(entity);
  }
}

export function cleanupEntityCycle(): void {
  cycleWorld.destroy();
}

let addRemoveWorld: World;
let addRemoveQueryA: Query;

export function setupAddRemove(): void {
  addRemoveWorld = new World();

  // Setup: 1,000 entities with a single A component
  for (let i = 0; i < 1000; i++) {
    const entity = addRemoveWorld.createEntity();
    addRemoveWorld.addComponent(entity, ComponentA, { value: 1 });
  }

  addRemoveQueryA = addRemoveWorld.createQuery({ with: [ComponentA] });
}

export function benchAddRemove(): void {
  // Iterate through all entities, adding B component
  for (const entity of addRemoveQueryA.execute()) {
    addRemoveWorld.addComponent(entity, ComponentB, { value: 1 });
  }

  // Then iterate through all entities again, removing their B component
  for (const entity of addRemoveQueryA.execute()) {
    addRemoveWorld.removeComponent(entity, ComponentB);
  }
}

export function cleanupAddRemove(): void {
  addRemoveWorld.destroy();
}
