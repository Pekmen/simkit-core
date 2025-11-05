import { describe, it, expect, beforeEach } from "vitest";
import { MapSet } from "../core/MapSet.js";

describe("MapSet", () => {
  let mapSet: MapSet<string, number>;

  beforeEach(() => {
    mapSet = new MapSet<string, number>();
  });

  describe("add", () => {
    it("should add a value to a new key", () => {
      mapSet.add("key1", 1);
      expect(mapSet.get("key1")).toEqual(new Set([1]));
    });

    it("should add multiple values to the same key", () => {
      mapSet.add("key1", 1);
      mapSet.add("key1", 2);
      mapSet.add("key1", 3);
      expect(mapSet.get("key1")).toEqual(new Set([1, 2, 3]));
    });

    it("should not add duplicate values", () => {
      mapSet.add("key1", 1);
      mapSet.add("key1", 1);
      expect(mapSet.get("key1")).toEqual(new Set([1]));
    });

    it("should handle multiple keys", () => {
      mapSet.add("key1", 1);
      mapSet.add("key2", 2);
      expect(mapSet.get("key1")).toEqual(new Set([1]));
      expect(mapSet.get("key2")).toEqual(new Set([2]));
    });
  });

  describe("remove", () => {
    it("should remove a value from a key", () => {
      mapSet.add("key1", 1);
      mapSet.add("key1", 2);
      const removed = mapSet.remove("key1", 1);
      expect(removed).toBe(true);
      expect(mapSet.get("key1")).toEqual(new Set([2]));
    });

    it("should remove the key when the last value is removed", () => {
      mapSet.add("key1", 1);
      mapSet.remove("key1", 1);
      expect(mapSet.get("key1")).toBeUndefined();
      expect(mapSet.hasKey("key1")).toBe(false);
    });

    it("should return false when removing non-existent value", () => {
      mapSet.add("key1", 1);
      const removed = mapSet.remove("key1", 2);
      expect(removed).toBe(false);
      expect(mapSet.get("key1")).toEqual(new Set([1]));
    });

    it("should return false when removing from non-existent key", () => {
      const removed = mapSet.remove("key1", 1);
      expect(removed).toBe(false);
    });
  });

  describe("removeAll", () => {
    it("should remove all values for a key", () => {
      mapSet.add("key1", 1);
      mapSet.add("key1", 2);
      mapSet.add("key1", 3);
      const removed = mapSet.removeAll("key1");
      expect(removed).toBe(true);
      expect(mapSet.get("key1")).toBeUndefined();
    });

    it("should return false when removing non-existent key", () => {
      const removed = mapSet.removeAll("key1");
      expect(removed).toBe(false);
    });
  });

  describe("get", () => {
    it("should return the set for an existing key", () => {
      mapSet.add("key1", 1);
      mapSet.add("key1", 2);
      const set = mapSet.get("key1");
      expect(set).toEqual(new Set([1, 2]));
    });

    it("should return undefined for non-existent key", () => {
      expect(mapSet.get("key1")).toBeUndefined();
    });

    it("should return readonly set", () => {
      mapSet.add("key1", 1);
      const set = mapSet.get("key1");
      expect(set).toBeDefined();
      // TypeScript should prevent calling add/delete on returned set
    });
  });

  describe("getAll", () => {
    it("should return all values across all keys", () => {
      mapSet.add("key1", 1);
      mapSet.add("key1", 2);
      mapSet.add("key2", 3);
      mapSet.add("key3", 4);
      const all = mapSet.getAll();
      expect(all.sort()).toEqual([1, 2, 3, 4]);
    });

    it("should return empty array when map is empty", () => {
      expect(mapSet.getAll()).toEqual([]);
    });
  });

  describe("has", () => {
    it("should return true when key has value", () => {
      mapSet.add("key1", 1);
      expect(mapSet.has("key1", 1)).toBe(true);
    });

    it("should return false when key doesn't have value", () => {
      mapSet.add("key1", 1);
      expect(mapSet.has("key1", 2)).toBe(false);
    });

    it("should return false when key doesn't exist", () => {
      expect(mapSet.has("key1", 1)).toBe(false);
    });
  });

  describe("hasKey", () => {
    it("should return true when key exists", () => {
      mapSet.add("key1", 1);
      expect(mapSet.hasKey("key1")).toBe(true);
    });

    it("should return false when key doesn't exist", () => {
      expect(mapSet.hasKey("key1")).toBe(false);
    });
  });

  describe("size", () => {
    it("should return 0 for empty map", () => {
      expect(mapSet.size()).toBe(0);
    });

    it("should return number of keys", () => {
      mapSet.add("key1", 1);
      mapSet.add("key1", 2);
      mapSet.add("key2", 3);
      expect(mapSet.size()).toBe(2);
    });

    it("should decrease when keys are removed", () => {
      mapSet.add("key1", 1);
      mapSet.add("key2", 2);
      mapSet.remove("key1", 1);
      expect(mapSet.size()).toBe(1);
    });
  });

  describe("clear", () => {
    it("should remove all keys and values", () => {
      mapSet.add("key1", 1);
      mapSet.add("key2", 2);
      mapSet.add("key3", 3);
      mapSet.clear();
      expect(mapSet.size()).toBe(0);
      expect(mapSet.get("key1")).toBeUndefined();
      expect(mapSet.get("key2")).toBeUndefined();
      expect(mapSet.get("key3")).toBeUndefined();
    });
  });

  describe("keys", () => {
    it("should return iterator of keys", () => {
      mapSet.add("key1", 1);
      mapSet.add("key2", 2);
      mapSet.add("key3", 3);
      const keys = Array.from(mapSet.keys());
      expect(keys.sort()).toEqual(["key1", "key2", "key3"]);
    });
  });

  describe("values", () => {
    it("should return iterator of sets", () => {
      mapSet.add("key1", 1);
      mapSet.add("key1", 2);
      mapSet.add("key2", 3);
      const values = Array.from(mapSet.values());
      expect(values).toHaveLength(2);
      expect(values[0]).toBeInstanceOf(Set);
      expect(values[1]).toBeInstanceOf(Set);
    });
  });

  describe("entries", () => {
    it("should return iterator of [key, set] pairs", () => {
      mapSet.add("key1", 1);
      mapSet.add("key2", 2);
      const entries = Array.from(mapSet.entries());
      expect(entries).toHaveLength(2);
      expect(entries[0][0]).toBe("key1");
      expect(entries[0][1]).toEqual(new Set([1]));
    });
  });

  describe("forEach", () => {
    it("should iterate over all key-set pairs", () => {
      mapSet.add("key1", 1);
      mapSet.add("key1", 2);
      mapSet.add("key2", 3);

      const collected: [string, Set<number>][] = [];
      mapSet.forEach((values, key) => {
        collected.push([key, new Set(values)]);
      });

      expect(collected).toHaveLength(2);
      expect(collected.find(([k]) => k === "key1")?.[1]).toEqual(
        new Set([1, 2]),
      );
      expect(collected.find(([k]) => k === "key2")?.[1]).toEqual(new Set([3]));
    });
  });
});
