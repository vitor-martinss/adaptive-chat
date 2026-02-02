import postgres from "postgres";
import { drizzle } from "drizzle-orm/postgres-js";
import { userInteractions, chatSessions } from "./lib/db/schema";
import { desc, sql } from "drizzle-orm";
import * as dotenv from "dotenv";

dotenv.config({ path: ".env.local" });

async function checkInteractions() {
  const client = postgres(process.env.POSTGRES_URL!, { max: 1 });
  const db = drizzle(client);

  console.log("\n🔍 Verificando interações...\n");

  // Total de interações
  const [totalInteractions] = await db.select({ count: sql<number>`count(*)` }).from(userInteractions);
  console.log(`📊 Total de interações: ${totalInteractions.count}`);

  // Total de sessões
  const [totalSessions] = await db.select({ count: sql<number>`count(*)` }).from(chatSessions);
  console.log(`📊 Total de sessões: ${totalSessions.count}`);

  // Últimas 10 interações
  console.log("\n📝 Últimas 10 interações:");
  const recentInteractions = await db
    .select({
      id: userInteractions.id,
      sessionId: userInteractions.sessionId,
      type: userInteractions.interactionType,
      createdAt: userInteractions.createdAt,
    })
    .from(userInteractions)
    .orderBy(desc(userInteractions.createdAt))
    .limit(10);

  recentInteractions.forEach((interaction) => {
    console.log(`  - ${interaction.createdAt.toISOString()} | ${interaction.type} | Session: ${interaction.sessionId.substring(0, 8)}...`);
  });

  // Interações por tipo
  console.log("\n📈 Interações por tipo:");
  const interactionsByType = await db
    .select({
      type: userInteractions.interactionType,
      count: sql<number>`count(*)`,
    })
    .from(userInteractions)
    .groupBy(userInteractions.interactionType)
    .orderBy(desc(sql`count(*)`));

  interactionsByType.forEach((row) => {
    console.log(`  - ${row.type}: ${row.count}`);
  });

  // Últimas 5 sessões
  console.log("\n🔄 Últimas 5 sessões:");
  const recentSessions = await db
    .select({
      id: chatSessions.id,
      createdAt: chatSessions.createdAt,
      withMicro: chatSessions.withMicroInteractions,
      topic: chatSessions.topic,
    })
    .from(chatSessions)
    .orderBy(desc(chatSessions.createdAt))
    .limit(5);

  recentSessions.forEach((session) => {
    console.log(`  - ${session.createdAt.toISOString()} | Micro: ${session.withMicro} | Topic: ${session.topic || 'N/A'} | ID: ${session.id.substring(0, 8)}...`);
  });

  await client.end();
}

checkInteractions().catch(console.error);
