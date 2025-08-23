import { createClient, RedisClientType } from "redis";

export class CacheService {
  private client: RedisClientType;
  private static instance: CacheService;

  private constructor() {
    this.client = createClient({
      url: process.env.REDIS_URL || "redis://localhost:6379"
    });

    this.client.on("error", (err) => {
      console.error("❌ Redis error:", err);
    });
  }

  public static getInstance(): CacheService {
    if (!CacheService.instance) {
      CacheService.instance = new CacheService();
      CacheService.instance.client.connect().then(() => {
        console.log("✅ Connected to Redis");
      });
    }
    return CacheService.instance;
  }

  public async get<T>(key: string): Promise<T | null> {
    const data = await this.client.get(key);
    return data ? JSON.parse(data) : null;
  }

  public async set(key: string, value: any, ttlSeconds = 3600): Promise<void> {
    await this.client.set(key, JSON.stringify(value), {
      EX: ttlSeconds
    });
  }

  public async invalidate(pattern: string): Promise<void> {
    const keys = await this.client.keys(pattern);
    if (keys.length) {
      await this.client.del(keys);
    }
  }
}
