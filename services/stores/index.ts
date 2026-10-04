import { createStore as createRedisStore } from "./redis";
import { createStore as createMemoryStore } from "./memory";

export function createStore(opts: { debug?: boolean }) {
  // NODE_ENV check keeps a leaked STORE_TYPE from disabling real persistence in a deployment.
  const isMemoryStoreEnabled = process.env.NODE_ENV !== "production" && process.env.STORE_TYPE === "memory";

  return isMemoryStoreEnabled ? createMemoryStore(opts) : createRedisStore(opts);
}
