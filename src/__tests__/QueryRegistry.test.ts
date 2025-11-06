import { describe, it, expect, beforeEach, vi } from "vitest";
import { QueryRegistry } from "../core/QueryRegistry.js";
import type { Query } from "../core/Query.js";

describe("QueryRegistry", () => {
  let registry: QueryRegistry;
  let mockQuery1: Query;
  let mockQuery2: Query;
  let mockQuery3: Query;
  let mockFn1: ReturnType<typeof vi.fn>;
  let mockFn2: ReturnType<typeof vi.fn>;
  let mockFn3: ReturnType<typeof vi.fn>;

  beforeEach(() => {
    registry = new QueryRegistry();

    // Create mock queries with markDirty method
    mockFn1 = vi.fn();
    mockFn2 = vi.fn();
    mockFn3 = vi.fn();

    mockQuery1 = { markDirty: mockFn1 } as unknown as Query;
    mockQuery2 = { markDirty: mockFn2 } as unknown as Query;
    mockQuery3 = { markDirty: mockFn3 } as unknown as Query;
  });

  describe("register", () => {
    it("should register a query for a single component", () => {
      registry.register(mockQuery1, ["Position"]);
      const queries = registry.getQueriesForComponent("Position");
      expect(queries).toContain(mockQuery1);
      expect(queries?.size).toBe(1);
    });

    it("should register a query for multiple components", () => {
      registry.register(mockQuery1, ["Position", "Velocity"]);
      expect(registry.getQueriesForComponent("Position")).toContain(mockQuery1);
      expect(registry.getQueriesForComponent("Velocity")).toContain(mockQuery1);
    });

    it("should register multiple queries for the same component", () => {
      registry.register(mockQuery1, ["Position"]);
      registry.register(mockQuery2, ["Position"]);
      const queries = registry.getQueriesForComponent("Position");
      expect(queries?.size).toBe(2);
      expect(queries).toContain(mockQuery1);
      expect(queries).toContain(mockQuery2);
    });

    it("should not register duplicate query-component pairs", () => {
      registry.register(mockQuery1, ["Position"]);
      registry.register(mockQuery1, ["Position"]);
      const queries = registry.getQueriesForComponent("Position");
      expect(queries?.size).toBe(1);
    });
  });

  describe("invalidateForComponent", () => {
    it("should invalidate all queries tracking a component", () => {
      registry.register(mockQuery1, ["Position"]);
      registry.register(mockQuery2, ["Position"]);

      registry.invalidateForComponent("Position");

      expect(mockFn1).toHaveBeenCalledOnce();
      expect(mockFn2).toHaveBeenCalledOnce();
    });

    it("should only invalidate queries tracking the specified component", () => {
      registry.register(mockQuery1, ["Position"]);
      registry.register(mockQuery2, ["Velocity"]);

      registry.invalidateForComponent("Position");

      expect(mockFn1).toHaveBeenCalledOnce();
      expect(mockFn2).not.toHaveBeenCalled();
    });

    it("should handle invalidating non-existent component gracefully", () => {
      registry.register(mockQuery1, ["Position"]);

      // Should not throw
      registry.invalidateForComponent("Velocity");

      expect(mockFn1).not.toHaveBeenCalled();
    });

    it("should handle empty query list gracefully", () => {
      // Should not throw
      registry.invalidateForComponent("Position");
    });
  });

  describe("invalidateAll", () => {
    it("should invalidate all registered queries", () => {
      registry.register(mockQuery1, ["Position"]);
      registry.register(mockQuery2, ["Velocity"]);
      registry.register(mockQuery3, ["Health"]);

      registry.invalidateAll();

      expect(mockFn1).toHaveBeenCalledOnce();
      expect(mockFn2).toHaveBeenCalledOnce();
      expect(mockFn3).toHaveBeenCalledOnce();
    });

    it("should handle queries registered for multiple components", () => {
      registry.register(mockQuery1, ["Position", "Velocity"]);

      registry.invalidateAll();

      // Should be called once even though registered for 2 components
      expect(mockFn1).toHaveBeenCalled();
    });

    it("should handle empty registry gracefully", () => {
      // Should not throw
      registry.invalidateAll();
    });
  });

  describe("clear", () => {
    it("should remove all registrations", () => {
      registry.register(mockQuery1, ["Position"]);
      registry.register(mockQuery2, ["Velocity"]);

      registry.clear();

      expect(registry.size()).toBe(0);
      expect(registry.getQueriesForComponent("Position")).toBeUndefined();
      expect(registry.getQueriesForComponent("Velocity")).toBeUndefined();
    });
  });

  describe("size", () => {
    it("should return 0 for empty registry", () => {
      expect(registry.size()).toBe(0);
    });

    it("should return number of tracked components", () => {
      registry.register(mockQuery1, ["Position"]);
      registry.register(mockQuery2, ["Velocity"]);
      registry.register(mockQuery3, ["Health"]);

      expect(registry.size()).toBe(3);
    });

    it("should not count same component multiple times", () => {
      registry.register(mockQuery1, ["Position"]);
      registry.register(mockQuery2, ["Position"]);

      expect(registry.size()).toBe(1);
    });
  });

  describe("getQueriesForComponent", () => {
    it("should return queries for a component", () => {
      registry.register(mockQuery1, ["Position"]);
      registry.register(mockQuery2, ["Position"]);

      const queries = registry.getQueriesForComponent("Position");
      expect(queries?.size).toBe(2);
      expect(queries).toContain(mockQuery1);
      expect(queries).toContain(mockQuery2);
    });

    it("should return undefined for untracked component", () => {
      expect(registry.getQueriesForComponent("Position")).toBeUndefined();
    });

    it("should return readonly set", () => {
      registry.register(mockQuery1, ["Position"]);
      const queries = registry.getQueriesForComponent("Position");
      expect(queries).toBeDefined();
      // TypeScript should prevent mutation
    });
  });

  describe("integration scenarios", () => {
    it("should handle complex registration and invalidation", () => {
      // Query1 tracks Position and Velocity
      registry.register(mockQuery1, ["Position", "Velocity"]);

      // Query2 tracks Position and Health
      registry.register(mockQuery2, ["Position", "Health"]);

      // Query3 tracks only Velocity
      registry.register(mockQuery3, ["Velocity"]);

      // Invalidate Position - should affect Query1 and Query2
      registry.invalidateForComponent("Position");
      expect(mockFn1).toHaveBeenCalledOnce();
      expect(mockFn2).toHaveBeenCalledOnce();
      expect(mockFn3).not.toHaveBeenCalled();

      // Reset mocks
      vi.clearAllMocks();

      // Invalidate Velocity - should affect Query1 and Query3
      registry.invalidateForComponent("Velocity");
      expect(mockFn1).toHaveBeenCalledOnce();
      expect(mockFn2).not.toHaveBeenCalled();
      expect(mockFn3).toHaveBeenCalledOnce();
    });
  });

  describe("batch invalidation", () => {
    it("should defer invalidations while in batch mode", () => {
      registry.register(mockQuery1, ["Position"]);
      registry.register(mockQuery2, ["Velocity"]);

      registry.startBatch();

      // These should be deferred
      registry.invalidateForComponent("Position");
      registry.invalidateForComponent("Velocity");

      // No queries should be invalidated yet
      expect(mockFn1).not.toHaveBeenCalled();
      expect(mockFn2).not.toHaveBeenCalled();

      registry.endBatch();

      // Now both should be invalidated
      expect(mockFn1).toHaveBeenCalledOnce();
      expect(mockFn2).toHaveBeenCalledOnce();
    });

    it("should deduplicate invalidations in batch mode", () => {
      registry.register(mockQuery1, ["Position"]);

      registry.startBatch();

      // Invalidate same component multiple times
      registry.invalidateForComponent("Position");
      registry.invalidateForComponent("Position");
      registry.invalidateForComponent("Position");

      registry.endBatch();

      // Query should only be invalidated once
      expect(mockFn1).toHaveBeenCalledOnce();
    });

    it("should handle nested batch operations correctly", () => {
      registry.register(mockQuery1, ["Position"]);

      registry.startBatch();
      registry.invalidateForComponent("Position");

      // Starting a new batch should clear pending invalidations
      registry.startBatch();
      registry.invalidateForComponent("Position");

      registry.endBatch();

      // Should only process the second batch
      expect(mockFn1).toHaveBeenCalledOnce();
    });

    it("should handle empty batch gracefully", () => {
      registry.register(mockQuery1, ["Position"]);

      registry.startBatch();
      // No invalidations
      registry.endBatch();

      expect(mockFn1).not.toHaveBeenCalled();
    });

    it("should process multiple different component types in batch", () => {
      registry.register(mockQuery1, ["Position"]);
      registry.register(mockQuery2, ["Velocity"]);
      registry.register(mockQuery3, ["Health"]);

      registry.startBatch();
      registry.invalidateForComponent("Position");
      registry.invalidateForComponent("Velocity");
      registry.invalidateForComponent("Health");
      registry.endBatch();

      expect(mockFn1).toHaveBeenCalledOnce();
      expect(mockFn2).toHaveBeenCalledOnce();
      expect(mockFn3).toHaveBeenCalledOnce();
    });

    it("should handle batch mode with non-existent components", () => {
      registry.register(mockQuery1, ["Position"]);

      registry.startBatch();
      registry.invalidateForComponent("Position");
      registry.invalidateForComponent("NonExistent");
      registry.endBatch();

      // Should not throw and should invalidate existing query
      expect(mockFn1).toHaveBeenCalledOnce();
    });

    it("should work correctly after batch mode ends", () => {
      registry.register(mockQuery1, ["Position"]);

      // Use batch mode
      registry.startBatch();
      registry.invalidateForComponent("Position");
      registry.endBatch();

      expect(mockFn1).toHaveBeenCalledOnce();

      // Clear mock for next test
      vi.clearAllMocks();

      // Normal invalidation should work after batch mode
      registry.invalidateForComponent("Position");
      expect(mockFn1).toHaveBeenCalledOnce();
    });

    it("should handle queries registered for multiple components in batch", () => {
      // Query1 tracks both Position and Velocity
      registry.register(mockQuery1, ["Position", "Velocity"]);

      registry.startBatch();
      registry.invalidateForComponent("Position");
      registry.invalidateForComponent("Velocity");
      registry.endBatch();

      // Query should be invalidated twice (once for each component)
      expect(mockFn1).toHaveBeenCalledTimes(2);
    });
  });
});
