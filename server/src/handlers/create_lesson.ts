
import { db } from '../db';
import { lessonsTable } from '../db/schema';
import { type CreateLessonInput, type Lesson } from '../schema';
import { and, eq, gte, lte } from 'drizzle-orm';

export const createLesson = async (input: CreateLessonInput): Promise<Lesson> => {
  try {
    // Calculate the end time of the new lesson
    const newLessonStart = input.scheduled_time;
    const newLessonEnd = new Date(newLessonStart.getTime() + input.duration_minutes * 60 * 1000);

    // Check for classroom conflicts
    const existingLessons = await db.select()
      .from(lessonsTable)
      .where(eq(lessonsTable.classroom, input.classroom))
      .execute();

    // Check if any existing lesson conflicts with the new lesson
    for (const lesson of existingLessons) {
      const existingStart = lesson.scheduled_time;
      const existingEnd = new Date(existingStart.getTime() + lesson.duration_minutes * 60 * 1000);

      // Check for time overlap
      if (newLessonStart < existingEnd && newLessonEnd > existingStart) {
        throw new Error(`Classroom ${input.classroom} is already booked from ${existingStart.toISOString()} to ${existingEnd.toISOString()}`);
      }
    }

    // Insert the new lesson
    const result = await db.insert(lessonsTable)
      .values({
        subject: input.subject,
        teacher: input.teacher,
        scheduled_time: input.scheduled_time,
        classroom: input.classroom,
        duration_minutes: input.duration_minutes
      })
      .returning()
      .execute();

    return result[0];
  } catch (error) {
    console.error('Lesson creation failed:', error);
    throw error;
  }
};
