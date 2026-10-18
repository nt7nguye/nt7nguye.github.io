// Port of the recursive descent parser from github.com/nt7nguye/interviewed/tree/main/vial.
// Grammar:
//   expression  -> term expression1
//   expression1 -> ("+" | "-") term expression1 | ε
//   term        -> factor term1
//   term1       -> ("*" | "/" | "^") factor term1 | "%" term1 | ε
//   factor      -> number | "(" expression ")" | "-" factor | "√" factor

function parse(expr) {
  let i = 0;
  let tok;

  const isDigit = (c) => c >= "0" && c <= "9";
  const node = (op, left = null, right = null, value = 0) => ({ op, left, right, value });
  const num = (value) => node("num", null, null, value);

  function next() {
    if (i >= expr.length) return (tok = { type: "eof" });
    const c = expr[i];
    if (isDigit(c) || c === ".") {
      const start = i;
      while (i < expr.length && (isDigit(expr[i]) || expr[i] === ".")) i++;
      return (tok = { type: "num", value: Number(expr.slice(start, i)) });
    }
    if (!"+-*/%^√()".includes(c)) throw new Error(`Invalid token ${c} at index ${i}`);
    i++;
    return (tok = { type: c });
  }

  // expression1 and term1 fold the rest of a chain into one node with the
  // children reversed: "10-2-3" parses as 10 + ((0 - 3) - 2).
  function expression() { return node("+", term(), expression1()); }
  function expression1() {
    if (tok.type === "+" || tok.type === "-") {
      const op = tok.type;
      next();
      const t = term();
      return node(op, expression1(), t);
    }
    return num(0);
  }
  function term() { return node("*", factor(), term1()); }
  function term1() {
    if (tok.type === "*" || tok.type === "/" || tok.type === "^") {
      const op = tok.type;
      next();
      const f = factor();
      return node(op, term1(), f);
    }
    if (tok.type === "%") {
      next();
      return node("/", term1(), num(100));
    }
    return num(1);
  }
  function factor() {
    if (tok.type === "num") { const n = num(tok.value); next(); return n; }
    if (tok.type === "(") {
      next();
      const e = expression();
      if (tok.type !== ")") throw new Error("Expected )");
      next();
      return e;
    }
    if (tok.type === "-") { next(); return node("neg", factor()); }
    if (tok.type === "√") { next(); return node("√", factor()); }
    if (tok.type === "eof") return num(0);
    throw new Error(`Unexpected ${tok.type} at index ${i}`);
  }

  next();
  const tree = expression();
  if (tok.type !== "eof") throw new Error(`Unexpected ${tok.type} at index ${i}`);
  return tree;
}

function evaluate(n) {
  // "^" is the one operator where the reversed children matter, so it is
  // special-cased: x * (rest ^ y) is evaluated as x ^ (rest * y).
  if (n.right && n.right.op === "^") return Math.pow(evaluate(n.left), evaluate({ ...n.right, op: "*" }));
  if (n.left && n.left.op === "^") return Math.pow(evaluate(n.right), evaluate({ ...n.left, op: "*" }));
  switch (n.op) {
    case "num": return n.value;
    case "neg": return -evaluate(n.left);
    case "√": return Math.sqrt(evaluate(n.left));
    case "+": return evaluate(n.left) + evaluate(n.right);
    case "-": return evaluate(n.left) - evaluate(n.right);
    case "*": return evaluate(n.left) * evaluate(n.right);
    case "/": return evaluate(n.left) / evaluate(n.right);
  }
}

// Drop the identity nodes (x + 0, x * 1) so the printed tree is readable.
function simplify(n) {
  if (!n || n.op === "num") return n;
  const l = simplify(n.left), r = simplify(n.right);
  const is = (x, v) => x && x.op === "num" && x.value === v;
  if (n.op === "+" && is(r, 0)) return l;
  if (n.op === "+" && is(l, 0)) return r;
  if (n.op === "*" && is(r, 1)) return l;
  if (n.op === "*" && is(l, 1)) return r;
  return { ...n, left: l, right: r };
}

function show(n, pad = "") {
  if (n.op === "num") return pad + n.value + "\n";
  return pad + n.op + "\n" + show(n.left, pad + "  ") + (n.right ? show(n.right, pad + "  ") : "");
}

export function mount(root) {
  const input = root.querySelector("input");
  const out = root.querySelector("pre");
  function run() {
    try {
      const tree = parse(input.value.replace(/\s/g, ""));
      out.textContent = "= " + evaluate(tree) + "\n\n" + show(simplify(tree));
    } catch (e) {
      out.textContent = e.message;
    }
  }
  input.addEventListener("input", run);
  run();
}
