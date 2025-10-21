import { assert } from "./assert.js";

export interface ComponentType<T> {
  readonly name: string;
  create(data?: Partial<T>): T;
}

export function defineComponent<T>(
  name: string,
  defaultValues: T,
): ComponentType<T> {
  assert(
    typeof name === "string" && name.length > 0,
    "Component name must be a non-empty string",
  );
  assert(
    defaultValues !== null && defaultValues !== undefined,
    "Component defaultValues must be provided",
  );

  return {
    name,
    create(data: Partial<T> = {}): T {
      return { ...defaultValues, ...data };
    },
  };
}
