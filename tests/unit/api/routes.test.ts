import { describe, it, expect, beforeEach, vi } from "vitest";
import { NextRequest } from "next/server";
import { POST as attempt } from "@/app/api/attempt/route";
import { POST as coaching } from "@/app/api/coaching/route";
import { POST as exercise } from "@/app/api/exercise/generate/route";
import { POST as startLesson } from "@/app/api/lesson/start/route";
import { POST as upload } from "@/app/api/score/upload/route";
import { MAX_UPLOAD_BYTES } from "@/lib/validation";
import { resetRateLimits } from "@/lib/rate-limit";
import { DUMMY_ANALYSIS, createLessonFromAnalysis, storage } from "@/lib/dummy-data";

const analyze = vi.hoisted(() => vi.fn());
vi.mock("@/lib/gemini/score-analysis", () => ({ analyzeScore: analyze }));

const post = (body: BodyInit, headers: Record<string, string> = {}) =>
  new NextRequest("http://localhost/api/test", { method: "POST", body, headers });

// jsdom cannot round-trip multipart bodies, so hand the route a parsed FormData directly
const withForm = (fd: FormData) =>
  ({ headers: new Headers(), formData: async () => fd }) as unknown as NextRequest;

describe("API routes", () => {
  beforeEach(() => {
    resetRateLimits();
    delete process.env.GEMINI_API_KEY;
  });

  it.each([
    ["attempt", attempt],
    ["coaching", coaching],
    ["exercise/generate", exercise],
    ["lesson/start", startLesson],
  ])("%s returns 400, not 500, for malformed JSON", async (_name, handler) => {
    const res = await handler(post("{not json", { "content-type": "application/json" }));
    expect(res.status).toBe(400);
  });

  it("upload returns 413 when Content-Length declares an oversized body", async () => {
    const res = await upload(
      post("x", { "content-type": "multipart/form-data; boundary=x", "content-length": String(MAX_UPLOAD_BYTES * 2) })
    );
    expect(res.status).toBe(413);
  });

  it("upload returns 413 for an oversized file and 400 for a wrong type", async () => {
    const big = new FormData();
    big.append("file", new File([new Uint8Array(MAX_UPLOAD_BYTES + 1)], "big.png", { type: "image/png" }));
    expect((await upload(withForm(big))).status).toBe(413);

    const gif = new FormData();
    gif.append("file", new File(["x"], "a.gif", { type: "image/gif" }));
    expect((await upload(withForm(gif))).status).toBe(400);
  });

  it("exercise returns 503 when no key is configured", async () => {
    const res = await exercise(post(JSON.stringify({ chordSymbol: "Cm7" })));
    expect(res.status).toBe(503);
  });

  describe("lesson whose analysis has expired", () => {
    const orphanLesson = () => {
      const lesson = createLessonFromAnalysis({ ...DUMMY_ANALYSIS, id: "gone-analysis" });
      lesson.id = `lesson-orphan-${Math.random()}`;
      storage.saveLesson(lesson);
      return lesson.id;
    };

    it("attempt returns 404 instead of scoring against the sample", async () => {
      const lessonId = orphanLesson();
      const res = await attempt(
        post(JSON.stringify({ lessonId, barNumber: 1, recognizedChord: { chord: "Cm7", confidence: 0.9, voicingType: "shell", pitchClasses: [0] } }))
      );
      expect(res.status).toBe(404);
    });

    it("coaching returns 404 instead of coaching on the sample", async () => {
      const lessonId = orphanLesson();
      const res = await coaching(
        post(JSON.stringify({ lessonId, barNumber: 1, detectedChord: null, isCorrect: false }))
      );
      expect(res.status).toBe(404);
    });

    it("attempt scores against the lesson's own bar when the analysis exists", async () => {
      const analysis = { ...DUMMY_ANALYSIS, id: "own-analysis", bars: [{ ...DUMMY_ANALYSIS.bars[0], chordSymbol: "F7" }] };
      storage.saveAnalysis(analysis);
      const lesson = createLessonFromAnalysis(analysis);
      storage.saveLesson(lesson);
      const res = await attempt(
        post(JSON.stringify({ lessonId: lesson.id, barNumber: 1, recognizedChord: { chord: "Cm7", confidence: 0.9, voicingType: "shell", pitchClasses: [0] } }))
      );
      const json = await res.json();
      expect(res.status).toBe(200);
      expect(json.data.correct).toBe(false);
      expect(json.data.feedback).toContain("F7");
    });
  });

  describe("upload when analysis fails", () => {
    const png = () => {
      const fd = new FormData();
      const file = new File(["x"], "My Tune.png", { type: "image/png" });
      // jsdom's File has no arrayBuffer()
      Object.defineProperty(file, "arrayBuffer", { value: async () => new ArrayBuffer(1) });
      fd.append("file", file);
      return withForm(fd);
    };

    it("returns 502 and no sample when a key is configured", async () => {
      process.env.GEMINI_API_KEY = "test-placeholder";
      analyze.mockResolvedValue({ success: false, error: "boom" });
      const res = await upload(png());
      const json = await res.json();
      expect(res.status).toBe(502);
      expect(json.success).toBe(false);
      expect(json.error).toMatch(/Could not analyze this lead sheet/);
      expect(json.data).toBeUndefined();
    });

    it("serves a marked sample in no-key demo mode", async () => {
      analyze.mockResolvedValue({ success: false, error: "Gemini API key not configured" });
      const res = await upload(png());
      const json = await res.json();
      expect(res.status).toBe(200);
      expect(json.data.isSample).toBe(true);
      expect(json.data.analysis.title).toBe("My Tune");
    });

    it("does not mark a real analysis as a sample", async () => {
      process.env.GEMINI_API_KEY = "test-placeholder";
      analyze.mockResolvedValue({ success: true, analysis: { ...DUMMY_ANALYSIS, id: "real-1" } });
      const json = await (await upload(png())).json();
      expect(json.data.isSample).toBeUndefined();
    });
  });
});
