import "server-only";
import { drizzle } from "drizzle-orm/postgres-js";
import postgres from "postgres";
import { eq } from "drizzle-orm";
import { user } from "./schema";
import { generateHashedPassword } from "./utils";
import { generateUUID } from "../utils";

const client = postgres(process.env.POSTGRES_URL!);
const db = drizzle(client);

export async function getUser(email: string) {
  return await db.select().from(user).where(eq(user.email, email));
}

export async function createUser(email: string, password: string) {
  const hashedPassword = generateHashedPassword(password);
  return await db.insert(user).values({ email, password: hashedPassword });
}

export async function createGuestUser() {
  const email = `guest-${Date.now()}`;
  const password = generateHashedPassword(generateUUID());
  return await db.insert(user).values({ email, password }).returning({
    id: user.id,
    email: user.email,
  });
}
