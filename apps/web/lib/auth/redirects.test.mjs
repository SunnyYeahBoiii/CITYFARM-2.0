import assert from "node:assert/strict";
import { describe, it } from "node:test";
import {
  buildActivationReturnPath,
  resolveLoginDestination,
} from "./redirects.ts";

describe("auth redirect helpers", () => {
  it("returns setup-password before any activation return path", () => {
    const destination = resolveLoginDestination(
      { ok: true, nextStep: "setup-password" },
      "/activate?code=CF-ACT-2026-0009",
    );

    assert.equal(destination, "/setup-password");
  });

  it("returns a safe activation return path after login", () => {
    const destination = resolveLoginDestination(
      { ok: true, nextStep: "home" },
      "/activate?code=CF-ACT-2026-0009",
    );

    assert.equal(destination, "/activate?code=CF-ACT-2026-0009");
  });

  it("falls back to home for unsafe return paths", () => {
    const destinations = [
      resolveLoginDestination({ ok: true, nextStep: "home" }, "https://evil.test/activate"),
      resolveLoginDestination({ ok: true, nextStep: "home" }, "//evil.test/activate"),
      resolveLoginDestination({ ok: true, nextStep: "home" }, "javascript:alert(1)"),
      resolveLoginDestination({ ok: true, nextStep: "home" }, "/login?returnTo=/activate"),
    ];

    assert.deepEqual(destinations, ["/home", "/home", "/home", "/home"]);
  });

  it("builds an encoded activation return path from a kit code", () => {
    assert.equal(
      buildActivationReturnPath(" CF-ACT-2026-0009 "),
      "/activate?code=CF-ACT-2026-0009",
    );
    assert.equal(
      buildActivationReturnPath("CITY KIT/001"),
      "/activate?code=CITY%20KIT%2F001",
    );
  });
});
