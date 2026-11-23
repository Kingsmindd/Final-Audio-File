import assert from "node:assert/strict";
import { afterEach, test, mock } from "node:test";
import { randomUUID } from "node:crypto";
import express, { type Response } from "express";
import type { AddressInfo } from "node:net";
import jwt from "jsonwebtoken";
import bcrypt from "bcryptjs";
import Order from "../models/Order";
import Product from "../models/Product";
import User from "../models/User";
import {
  createOrder,
  updateOrderStatus,
  getDashboardstats,
} from "../controller/orderControllers";
import { register, login, updateProfile } from "../controller/userController";
import { protect } from "../middleware/authMiddleware";
import { loginLimiter, registrationLimiter } from "../middleware/authRateLimit";
import { validPassword } from "../validation/auth";
import type { AuthRequest } from "../types/indexServer";

// Database boundaries are substituted: no real accounts, orders, email or cloud writes.
// MongoDB's unique-index enforcement still needs deployment/database integration testing.
process.env.JWT_SECRET = "isolated-test-secret-for-audiophile-only";
afterEach(() => mock.restoreAll());
const userId = "507f1f77bcf86cd799439011";
const productId = "507f191e810c19729de860ea";
const customerInfo = {
  name: "Test Customer",
  email: "test@example.com",
  phone: "08012345678",
  address: "1 Test Street",
  city: "Lagos",
  zipCode: "100001",
  country: "Nigeria",
  paymentMethod: "Cash on Delivery",
};
const checkout = () => ({
  customerInfo,
  cartItems: [{ _id: productId, quantity: 2, price: 1 }],
});
function response() {
  const result = { status: 200, body: undefined as any };
  const res = {
    status(code: number) {
      result.status = code;
      return res;
    },
    json(body: unknown) {
      result.body = body;
      return res;
    },
  } as Response;
  return { result, res };
}
function request(body: unknown = {}, key?: string, user?: unknown) {
  return {
    body,
    params: {},
    headers: {},
    user,
    get: (name: string) =>
      name.toLowerCase() === "idempotency-key" ? key : undefined,
  } as unknown as AuthRequest;
}
function select<T>(value: T) {
  return { select: async () => value };
}

test("registration normalizes email and returns no token", async () => {
  mock.method(User, "findOne", (() => Promise.resolve(null)) as never);
  mock.method(User, "create", (async (input: any) => {
    assert.equal(input.email, "test@example.com");
    assert.equal(input.name, "Test");
    assert.equal(input.isAdmin, undefined);
    return new User(input);
  }) as never);
  const { result, res } = response();
  await register(
    request({
      name: " Test ",
      email: " TEST@example.com ",
      password: "password123",
      isAdmin: true,
    }),
    res,
  );
  assert.equal(result.status, 201);
  assert.equal(result.body.token, undefined);
  assert.equal(result.body.isAdmin, false);
});

test("invalid registration and bcrypt byte overflow never reach the database", async () => {
  const find = mock.method(User, "findOne", (() => {
    throw new Error("must not query");
  }) as never);
  for (const password of ["short", "a".repeat(73), "😀".repeat(19), {}]) {
    const { result, res } = response();
    await register(
      request({ name: "Test", email: "test@example.com", password }),
      res,
    );
    assert.equal(result.status, 400);
  }
  assert.equal(find.mock.callCount(), 0);
  assert.equal(validPassword("a".repeat(72)), true);
});

test("login issues a token with the current session version", async () => {
  const user = new User({
    _id: userId,
    name: "Test",
    email: "test@example.com",
    password: await bcrypt.hash("password123", 4),
    sessionVersion: 3,
  });
  mock.method(User, "findOne", (() => select(user)) as never);
  const { result, res } = response();
  await login(
    request({ email: "test@example.com", password: "password123" }),
    res,
  );
  assert.equal(result.status, 200);
  const payload = jwt.verify(
    result.body.token,
    process.env.JWT_SECRET!,
  ) as jwt.JwtPayload;
  assert.equal(payload.sessionVersion, 3);
});

