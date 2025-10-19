export const INDEX_BITS = 24;

export const INDEX_MASK = (1 << INDEX_BITS) - 1;

export const MAX_ENTITY_INDEX = INDEX_MASK;

export const GENERATION_BITS = 8;

export const GENERATION_MASK = (1 << GENERATION_BITS) - 1;

declare const process:
  | {
      env: {
        NODE_ENV?: string;
      };
    }
  | undefined;

export const DEV_MODE =
  typeof process === "undefined" || process.env.NODE_ENV !== "production";

export function assert(condition: boolean, message: string): asserts condition {
  if (DEV_MODE && !condition) {
    throw new Error(message);
  }
}
