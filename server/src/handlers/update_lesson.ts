
import { db } from '../db';
import { lessonsTable } from '../db/schema';
import { type UpdateLessonInput, type Lesson } from '../schema';
import { eq, and, ne } from 'drizzle-orm';

export const updateLesson = async (input: UpdateLessonInput): Promise<Lesson | null> => {
  try {
    // First check if the lesson exists
    const existingLesson = await db.select()
      .from(lessonsTable)
      .where(eq(lessonsTable.id, input.id))
      .execute();

    if (existingLesson.length === 0) {
      return null;
    }

    // Check for classroom double-booking if scheduled_time, classroom, or duration is being updated
    if (input.scheduled_time !== undefined || input.classroom !== undefined || input.duration_minutes !== undefined) {
      const scheduledTime = input.scheduled_time !== undefined ? input.scheduled_time : existingLesson[0].scheduled_time;
      const classroom = input.classroom !== undefined ? input.classroom : existingLesson[0].classroom;
      const durationMinutes = input.duration_minutes !== undefined ? input.duration_minutes : existingLesson[0].duration_minutes;

      // Calculate end time for the lesson
      const startTime = new Date(scheduledTime);
      const endTime = new Date(startTime.getTime() + durationMinutes * 60000);

      // Check for overlapping lessons in the same classroom
      const conflictingLessons = await db.select()
        .from(lessonsTable)
        .where(
          and(
            eq(lessonsTable.classroom, classroom),
            ne(lessonsTable.id, input.id) // Exclude the current lesson
          )
        )
        .execute();

      // Check for time conflicts
      for (const lesson of conflictingLessons) {
        const lessonStart = new Date(lesson.scheduled_time);
        const lessonEnd = new Date(lessonStart.getTime() + lesson.duration_minutes * 60000);

        // Check if there's overlap (start before other ends AND end after other starts)
        if (startTime < lessonEnd && endTime > lessonStart) {
          throw new Error(`Classroom ${classroom} is already booked during this time`);
        }
      }
    }

    // Build update object with only defined fields
    const updateData: Partial<typeof lessonsTable.$inferInsert> = {};
    if (input.subject !== undefined) updateData.subject = input.subject;
    if (input.teacher !== undefined) updateData.teacher = input.teacher;
    if (input.scheduled_time !== undefined) updateData.scheduled_time = input.scheduled_time;
    if (input.classroom !== undefined) updateData.classroom = input.classroom;
    if (input.duration_minutes !== undefined) updateData.duration_minutes = input.duration_minutes;

    // Update the lesson
    const result = await db.update(lessonsTable)
      .set(updateData)
      .where(eq(lessonsTable.id, input.id))
      .returning()
      .execute();

    return result[0];
  } catch (error) {
    console.error('Lesson update failed:', error);
    throw error;
  }
};
