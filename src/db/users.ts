import { eq } from 'drizzle-orm';
import { db } from './index.ts';
import { users } from './schema.ts';

export async function getOrCreateUser(uid: string, email: string) {
  try {
    const result = await db
      .insert(users)
      .values({
        uid,
        email: email || 'admin@local'
      })
      .onConflictDoUpdate({
        target: users.uid,
        set: {
          email: email || 'admin@local'
        }
      })
      .returning();

    return result[0];
  } catch (error) {
    console.error('Database user upsert failed:', error);
    throw new Error('Database query failed. Please try again later.', {
      cause: error
    });
  }
}

export async function getUserByUid(uid: string) {
  try {
    const rows = await db.select().from(users).where(eq(users.uid, uid)).limit(1);
    return rows[0] || null;
  } catch (error) {
    console.error('Database user lookup failed:', error);
    throw new Error('Database query failed. Please try again later.', {
      cause: error
    });
  }
}
