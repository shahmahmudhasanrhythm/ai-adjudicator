#!/usr/bin/env node
/**
 * Verdict.AI benchmark: does the 4-agent debate catch flaws better than one model?
 *
 * Usage (with `npm run dev` running in another terminal):
 *   node benchmark/run.mjs --mode debate --tier plus
 *   node benchmark/run.mjs --mode single --tier plus
 *   node benchmark/run.mjs --summary              # compare every saved run
 *
 * Options:
 *   --url http://localhost:3000   where the app is running
 *   --mode debate|single           full tribunal, or single-model baseline
 *   --tier lite|plus|pro
 *   --limit 5                      only run the first N cases (cheap smoke test)
 *
 * Needs BENCHMARK_SECRET in .env.local (the same value the server reads).
 *
 * Metrics
 *   accuracy     share of cases where score < pass_threshold matches expected "reject"
 *   flaw recall  for flawed cases, share where the written reasoning mentions the real flaw
 *                (keyword match: crude but transparent, so read the outputs too)
 *   false alarms sound proposals that were rejected
 */
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const here = path.dirname(fileURLToPath(import.meta.url));
const resultsDir = path.join(here, "results");

function parseArgs(argv) {
  const args = { url: "http://localhost:3000", mode: "debate", tier: "plus", limit: Infinity, summary: false };
  for (let i = 0; i < argv.length; i++) {
    const a = argv[i];
    if (a === "--summary") args.summary = true;
    else if (a.startsWith("--")) args[a.slice(2)] = argv[++i];
  }
  args.limit = Number(args.limit) || Infinity;
  return args;
}

function loadEnvLocal() {
  const p = path.join(here, "..", ".env.local");
  if (!fs.existsSync(p)) return;
  for (const line of fs.readFileSync(p, "utf8").split("\n")) {
    const m = /^\s*([A-Z0-9_]+)\s*=\s*(.*)\s*$/.exec(line);
    if (m && !process.env[m[1]]) process.env[m[1]] = m[2].replace(/^["']|["']$/g, "");
  }
}

const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

async function callTribunal({ url, mode, tier }, proposal, secret) {
  for (let attempt = 0; attempt < 6; attempt++) {
    const started = Date.now();
    const res = await fetch(`${url}/api/adjudicate`, {
      method: "POST",
      headers: { "Content-Type": "application/json", "x-benchmark-secret": secret },
      body: JSON.stringify({ argument: proposal, tier, mode }),
    });
    const body = await res.json().catch(() => ({}));
    if (res.status === 429) {
      const wait = Number(/retry in (\d+)/.exec(body.error || "")?.[1] ?? 30);
      console.log(`   rate limited, waiting ${wait + 2}s`);
      await sleep((wait + 2) * 1000);
      continue;
    }
    if (!res.ok) throw new Error(`HTTP ${res.status}: ${body.error ?? "unknown error"}`);
    return { ...body, latencyMs: Date.now() - started };
  }
  throw new Error("Still rate limited after 6 attempts");
}

function scoreCase(c, out, threshold) {
  const score = parseFloat(out.score);
  const predicted = Number.isFinite(score) && score < threshold ? "reject" : "approve";
  const text = `${out.prosecutorCritique ?? ""}\n${out.chiefJusticeRuling ?? ""}`.toLowerCase();
  const flawFound =
    c.expected === "reject" ? c.flaw_keywords.some((k) => text.includes(k.toLowerCase())) : null;
  return { predicted, correct: predicted === c.expected, flawFound, score };
}

function summarize(rows) {
  const n = rows.length;
  const flawed = rows.filter((r) => r.expected === "reject");
  const sound = rows.filter((r) => r.expected === "approve");
  const pct = (a, b) => (b ? `${((100 * a) / b).toFixed(0)}%` : "n/a");
  const ok = rows.filter((r) => !r.error);
  return {
    cases: n,
    errors: rows.filter((r) => r.error).length,
    accuracy: pct(ok.filter((r) => r.correct).length, ok.length),
    flawRecall: pct(flawed.filter((r) => r.flawFound).length, flawed.filter((r) => !r.error).length),
    falseAlarms: `${sound.filter((r) => !r.error && r.predicted === "reject").length}/${sound.filter((r) => !r.error).length}`,
    meanLatencyS: ok.length ? (ok.reduce((s, r) => s + r.latencyMs, 0) / ok.length / 1000).toFixed(1) : "n/a",
  };
}

async function main() {
  const args = parseArgs(process.argv.slice(2));

  if (args.summary) {
    if (!fs.existsSync(resultsDir)) return console.log("No results yet. Run a benchmark first.");
    const table = fs
      .readdirSync(resultsDir)
      .filter((f) => f.endsWith(".json"))
      .map((f) => {
        const r = JSON.parse(fs.readFileSync(path.join(resultsDir, f), "utf8"));
        return { run: f.replace(".json", ""), mode: r.mode, tier: r.tier, ...summarize(r.rows) };
      });
    console.table(table);
    return;
  }

  loadEnvLocal();
  const secret = process.env.BENCHMARK_SECRET;
  if (!secret) throw new Error("Set BENCHMARK_SECRET in .env.local (and restart `npm run dev`).");

  const { cases, pass_threshold: threshold } = JSON.parse(
    fs.readFileSync(path.join(here, "proposals.json"), "utf8"),
  );
  const selected = cases.slice(0, args.limit);
  console.log(`Running ${selected.length} cases | mode=${args.mode} tier=${args.tier}\n`);

  const rows = [];
  for (const [i, c] of selected.entries()) {
    process.stdout.write(`[${i + 1}/${selected.length}] ${c.id} ... `);
    try {
      const out = await callTribunal(args, c.proposal, secret);
      const s = scoreCase(c, out, threshold);
      rows.push({ id: c.id, expected: c.expected, ...s, latencyMs: out.latencyMs, verdict: out.verdict, output: out });
      console.log(`${s.correct ? "OK " : "MISS"} score=${out.score} ${c.expected === "reject" ? `flawFound=${s.flawFound}` : ""}`);
    } catch (e) {
      rows.push({ id: c.id, expected: c.expected, error: String(e.message ?? e) });
      console.log(`ERROR ${e.message}`);
    }
  }

  fs.mkdirSync(resultsDir, { recursive: true });
  const stamp = new Date().toISOString().replace(/[:.]/g, "-").slice(0, 19);
  const file = path.join(resultsDir, `${stamp}_${args.mode}_${args.tier}.json`);
  fs.writeFileSync(file, JSON.stringify({ mode: args.mode, tier: args.tier, threshold, rows }, null, 2));

  console.log("\nSummary:");
  console.table([summarize(rows)]);
  console.log(`Saved full outputs to ${path.relative(process.cwd(), file)}`);
}

main().catch((e) => {
  console.error(e.message ?? e);
  process.exit(1);
});
