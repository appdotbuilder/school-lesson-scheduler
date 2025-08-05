
import { db } from '../db';
import { lessonsTable } from '../db/schema';
import { type GetLessonsQuery, type Lesson } from '../schema';
import { eq, and, gte, lt, asc, type SQL } from 'drizzle-orm';

export const getLessons = async (query?: GetLessonsQuery): Promise<Lesson[]> => {
  try {
    // Build conditions array for filtering
    const conditions: SQL<unknown>[] = [];

    if (query?.teacher) {
      conditions.push(eq(lessonsTable.teacher, query.teacher));
    }

    if (query?.classroom) {
      conditions.push(eq(lessonsTable.classroom, query.classroom));
    }

    if (query?.date) {
      // Filter for lessons on the specific date (start of day to start of next day)
      const startOfDay = new Date(query.date);
      startOfDay.setHours(0, 0, 0, 0);
      
      const startOfNextDay = new Date(startOfDay);
      startOfNextDay.setDate(startOfNextDay.getDate() + 1);

      conditions.push(gte(lessonsTable.scheduled_time, startOfDay));
      conditions.push(lt(lessonsTable.scheduled_time, startOfNextDay));
    }

    // Build and execute query in one chain
    const results = await db.select()
      .from(lessonsTable)
      .where(conditions.length === 0 ? undefined : (conditions.length === 1 ? conditions[0] : and(...conditions)))
      .orderBy(asc(lessonsTable.scheduled_time))
      .execute();

    return results;
  } catch (error) {
    console.error('Failed to fetch lessons:', error);
    throw error;
  }
};
