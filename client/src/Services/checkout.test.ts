/// <reference types="node" />
import assert from "node:assert/strict";
import { test } from "node:test";
import { readFileSync } from "node:fs";
import { runInNewContext } from "node:vm";
import { webcrypto } from "node:crypto";
import ts from "typescript";

// Exercise the real service with a substituted HTTP boundary, without a live API.
const source = readFileSync(new URL("./checkout.ts", import.meta.url), "utf8");
const compiled = ts.transpileModule(source, { compilerOptions: { module: ts.ModuleKind.CommonJS, esModuleInterop: true } }).outputText;
type Input = { customerInfo: Record<string, string>; cartItems: { _id: string; quantity: number }[] };
type Service = { placeOrder(input: Input, identity: string): Promise<{ _id: string }>; finishCheckout(identity: string): void };
const input: Input = { customerInfo: { name: "Test", email: "test@example.com" }, cartItems: [{ _id: "product", quantity: 1 }] };
function load(storage: Map<string, string>, post: (url: string, input: Input, options: { headers: Record<string, string> }) => Promise<unknown>): Service {
  const exports = {};
  runInNewContext(compiled, {
    exports, crypto: webcrypto,
    require: () => ({ __esModule: true, default: { post } }),
    sessionStorage: {
      getItem: (key: string) => storage.get(key) ?? null,
      setItem: (key: string, value: string) => storage.set(key, value),
      removeItem: (key: string) => storage.delete(key),
    },
  });
  return exports as Service;
}

test("an ambiguous failure and a page reload reuse the same checkout key", async () => {
  const storage = new Map<string, string>(); const keys: string[] = [];
  const post = async (_url: string, _input: Input, options: { headers: Record<string, string> }) => {
    keys.push(options.headers["Idempotency-Key"]);
    if (keys.length === 1) throw new Error("response lost");
    return { data: { _id: "existing-order" } };
  };
  await assert.rejects(load(storage, post).placeOrder(input, "guest"));
  const response = await load(storage, post).placeOrder(input, "guest");
  assert.equal(keys[0], keys[1]); assert.equal(response._id, "existing-order");
});

test("changed inputs and different identities do not reuse a request key", async () => {
  const keys: string[] = []; const storage = new Map<string, string>();
  const service = load(storage, async (_url, _input, options) => { keys.push(options.headers["Idempotency-Key"]); return { data: { _id: "order" } }; });
  await service.placeOrder(input, "guest");
  await service.placeOrder(input, "customer");
  await service.placeOrder({ ...input, cartItems: [{ _id: "product", quantity: 2 }] }, "guest");
  assert.equal(new Set(keys).size, 3);
});

test("finishing checkout allows a new intentional order for the same products", async () => {
  const keys: string[] = []; const storage = new Map<string, string>();
  const service = load(storage, async (_url, _input, options) => { keys.push(options.headers["Idempotency-Key"]); return { data: { _id: "order" } }; });
  await service.placeOrder(input, "customer");
  service.finishCheckout("customer");
  await service.placeOrder(input, "customer");
  assert.notEqual(keys[0], keys[1]);
});
