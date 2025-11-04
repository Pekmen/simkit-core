import type { ComponentType } from "./Component.js";

/**
 * Extract the component data type from ComponentType<T>
 *
 * @example
 * type Position = { x: number; y: number };
 * const PositionComponent: ComponentType<Position> = ...;
 * type Data = ExtractComponentData<typeof PositionComponent>; // Position
 */
export type ExtractComponentData<C> =
  C extends ComponentType<infer T> ? T : never;

/**
 * Map an array of ComponentType to a tuple of their data types
 *
 * @example
 * type Tuple = ComponentDataTuple<[ComponentType<Position>, ComponentType<Velocity>]>;
 * // Result: [Position, Velocity]
 */
// eslint-disable-next-line @typescript-eslint/no-explicit-any
export type ComponentDataTuple<T extends readonly ComponentType<any>[]> = {
  [K in keyof T]: T[K] extends ComponentType<infer U> ? U : never;
};