test("password change requires current password, revokes old tokens, and keeps its new token valid", async () => {
  const user = new User({
    _id: userId,
    name: "Test",
    email: "test@example.com",
    password: await bcrypt.hash("password123", 4),
    sessionVersion: 0,
  });
  mock.method(User, "findById", (() => select(user)) as never);
  // Simulate successful persistence; bcrypt itself is exercised by matchPassword above.
  const save = mock.method(user, "save", (async () => user) as never);
  for (const currentPassword of [undefined, "incorrect123"]) {
    const { result, res } = response();
    await updateProfile(
      request({ password: "replacement123", currentPassword }, undefined, {
        _id: user._id,
        sessionVersion: 0,
      }),
      res,
    );
    assert.equal(result.status, 400);
  }
  assert.equal(save.mock.callCount(), 0);
  const { result, res } = response();
  await updateProfile(
    request(
      { password: "replacement123", currentPassword: "password123" },
      undefined,
      { _id: user._id, sessionVersion: 0 },
    ),
    res,
  );
  assert.equal(result.status, 200);
  assert.equal(user.sessionVersion, 1);
  for (const version of [undefined, 0, 1]) {
    const token = jwt.sign(
      {
        id: userId,
        ...(version === undefined ? {} : { sessionVersion: version }),
      },
      process.env.JWT_SECRET!,
    );
    const req = request();
    req.headers.authorization = "Bearer " + token;
    const auth = response();
    let allowed = false;
    await protect(req, auth.res, () => {
      allowed = true;
    });
    assert.equal(allowed, version === 1);
    if (!allowed) assert.equal(auth.result.status, 401);
  }
  assert.equal(
    (jwt.verify(result.body.token, process.env.JWT_SECRET!) as jwt.JwtPayload)
      .sessionVersion,
    1,
  );
});

test("a stale authenticated profile request cannot mint a fresh token", async () => {
  const user = new User({ _id: userId, name: "Test", sessionVersion: 2 });
  mock.method(User, "findById", (() => select(user)) as never);
  const { result, res } = response();
  await updateProfile(
    request({ name: "Other" }, undefined, { _id: user._id, sessionVersion: 1 }),
    res,
  );
  assert.equal(result.status, 401);
});

test("checkout recalculates prices, replays the same order, and rejects key reuse with changed input", async () => {
  let stored: InstanceType<typeof Order> | null = null;
  mock.method(Order, "findOne", (() => select(stored)) as never);
  mock.method(Product, "find", (async () => [
    new Product({
      _id: productId,
      name: "Headphones",
      price: 1000,
      image: "https://example.com/product.jpg",
    }),
  ]) as never);
  const create = mock.method(Order, "create", (async (input: any) => {
    stored = new Order(input);
    return stored;
  }) as never);
  const key = randomUUID();
  const first = response();
  await createOrder(request(checkout(), key), first.res);
  assert.equal(first.result.status, 201);
  assert.equal(first.result.body.orderSummary.subtotal, 2000);
  assert.equal(first.result.body.idempotencyKey, undefined);
  assert.equal(first.result.body.requestFingerprint, undefined);
  const retry = response();
  await createOrder(request(checkout(), key), retry.res);
  assert.equal(retry.result.status, 200);
  assert.equal(String(retry.result.body._id), String(first.result.body._id));
  assert.equal(create.mock.callCount(), 1);
  const conflict = response();
  await createOrder(
    request(
      { ...checkout(), cartItems: [{ _id: productId, quantity: 3 }] },
      key,
    ),
    conflict.res,
  );
  assert.equal(conflict.result.status, 409);
  const noKey = response();
  await createOrder(request(checkout()), noKey.res);
  assert.equal(noKey.result.status, 400);
});

test("a concurrent unique-key loser returns the winning order", async () => {
  let calls = 0;
  let winner: InstanceType<typeof Order> | null = null;
  mock.method(Order, "findOne", (() =>
    select(++calls === 1 ? null : winner)) as never);
  mock.method(Product, "find", (async () => [
    new Product({
      _id: productId,
      name: "Headphones",
      price: 1000,
      image: "https://example.com/product.jpg",
    }),
  ]) as never);
  mock.method(Order, "create", (async (input: any) => {
    winner = new Order(input);
    throw Object.assign(new Error("duplicate key"), { code: 11000 });
  }) as never);
  const { result, res } = response();
  await createOrder(request(checkout(), randomUUID()), res);
  assert.equal(result.status, 200);
  assert.equal(String(result.body._id), String(winner!._id));
  assert.ok(
    Order.schema
      .indexes()
      .some(
        ([keys, options]) =>
          keys.idempotencyKey === 1 &&
          options.unique &&
          options.partialFilterExpression,
      ),
  );
});

