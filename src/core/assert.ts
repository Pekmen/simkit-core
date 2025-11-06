interface ProcessEnv {
  NODE_ENV?: string;
}

interface NodeProcess {
  env: ProcessEnv;
}

declare global {
  var process: NodeProcess | undefined;
}

const DEV =
  typeof globalThis.process === "undefined" ||
  globalThis.process.env.NODE_ENV !== "production";

export function assert(condition: boolean, message: string): asserts condition {
  if (DEV && !condition) {
    throw new Error(`Assertion failed: ${message}`);
  }
}
