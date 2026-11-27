/**
 * safe-math.ts — a tiny, dependency-free calculator for the Logician agent.
 *
 * WHY THIS EXISTS
 * The old calculator ran `new Function("return " + expression)()`. That is the
 * same as `eval`: the LLM (and therefore anyone who can steer the LLM through
 * the proposal text) could run arbitrary JavaScript on the server, e.g.
 * `process.env` to read your API keys. This file only understands arithmetic.
 *
 * HOW IT WORKS (a "recursive-descent parser")
 *   expression := term (("+" | "-") term)*
 *   term       := power (("*" | "/" | "%") power)*
 *   power      := unary ("^" power)?          // right-associative: 2^3^2 = 2^9
 *   unary      := ("-" | "+") unary | call
 *   call       := NAME "(" args ")" | NAME | NUMBER | "(" expression ")"
 * Each grammar rule becomes one function. Lower rules bind tighter, which is
 * how "*" beats "+" without any precedence table.
 */

const FUNCTIONS: Record<string, (...args: number[]) => number> = {
  sqrt: Math.sqrt, abs: Math.abs, exp: Math.exp,
  ln: Math.log, log: Math.log10, log10: Math.log10, log2: Math.log2,
  sin: Math.sin, cos: Math.cos, tan: Math.tan,
  floor: Math.floor, ceil: Math.ceil, round: Math.round,
  min: Math.min, max: Math.max, pow: Math.pow,
};

const CONSTANTS: Record<string, number> = { pi: Math.PI, e: Math.E };

const MAX_LENGTH = 300;

type Token =
  | { kind: "num"; value: number }
  | { kind: "name"; value: string }
  | { kind: "op"; value: string };

function tokenize(src: string): Token[] {
  const tokens: Token[] = [];
  let i = 0;
  while (i < src.length) {
    const ch = src[i];
    if (/\s/.test(ch) || ch === ",") {
      if (ch === ",") tokens.push({ kind: "op", value: "," });
      i++;
      continue;
    }
    // Numbers: 12, 3.5, .5, 1e-3, 2.5E6
    const num = /^(\d+\.?\d*|\.\d+)([eE][+-]?\d+)?/.exec(src.slice(i));
    if (num) {
      tokens.push({ kind: "num", value: parseFloat(num[0]) });
      i += num[0].length;
      continue;
    }
    const name = /^[a-zA-Z_][a-zA-Z0-9_]*/.exec(src.slice(i));
    if (name) {
      tokens.push({ kind: "name", value: name[0].toLowerCase() });
      i += name[0].length;
      continue;
    }
    if ("+-*/%^()".includes(ch)) {
      // Treat "**" as power, like Python.
      if (ch === "*" && src[i + 1] === "*") {
        tokens.push({ kind: "op", value: "^" });
        i += 2;
        continue;
      }
      tokens.push({ kind: "op", value: ch });
      i++;
      continue;
    }
    throw new Error(`Unexpected character "${ch}" at position ${i}`);
  }
  return tokens;
}

export function evaluate(expression: string): number {
  if (typeof expression !== "string" || expression.trim() === "") {
    throw new Error("Empty expression");
  }
  if (expression.length > MAX_LENGTH) {
    throw new Error(`Expression longer than ${MAX_LENGTH} characters`);
  }

  const tokens = tokenize(expression);
  let pos = 0;

  const peek = () => tokens[pos];
  const isOp = (v: string) => peek()?.kind === "op" && peek()!.value === v;
  const expectOp = (v: string) => {
    if (!isOp(v)) throw new Error(`Expected "${v}"`);
    pos++;
  };

  function parseExpression(): number {
    let value = parseTerm();
    while (isOp("+") || isOp("-")) {
      const op = tokens[pos++].value;
      const rhs = parseTerm();
      value = op === "+" ? value + rhs : value - rhs;
    }
    return value;
  }

  function parseTerm(): number {
    let value = parsePower();
    while (isOp("*") || isOp("/") || isOp("%")) {
      const op = tokens[pos++].value;
      const rhs = parsePower();
      if (op === "*") value *= rhs;
      else if (op === "/") value /= rhs;
      else value %= rhs;
    }
    return value;
  }

  function parsePower(): number {
    const base = parseUnary();
    if (isOp("^")) {
      pos++;
      return Math.pow(base, parsePower());
    }
    return base;
  }

  function parseUnary(): number {
    if (isOp("-")) { pos++; return -parseUnary(); }
    if (isOp("+")) { pos++; return parseUnary(); }
    return parseCall();
  }

  function parseCall(): number {
    const tok = peek();
    if (!tok) throw new Error("Unexpected end of expression");

    if (tok.kind === "num") { pos++; return tok.value; }

    if (tok.kind === "op" && tok.value === "(") {
      pos++;
      const value = parseExpression();
      expectOp(")");
      return value;
    }

    if (tok.kind === "name") {
      pos++;
      if (isOp("(")) {
        const fn = FUNCTIONS[tok.value];
        if (!fn) throw new Error(`Unknown function "${tok.value}"`);
        pos++;
        const args: number[] = [];
        if (!isOp(")")) {
          args.push(parseExpression());
          while (isOp(",")) { pos++; args.push(parseExpression()); }
        }
        expectOp(")");
        return fn(...args);
      }
      if (tok.value in CONSTANTS) return CONSTANTS[tok.value];
      throw new Error(`Unknown name "${tok.value}"`);
    }

    throw new Error(`Unexpected "${tok.value}"`);
  }

  const result = parseExpression();
  if (pos !== tokens.length) {
    throw new Error(`Unexpected "${tokens[pos].value}" after end of expression`);
  }
  if (!Number.isFinite(result)) throw new Error("Result is not a finite number");
  return result;
}
