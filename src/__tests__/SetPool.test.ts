import { describe, it, expect, beforeEach } from "vitest";
import { SetPool } from "../core/SetPool.js";

describe("SetPool", () => {
  let pool: SetPool<string>;

  beforeEach(() => {
    pool = new SetPool<string>();
  });

  describe("acquire", () => {
    it("should create new Set when pool is empty", () => {
      const set = pool.acquire();
      expect(set).toBeInstanceOf(Set);
      expect(set.size).toBe(0);
    });

    it("should return empty Sets", () => {
      const set1 = pool.acquire();
      const set2 = pool.acquire();

      expect(set1.size).toBe(0);
      expect(set2.size).toBe(0);
      expect(set1).not.toBe(set2);
    });

    it("should reuse released Sets", () => {
      const set1 = pool.acquire();
      set1.add("item1");
      set1.add("item2");

      pool.release(set1);

      const set2 = pool.acquire();

      // Should be the same Set reference
      expect(set2).toBe(set1);
      // Should be cleared
      expect(set2.size).toBe(0);
      expect(set2.has("item1")).toBe(false);
      expect(set2.has("item2")).toBe(false);
    });

    it("should work with different value types", () => {
      const numberPool = new SetPool<number>();
      const set = numberPool.acquire();

      set.add(1);
      set.add(2);
      set.add(3);

      expect(set.size).toBe(3);
      expect(set.has(2)).toBe(true);
    });
  });

  describe("release", () => {
    it("should clear Set contents before pooling", () => {
      const set = pool.acquire();
      set.add("data1");
      set.add("data2");
      set.add("data3");

      pool.release(set);

      expect(set.size).toBe(0);
    });

    it("should not exceed max pool size", () => {
      const smallPool = new SetPool<string>(2);

      const set1 = smallPool.acquire();
      const set2 = smallPool.acquire();
      const set3 = smallPool.acquire();

      smallPool.release(set1);
      smallPool.release(set2);
      smallPool.release(set3);

      expect(smallPool.getPoolSize()).toBe(2);
    });

    it("should handle releasing same Set multiple times", () => {
      const set = pool.acquire();
      pool.release(set);
      pool.release(set);

      // Should be in pool at least once
      expect(pool.getPoolSize()).toBeGreaterThanOrEqual(1);
    });

    it("should handle releasing Sets with complex values", () => {
      interface ComplexType {
        id: number;
        name: string;
      }
      const complexPool = new SetPool<ComplexType>();

      const set = complexPool.acquire();
      const obj1 = { id: 1, name: "test" };
      const obj2 = { id: 2, name: "test2" };

      set.add(obj1);
      set.add(obj2);

      complexPool.release(set);

      expect(set.size).toBe(0);
      expect(set.has(obj1)).toBe(false);
    });
  });

  describe("releaseAll", () => {
    it("should release multiple Sets at once", () => {
      const sets = [pool.acquire(), pool.acquire(), pool.acquire()];

      sets.forEach((s) => {
        s.add("test");
      });

      pool.releaseAll(sets);

      expect(pool.getPoolSize()).toBe(3);
      sets.forEach((s) => {
        expect(s.size).toBe(0);
      });
    });

    it("should handle empty array", () => {
      pool.releaseAll([]);
      expect(pool.getPoolSize()).toBe(0);
    });

    it("should respect max pool size", () => {
      const smallPool = new SetPool<string>(2);
      const sets = [
        smallPool.acquire(),
        smallPool.acquire(),
        smallPool.acquire(),
        smallPool.acquire(),
      ];

      smallPool.releaseAll(sets);

      expect(smallPool.getPoolSize()).toBe(2);
    });
  });

  describe("clear", () => {
    it("should clear all pooled Sets", () => {
      const set1 = pool.acquire();
      const set2 = pool.acquire();
      const set3 = pool.acquire();

      pool.release(set1);
      pool.release(set2);
      pool.release(set3);

      expect(pool.getPoolSize()).toBe(3);

      pool.clear();

      expect(pool.getPoolSize()).toBe(0);
    });

    it("should allow reuse after clear", () => {
      const set1 = pool.acquire();
      pool.release(set1);
      pool.clear();

      const set2 = pool.acquire();
      // Should be a new Set since pool was cleared
      expect(set2).not.toBe(set1);
    });
  });

  describe("getPoolSize", () => {
    it("should return 0 for empty pool", () => {
      expect(pool.getPoolSize()).toBe(0);
    });

    it("should return correct size for pooled Sets", () => {
      const sets = [pool.acquire(), pool.acquire(), pool.acquire()];

      sets.forEach((s) => {
        pool.release(s);
      });

      expect(pool.getPoolSize()).toBe(3);
    });

    it("should decrease when Sets are acquired", () => {
      const sets = [pool.acquire(), pool.acquire(), pool.acquire()];

      sets.forEach((s) => {
        pool.release(s);
      });

      expect(pool.getPoolSize()).toBe(3);

      pool.acquire();
      expect(pool.getPoolSize()).toBe(2);

      pool.acquire();
      expect(pool.getPoolSize()).toBe(1);
    });
  });

  describe("getStats", () => {
    it("should track acquisition and creation", () => {
      pool.acquire();
      pool.acquire();
      pool.acquire();

      const stats = pool.getStats();
      expect(stats.acquired).toBe(3);
      expect(stats.created).toBe(3);
      expect(stats.reused).toBe(0);
    });

    it("should track reuse", () => {
      const set = pool.acquire();
      pool.release(set);
      pool.acquire();

      const stats = pool.getStats();
      expect(stats.acquired).toBe(2);
      expect(stats.created).toBe(1);
      expect(stats.reused).toBe(1);
      expect(stats.released).toBe(1);
    });

    it("should calculate reuse rate", () => {
      // Create and release
      const set1 = pool.acquire();
      pool.release(set1);

      // Reuse
      pool.acquire();

      // Create new
      pool.acquire();

      const stats = pool.getStats();
      expect(stats.acquired).toBe(3);
      expect(stats.reused).toBe(1);
      expect(stats.reuseRate).toBeCloseTo(1 / 3);
    });

    it("should handle zero acquisitions", () => {
      const stats = pool.getStats();
      expect(stats.reuseRate).toBe(0);
    });

    it("should include pool size in stats", () => {
      const sets = [pool.acquire(), pool.acquire()];
      sets.forEach((s) => {
        pool.release(s);
      });

      const stats = pool.getStats();
      expect(stats.poolSize).toBe(2);
    });
  });

  describe("resetStats", () => {
    it("should reset all statistics", () => {
      pool.acquire();
      const set = pool.acquire();
      pool.release(set);
      pool.acquire();

      pool.resetStats();

      const stats = pool.getStats();
      expect(stats.acquired).toBe(0);
      expect(stats.released).toBe(0);
      expect(stats.created).toBe(0);
      expect(stats.reused).toBe(0);
    });

    it("should not affect pooled Sets", () => {
      const set = pool.acquire();
      pool.release(set);

      pool.resetStats();

      expect(pool.getPoolSize()).toBe(1);
    });
  });

  describe("performance characteristics", () => {
    it("should handle large number of Sets efficiently", () => {
      const sets: Set<string>[] = [];

      for (let i = 0; i < 10000; i++) {
        sets.push(pool.acquire());
      }

      for (const set of sets) {
        pool.release(set);
      }

      const stats = pool.getStats();
      expect(stats.acquired).toBe(10000);
      // Pool size is capped
      expect(pool.getPoolSize()).toBeLessThanOrEqual(500);
    });

    it("should reuse Sets effectively", () => {
      // Warm up pool
      const warmupSets: Set<string>[] = [];
      for (let i = 0; i < 100; i++) {
        warmupSets.push(pool.acquire());
      }
      warmupSets.forEach((s) => {
        pool.release(s);
      });

      pool.resetStats();

      // Acquire and release repeatedly
      for (let i = 0; i < 100; i++) {
        const set = pool.acquire();
        set.add(`item${String(i)}`);
        pool.release(set);
      }

      const stats = pool.getStats();
      expect(stats.reuseRate).toBeGreaterThan(0.9); // 90%+ reuse
    });

    it("should maintain Set functionality after pooling", () => {
      const set1 = pool.acquire();
      set1.add("a");
      set1.add("b");
      set1.add("c");

      expect(set1.size).toBe(3);
      expect([...set1]).toEqual(["a", "b", "c"]);

      pool.release(set1);

      const set2 = pool.acquire();
      expect(set2).toBe(set1);
      expect(set2.size).toBe(0);

      // Should work normally after reuse
      set2.add("x");
      set2.add("y");
      expect(set2.size).toBe(2);
      expect(set2.has("x")).toBe(true);
      expect(set2.has("y")).toBe(true);
    });
  });
});
