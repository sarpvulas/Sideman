import { describe, it, expect, beforeEach } from "vitest";
import { NextRequest } from "next/server";
import { POST as attempt } from "@/app/api/attempt/route";
import { POST as coaching } from "@/app/api/coaching/route";
import { POST as exercise } from "@/app/api/exercise/generate/route";
import { POST as startLesson } from "@/app/api/lesson/start/route";
import { POST as upload } from "@/app/api/score/upload/route";
import { MAX_UPLOAD_BYTES } from "@/lib/validation";
import { resetRateLimits } from "@/lib/rate-limit";

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
});
