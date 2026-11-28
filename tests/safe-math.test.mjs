// Run with:  npm test   (uses Node's built-in test runner; Node 22.18+ can import .ts directly)
import { test } from "node:test";
import assert from "node:assert/strict";
import { evaluate } from "../src/lib/safe-math.ts";

test("basic arithmetic and precedence", () => {
  assert.equal(evaluate("1 + 2 * 3"), 7);
  assert.equal(evaluate("(1 + 2) * 3"), 9);
  assert.equal(evaluate("10 / 4"), 2.5);
  assert.equal(evaluate("-3 + 5"), 2);
  assert.equal(evaluate("2 * -3"), -6);
});

test("powers are right-associative and ** works", () => {
  assert.equal(evaluate("2^3^2"), 512);
  assert.equal(evaluate("2**10"), 1024);
});

test("scientific notation, functions and constants", () => {
  assert.equal(evaluate("1.5e3 * 2"), 3000);
  assert.equal(evaluate("sqrt(16) + abs(-2)"), 6);
  assert.equal(evaluate("max(3, 7, 5)"), 7);
  assert.ok(Math.abs(evaluate("2 * pi") - 2 * Math.PI) < 1e-12);
  assert.equal(evaluate("log(1000)"), 3);
});

test("realistic engineering checks", () => {
  // 20 W panel x 5 sun-hours vs 50 W load x 24 h
  assert.equal(evaluate("20 * 5 - 50 * 24"), -1100);
  // 75 kWh battery on a 7 kW charger
  assert.ok(Math.abs(evaluate("75 / 7") - 10.714) < 0.001);
});

test("refuses anything that is not arithmetic", () => {
  for (const evil of [
    "process.env",
    "require('fs')",
    "constructor.constructor('return process')()",
    "this",
    "1; 2",
    "`${1}`",
    "[1,2]",
    "x = 5",
  ]) {
    assert.throws(() => evaluate(evil), `should reject: ${evil}`);
  }
});

test("rejects malformed and non-finite input", () => {
  assert.throws(() => evaluate(""));
  assert.throws(() => evaluate("1 +"));
  assert.throws(() => evaluate("(1 + 2"));
  assert.throws(() => evaluate("1 / 0"));
  assert.throws(() => evaluate("9".repeat(400)));
});
