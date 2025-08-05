
import { db } from '../db';
import { lessonsTable } from '../db/schema';
import { eq } from 'drizzle-orm';

export const deleteLesson = async (id: number): Promise<boolean> => {
  try {
    const result = await db.delete(lessonsTable)
      .where(eq(lessonsTable.id, id))
      .returning()
      .execute();

    // Return true if a lesson was deleted, false if no lesson found
    return result.length > 0;
  } catch (error) {
    console.error('Lesson deletion failed:', error);
    throw error;
  }
};
