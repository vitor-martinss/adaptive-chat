import { drizzle } from "drizzle-orm/postgres-js";
import postgres from "postgres";

const client = postgres(process.env.POSTGRES_URL!);
const db = drizzle(client);

export async function withTransaction<T>(
  callback: (tx: Parameters<typeof db.transaction>[0] extends (tx: infer TX) => unknown ? TX : never) => Promise<T>
): Promise<T> {
  return await db.transaction(callback);
}

export { db };