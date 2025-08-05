
import { db } from '../db';
import { lessonsTable } from '../db/schema';
import { type Lesson } from '../schema';
import { eq } from 'drizzle-orm';

export const getLessonById = async (id: number): Promise<Lesson | null> => {
  try {
    const result = await db.select()
      .from(lessonsTable)
      .where(eq(lessonsTable.id, id))
      .execute();

    if (result.length === 0) {
      return null;
    }

    const lesson = result[0];
    return lesson;
  } catch (error) {
    console.error('Get lesson by ID failed:', error);
    throw error;
  }
};