test("only permitted lifecycle transitions succeed; stale writes fail", async () => {
  const statuses = [
    "pending",
    "processing",
    "shipped",
    "delivered",
    "cancelled",
  ];
  const permitted: Record<string, string[]> = {
    pending: ["processing", "cancelled"],
    processing: ["shipped", "cancelled"],
    shipped: ["delivered"],
    delivered: [],
    cancelled: [],
  };
  let current = "pending",
    stale = false;
  mock.method(
    Order,
    "findById",
    (async () => new Order({ _id: productId, status: current })) as never,
  );
  mock.method(Order, "findOneAndUpdate", (async (filter: any, update: any) => {
    assert.equal(filter.status, current);
    if (update.$set.status === "delivered")
      assert.ok(update.$set.deliveredAt instanceof Date);
    return stale
      ? null
      : new Order({ _id: productId, status: update.$set.status });
  }) as never);
  for (const from of statuses)
    for (const to of statuses) {
      current = from;
      const req = request({ status: to });
      req.params.id = productId;
      const { result, res } = response();
      await updateOrderStatus(req, res);
      assert.equal(
        result.status,
        from === to || permitted[from].includes(to) ? 200 : 409,
        from + " -> " + to,
      );
    }
  current = "pending";
  stale = true;
  const req = request({ status: "processing" });
  req.params.id = productId;
  const { result, res } = response();
  await updateOrderStatus(req, res);
  assert.equal(result.status, 409);
});

test("dashboard separates delivered sales from outstanding orders", async () => {
  const pipelines: any[] = [];
  mock.method(Order, "countDocuments", (async () => 2) as never);
  mock.method(User, "countDocuments", (async () => 1) as never);
  mock.method(Order, "find", (() => ({
    sort: () => ({ limit: async () => [] }),
  })) as never);
  mock.method(Order, "aggregate", (async (pipeline: any) => {
    pipelines.push(pipeline);
    const match = pipeline.find((stage: any) => stage.$match)?.$match;
    return pipeline[0].$addFields
      ? []
      : [{ total: match.status === "delivered" ? 2000 : 1000 }];
  }) as never);
  const { result, res } = response();
  await getDashboardstats(request(), res);
  assert.equal(result.status, 200);
  assert.equal(result.body.totalRevenue, 2000);
  assert.equal(result.body.outstandingOrderValue, 1000);
  assert.ok(
    pipelines.some(
      (p) => p[0].$addFields?.saleDate?.$ifNull[0] === "$deliveredAt",
    ),
  );
  assert.ok(
    pipelines
      .filter((p) => !p[0].$match?.status?.$in)
      .every(
        (p) => p.find((s: any) => s.$match)?.$match.status === "delivered",
      ),
  );
});

test("auth rate limits return JSON 429 and Retry-After", async () => {
  const app = express();
  app.use(express.json());
  app.post("/login", loginLimiter, (_req, res) =>
    res.status(401).json({ message: "Invalid credentials" }),
  );
  app.post("/register", registrationLimiter, (_req, res) =>
    res.status(400).json({ message: "Invalid registration" }),
  );
  const server = app.listen(0, "127.0.0.1");
  await new Promise<void>((resolve) => server.once("listening", resolve));
  const url = "http://127.0.0.1:" + (server.address() as AddressInfo).port;
  try {
    for (const [route, limit] of [
      ["login", 15],
      ["register", 5],
    ] as const) {
      for (let i = 0; i < limit; i++) {
        const response = await fetch(url + "/" + route, { method: "POST" });
        assert.notEqual(response.status, 429);
        await response.json();
      }
      const blocked = await fetch(url + "/" + route, { method: "POST" });
      assert.equal(blocked.status, 429);
      assert.ok(blocked.headers.get("retry-after"));
      assert.equal(typeof (await blocked.json()).message, "string");
    }
  } finally {
    await new Promise<void>((resolve, reject) =>
      server.close((error) => (error ? reject(error) : resolve())),
    );
  }
});
