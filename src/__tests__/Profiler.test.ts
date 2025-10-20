/* eslint-disable @typescript-eslint/no-non-null-assertion */
/* eslint-disable @typescript-eslint/no-unsafe-assignment */
/* eslint-disable @typescript-eslint/no-unsafe-call */
/* eslint-disable @typescript-eslint/no-unsafe-member-access */
/* eslint-disable @typescript-eslint/no-empty-function */
import { describe, it, expect, beforeEach, vi } from "vitest";
import { Profiler } from "../profiling/Profiler.js";

describe("Profiler", () => {
  let profiler: Profiler;

  beforeEach(() => {
    profiler = new Profiler();
  });

  describe("enable/disable", () => {
    it("should start disabled by default", () => {
      expect(profiler.isEnabled()).toBe(false);
    });

    it("should enable profiling", () => {
      profiler.enable();
      expect(profiler.isEnabled()).toBe(true);
    });

    it("should disable profiling", () => {
      profiler.enable();
      profiler.disable();
      expect(profiler.isEnabled()).toBe(false);
    });

    it("should not record when disabled", () => {
      profiler.start("test");
      profiler.end("test");
      expect(profiler.getAllStats().size).toBe(0);
    });
  });

  describe("timing operations", () => {
    beforeEach(() => {
      profiler.enable();
    });

    it("should record operation timing", () => {
      profiler.start("operation");
      profiler.end("operation");

      const stats = profiler.getStats("operation");
      expect(stats).toBeDefined();
      expect(stats!.name).toBe("operation");
      expect(stats!.count).toBe(1);
      expect(stats!.totalTime).toBeGreaterThan(0);
    });

    it("should accumulate multiple operations", () => {
      profiler.start("operation");
      profiler.end("operation");
      profiler.start("operation");
      profiler.end("operation");

      const stats = profiler.getStats("operation");
      expect(stats!.count).toBe(2);
    });

    it("should warn when ending without matching start", () => {
      const consoleWarnSpy = vi
        .spyOn(console, "warn")
        .mockImplementation(() => {});

      profiler.end("nonexistent");

      expect(consoleWarnSpy).toHaveBeenCalledWith(
        expect.stringContaining(
          "Profiler.end() called without matching start()",
        ),
      );

      consoleWarnSpy.mockRestore();
    });

    it("should track min/max/avg times", () => {
      // Use measure to ensure different timings
      profiler.measure("operation", () => {
        // Fast operation
      });

      const stats = profiler.getStats("operation");
      expect(stats!.minTime).toBeGreaterThanOrEqual(0);
      expect(stats!.maxTime).toBeGreaterThanOrEqual(stats!.minTime);
      expect(stats!.avgTime).toBeGreaterThanOrEqual(0);
    });
  });

  describe("measure function", () => {
    beforeEach(() => {
      profiler.enable();
    });

    it("should measure synchronous function execution", () => {
      const result = profiler.measure("test", () => {
        return 42;
      });

      expect(result).toBe(42);
      const stats = profiler.getStats("test");
      expect(stats).toBeDefined();
      expect(stats!.count).toBe(1);
    });

    it("should measure async function execution", async () => {
      const result = await profiler.measureAsync("test", async () => {
        return Promise.resolve(42);
      });

      expect(result).toBe(42);
      const stats = profiler.getStats("test");
      expect(stats).toBeDefined();
      expect(stats!.count).toBe(1);
    });

    it("should return result even when disabled", () => {
      profiler.disable();
      const result = profiler.measure("test", () => 42);
      expect(result).toBe(42);
    });
  });

  describe("frame tracking", () => {
    beforeEach(() => {
      profiler.enable();
    });

    it("should track frame data", () => {
      profiler.start("operation");
      profiler.end("operation");
      profiler.endFrame();

      const frame = profiler.getLastFrame();
      expect(frame).toBeDefined();
      expect(frame!.frameNumber).toBe(0);
      expect(frame!.entries.length).toBe(1);
    });

    it("should increment frame number", () => {
      profiler.start("op");
      profiler.end("op");
      profiler.endFrame();

      profiler.start("op");
      profiler.end("op");
      profiler.endFrame();

      const history = profiler.getFrameHistory();
      expect(history.length).toBe(2);
      expect(history[0].frameNumber).toBe(0);
      expect(history[1].frameNumber).toBe(1);
    });

    it("should categorize frame time by operation type", () => {
      profiler.start("system:TestSystem");
      profiler.end("system:TestSystem");
      profiler.start("query:execute");
      profiler.end("query:execute");
      profiler.start("component:add");
      profiler.end("component:add");
      profiler.endFrame();

      const frame = profiler.getLastFrame();
      expect(frame!.systemTime).toBeGreaterThan(0);
      expect(frame!.queryTime).toBeGreaterThan(0);
      expect(frame!.componentTime).toBeGreaterThan(0);
    });

    it("should limit frame history size", () => {
      profiler.setMaxFrameHistory(3);

      for (let i = 0; i < 5; i++) {
        profiler.start("op");
        profiler.end("op");
        profiler.endFrame();
      }

      const history = profiler.getFrameHistory();
      expect(history.length).toBe(3);
      expect(history[0].frameNumber).toBe(2);
      expect(history[2].frameNumber).toBe(4);
    });

    it("should not record empty frames", () => {
      profiler.endFrame();
      expect(profiler.getFrameHistory().length).toBe(0);
    });
  });

  describe("statistics", () => {
    beforeEach(() => {
      profiler.enable();
    });

    it("should calculate average frame time", () => {
      for (let i = 0; i < 3; i++) {
        profiler.start("op");
        profiler.end("op");
        profiler.endFrame();
      }

      const avgTime = profiler.getAverageFrameTime();
      expect(avgTime).toBeGreaterThan(0);
    });

    it("should calculate FPS", () => {
      profiler.start("op");
      profiler.end("op");
      profiler.endFrame();

      const fps = profiler.getFPS();
      expect(fps).toBeGreaterThan(0);
    });

    it("should return 0 FPS when no frames recorded", () => {
      expect(profiler.getFPS()).toBe(0);
    });

    it("should get all stats", () => {
      profiler.start("op1");
      profiler.end("op1");
      profiler.start("op2");
      profiler.end("op2");

      const allStats = profiler.getAllStats();
      expect(allStats.size).toBe(2);
      expect(allStats.has("op1")).toBe(true);
      expect(allStats.has("op2")).toBe(true);
    });
  });

  describe("clear", () => {
    beforeEach(() => {
      profiler.enable();
    });

    it("should clear all profiling data", () => {
      profiler.start("op");
      profiler.end("op");
      profiler.endFrame();

      profiler.clear();

      expect(profiler.getAllStats().size).toBe(0);
      expect(profiler.getFrameHistory().length).toBe(0);
      expect(profiler.getLastFrame()).toBeUndefined();
    });
  });

  describe("report generation", () => {
    beforeEach(() => {
      profiler.enable();
    });

    it("should generate a formatted report", () => {
      profiler.start("system:TestSystem");
      profiler.end("system:TestSystem");
      profiler.endFrame();

      const report = profiler.generateReport();
      expect(report).toContain("Profiler Report");
      expect(report).toContain("Frames recorded");
      expect(report).toContain("Average frame time");
      expect(report).toContain("Estimated FPS");
      expect(report).toContain("system:TestSystem");
    });

    it("should generate minimal report when no data", () => {
      const report = profiler.generateReport();
      expect(report).toContain("Profiler Report");
    });
  });

  describe("edge cases", () => {
    beforeEach(() => {
      profiler.enable();
    });

    it("should handle nested start calls for same operation", () => {
      profiler.start("operation");
      profiler.start("operation");
      profiler.end("operation");

      const stats = profiler.getStats("operation");
      expect(stats).toBeDefined();
      expect(stats!.count).toBe(1);
    });

    it("should handle getStats for non-existent operation", () => {
      const stats = profiler.getStats("nonexistent");
      expect(stats).toBeUndefined();
    });

    it("should handle very small frame history limit", () => {
      profiler.setMaxFrameHistory(1);

      profiler.start("op");
      profiler.end("op");
      profiler.endFrame();

      profiler.start("op");
      profiler.end("op");
      profiler.endFrame();

      const history = profiler.getFrameHistory();
      expect(history.length).toBe(1);
    });

    it("should return undefined for getLastFrame when no frames recorded", () => {
      expect(profiler.getLastFrame()).toBeUndefined();
    });

    it("should handle async function errors correctly", async () => {
      await expect(
        profiler.measureAsync("test", async () => {
          await Promise.resolve();
          throw new Error("Test error");
        }),
      ).rejects.toThrow("Test error");
    });

    it("should still record timing when async function throws", async () => {
      try {
        await profiler.measureAsync("test", async () => {
          await Promise.resolve();
          throw new Error("Test error");
        });
      } catch {}

      const stats = profiler.getStats("test");
      expect(stats).toBeDefined();
      expect(stats!.count).toBe(1);
    });
  });
});
