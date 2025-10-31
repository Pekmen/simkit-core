interface ProcessEnv {
  NODE_ENV?: string;
}

interface NodeProcess {
  env: ProcessEnv;
}

declare global {
  var process: NodeProcess | undefined;
}

export function assert(condition: boolean, message: string): asserts condition {
  const isProduction =
    typeof globalThis.process !== "undefined" &&
    globalThis.process.env.NODE_ENV === "production";

  if (!isProduction) {
    if (!condition) {
      throw new Error(`Assertion failed: ${message}`);
    }
  }
}
