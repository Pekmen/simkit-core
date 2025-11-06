export class SetPool<T> {
  private pool: Set<T>[] = [];
  private readonly maxPoolSize: number;
  private stats = {
    acquired: 0,
    released: 0,
    created: 0,
    reused: 0,
  };

  constructor(maxPoolSize = 500) {
    this.maxPoolSize = maxPoolSize;
  }

  acquire(): Set<T> {
    this.stats.acquired++;

    const set = this.pool.pop();
    if (set !== undefined) {
      this.stats.reused++;
      return set;
    }

    this.stats.created++;
    return new Set<T>();
  }

  release(set: Set<T>): void {
    this.stats.released++;

    if (this.pool.length >= this.maxPoolSize) {
      return;
    }

    set.clear();
    this.pool.push(set);
  }

  releaseAll(sets: Set<T>[]): void {
    for (const set of sets) {
      this.release(set);
    }
  }

  clear(): void {
    this.pool = [];
  }

  getPoolSize(): number {
    return this.pool.length;
  }

  getStats(): Readonly<{
    acquired: number;
    released: number;
    created: number;
    reused: number;
    reuseRate: number;
    poolSize: number;
  }> {
    const reuseRate =
      this.stats.acquired > 0 ? this.stats.reused / this.stats.acquired : 0;

    return {
      ...this.stats,
      reuseRate,
      poolSize: this.pool.length,
    };
  }

  resetStats(): void {
    this.stats = {
      acquired: 0,
      released: 0,
      created: 0,
      reused: 0,
    };
  }
}
