import postgres from "postgres";
import { drizzle } from "drizzle-orm/postgres-js";
import * as schema from "./schema";

let _db: ReturnType<typeof drizzle<typeof schema>> | null = null;
let _sql: ReturnType<typeof postgres> | null = null;

function getDb() {
  if (!_db) {
    _sql = postgres(process.env.DATABASE_URL!, { prepare: false });
    _db = drizzle(_sql, { schema });
  }
  return _db;
}

// Lazy proxy — doesn't connect until first query
export const db = new Proxy({} as ReturnType<typeof drizzle<typeof schema>>, {
  get(_target, prop) {
    return (getDb() as unknown as Record<string | symbol, unknown>)[prop];
  },
});

export * from "./schema";
