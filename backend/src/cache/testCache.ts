// backend/src/cache/testCache.ts
import { CacheService } from "./redis";

async function testCache() {
  const cache = CacheService.getInstance();
  await cache.set("test:key", { foo: "bar" }, 10);
  const result = await cache.get<{ foo: string }>("test:key");
  console.log("Cache get:", result);
  await cache.invalidate("test:*");
  console.log("Cache invalidated");
  process.exit(0);
}

testCache();
