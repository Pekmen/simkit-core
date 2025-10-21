declare const process: { env: { NODE_ENV?: string } };

export function assert(condition: boolean, message: string): asserts condition {
  if (process.env.NODE_ENV !== "production") {
    if (!condition) {
      throw new Error(`Assertion failed: ${message}`);
    }
  }
}
