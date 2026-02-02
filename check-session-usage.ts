import postgres from "postgres";
import { drizzle } from "drizzle-orm/postgres-js";
import { userInteractions } from "./lib/db/schema";
import { desc, sql } from "drizzle-orm";
import * as dotenv from "dotenv";

dotenv.config({ path: ".env.local" });

async function checkSessionUsage() {
  const client = postgres(process.env.POSTGRES_URL!, { max: 1 });
  const db = drizzle(client);

  // Verificar sessão mais usada
  const result = await db.select({
    sessionId: userInteractions.sessionId,
    count: sql<number>`count(*)`,
    lastInteraction: sql<Date>`max(${userInteractions.createdAt})`,
  })
  .from(userInteractions)
  .groupBy(userInteractions.sessionId)
  .orderBy(desc(sql`count(*)`))
  .limit(5);

  console.log('\n📊 Sessões com mais interações:\n');
  result.forEach(r => {
    console.log(`  Session: ${r.sessionId.substring(0, 12)}... | Interações: ${r.count} | Última: ${r.lastInteraction}`);
  });

  await client.end();
}

checkSessionUsage().catch(console.error);
