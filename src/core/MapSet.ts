import { SetPool } from "./SetPool.js";

export class MapSet<K, V> {
  private map = new Map<K, Set<V>>();
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  private static pool = new SetPool<any>();

  add(key: K, value: V): void {
    let set = this.map.get(key);
    if (!set) {
      set = MapSet.pool.acquire();
      this.map.set(key, set);
    }
    set.add(value);
  }

  remove(key: K, value: V): boolean {
    const set = this.map.get(key);
    if (!set) return false;

    const removed = set.delete(value);
    if (removed && set.size === 0) {
      this.map.delete(key);
      MapSet.pool.release(set);
    }
    return removed;
  }

  removeAll(key: K): boolean {
    const set = this.map.get(key);
    if (set) {
      MapSet.pool.release(set);
    }
    return this.map.delete(key);
  }

  get(key: K): ReadonlySet<V> | undefined {
    return this.map.get(key);
  }

  getAll(): V[] {
    const result: V[] = [];
    for (const set of this.map.values()) {
      result.push(...set);
    }
    return result;
  }

  has(key: K, value: V): boolean {
    return this.map.get(key)?.has(value) ?? false;
  }

  hasKey(key: K): boolean {
    return this.map.has(key);
  }

  size(): number {
    return this.map.size;
  }

  clear(): void {
    for (const set of this.map.values()) {
      MapSet.pool.release(set);
    }
    this.map.clear();
  }

  keys(): IterableIterator<K> {
    return this.map.keys();
  }

  values(): IterableIterator<ReadonlySet<V>> {
    return this.map.values() as IterableIterator<ReadonlySet<V>>;
  }

  entries(): IterableIterator<[K, Set<V>]> {
    return this.map.entries();
  }

  forEach(callback: (values: ReadonlySet<V>, key: K) => void): void {
    this.map.forEach((set, key) => {
      callback(set, key);
    });
  }
}
