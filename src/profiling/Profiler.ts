const getTime = (): number => {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any, @typescript-eslint/no-unsafe-assignment
  const globalObj = globalThis as any;
  if (
    // eslint-disable-next-line @typescript-eslint/no-unsafe-member-access
    typeof globalObj.performance !== "undefined" &&
    // eslint-disable-next-line @typescript-eslint/no-unsafe-member-access
    globalObj.performance.now
  ) {
    // eslint-disable-next-line @typescript-eslint/no-unsafe-return, @typescript-eslint/no-unsafe-call, @typescript-eslint/no-unsafe-member-access
    return globalObj.performance.now();
  }
  return Date.now();
};

const warn = (message: string): void => {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any, @typescript-eslint/no-unsafe-assignment
  const globalObj = globalThis as any;
  // eslint-disable-next-line @typescript-eslint/no-unsafe-member-access
  if (typeof globalObj.console !== "undefined" && globalObj.console.warn) {
    // eslint-disable-next-line @typescript-eslint/no-unsafe-call, @typescript-eslint/no-unsafe-member-access
    globalObj.console.warn(message);
  }
};

export interface ProfileEntry {
  name: string;
  duration: number;
  count: number;
  startTime: number;
  endTime: number;
}

export interface ProfileStats {
  name: string;
  totalTime: number;
  count: number;
  avgTime: number;
  minTime: number;
  maxTime: number;
  lastTime: number;
}

export interface FrameProfile {
  frameNumber: number;
  totalTime: number;
  systemTime: number;
  queryTime: number;
  componentTime: number;
  entries: ProfileEntry[];
}

export class Profiler {
  private enabled = false;
  private currentFrame: ProfileEntry[] = [];
  private frameHistory: FrameProfile[] = [];
  private maxFrameHistory = 60;
  private frameNumber = 0;
  private activeTimers = new Map<string, number>();
  private stats = new Map<string, ProfileStats>();

  enable(): void {
    this.enabled = true;
  }

  disable(): void {
    this.enabled = false;
  }

  isEnabled(): boolean {
    return this.enabled;
  }

  start(name: string): void {
    if (!this.enabled) return;
    this.activeTimers.set(name, getTime());
  }

  end(name: string): void {
    if (!this.enabled) return;

    const endTime = getTime();
    const startTime = this.activeTimers.get(name);

    if (startTime === undefined) {
      warn(`Profiler.end() called without matching start() for: ${name}`);
      return;
    }

    const duration = endTime - startTime;
    this.activeTimers.delete(name);

    this.currentFrame.push({
      name,
      duration,
      count: 1,
      startTime,
      endTime,
    });

    this.updateStats(name, duration);
  }

  measure<T>(name: string, fn: () => T): T {
    if (!this.enabled) return fn();

    this.start(name);
    try {
      return fn();
    } finally {
      this.end(name);
    }
  }

  async measureAsync<T>(name: string, fn: () => Promise<T>): Promise<T> {
    if (!this.enabled) return fn();

    this.start(name);
    try {
      return await fn();
    } finally {
      this.end(name);
    }
  }

  endFrame(): void {
    if (!this.enabled || this.currentFrame.length === 0) return;

    const totalTime = this.currentFrame.reduce((sum, e) => sum + e.duration, 0);
    const systemTime = this.currentFrame
      .filter((e) => e.name.startsWith("system:"))
      .reduce((sum, e) => sum + e.duration, 0);
    const queryTime = this.currentFrame
      .filter((e) => e.name.startsWith("query:"))
      .reduce((sum, e) => sum + e.duration, 0);
    const componentTime = this.currentFrame
      .filter((e) => e.name.startsWith("component:"))
      .reduce((sum, e) => sum + e.duration, 0);

    const frameProfile: FrameProfile = {
      frameNumber: this.frameNumber++,
      totalTime,
      systemTime,
      queryTime,
      componentTime,
      entries: [...this.currentFrame],
    };

    this.frameHistory.push(frameProfile);

    if (this.frameHistory.length > this.maxFrameHistory) {
      this.frameHistory.shift();
    }

    this.currentFrame = [];
  }

  getStats(name: string): ProfileStats | undefined {
    return this.stats.get(name);
  }

  getAllStats(): Map<string, ProfileStats> {
    return new Map(this.stats);
  }

  getFrameHistory(): readonly FrameProfile[] {
    return this.frameHistory;
  }

  getLastFrame(): FrameProfile | undefined {
    return this.frameHistory[this.frameHistory.length - 1];
  }

  getAverageFrameTime(): number {
    if (this.frameHistory.length === 0) return 0;
    const total = this.frameHistory.reduce((sum, f) => sum + f.totalTime, 0);
    return total / this.frameHistory.length;
  }

  getFPS(): number {
    const avgFrameTime = this.getAverageFrameTime();
    return avgFrameTime > 0 ? 1000 / avgFrameTime : 0;
  }

  setMaxFrameHistory(max: number): void {
    this.maxFrameHistory = Math.max(1, max);
    while (this.frameHistory.length > this.maxFrameHistory) {
      this.frameHistory.shift();
    }
  }

  clear(): void {
    this.currentFrame = [];
    this.frameHistory = [];
    this.activeTimers.clear();
    this.stats.clear();
    this.frameNumber = 0;
  }

  generateReport(): string {
    const lines: string[] = [];
    lines.push("=== Profiler Report ===\n");

    if (this.frameHistory.length > 0) {
      lines.push(`Frames recorded: ${this.frameHistory.length.toString()}`);
      lines.push(
        `Average frame time: ${this.getAverageFrameTime().toFixed(3)}ms`,
      );
      lines.push(`Estimated FPS: ${this.getFPS().toFixed(2)}\n`);
    }

    if (this.stats.size > 0) {
      lines.push("Operation Statistics:");
      lines.push(
        "".padEnd(40) +
          "Count".padEnd(10) +
          "Total".padEnd(12) +
          "Avg".padEnd(12) +
          "Min".padEnd(12) +
          "Max".padEnd(12),
      );
      lines.push("=".repeat(98));

      const sortedStats = Array.from(this.stats.values()).sort(
        (a, b) => b.totalTime - a.totalTime,
      );

      for (const stat of sortedStats) {
        lines.push(
          stat.name.padEnd(40) +
            stat.count.toString().padEnd(10) +
            `${stat.totalTime.toFixed(3)}ms`.padEnd(12) +
            `${stat.avgTime.toFixed(3)}ms`.padEnd(12) +
            `${stat.minTime.toFixed(3)}ms`.padEnd(12) +
            `${stat.maxTime.toFixed(3)}ms`.padEnd(12),
        );
      }
    }

    return lines.join("\n");
  }

  private updateStats(name: string, duration: number): void {
    const existing = this.stats.get(name);

    if (existing) {
      existing.totalTime += duration;
      existing.count += 1;
      existing.avgTime = existing.totalTime / existing.count;
      existing.minTime = Math.min(existing.minTime, duration);
      existing.maxTime = Math.max(existing.maxTime, duration);
      existing.lastTime = duration;
    } else {
      this.stats.set(name, {
        name,
        totalTime: duration,
        count: 1,
        avgTime: duration,
        minTime: duration,
        maxTime: duration,
        lastTime: duration,
      });
    }
  }
}
