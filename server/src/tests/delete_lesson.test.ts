
import { afterEach, beforeEach, describe, expect, it } from 'bun:test';
import { resetDB, createDB } from '../helpers';
import { db } from '../db';
import { lessonsTable } from '../db/schema';
import { type CreateLessonInput } from '../schema';
import { deleteLesson } from '../handlers/delete_lesson';
import { eq } from 'drizzle-orm';

// Test lesson input
const testLessonInput: CreateLessonInput = {
  subject: 'Mathematics',
  teacher: 'John Smith',
  scheduled_time: new Date('2024-01-15T10:00:00Z'),
  classroom: 'Room 101',
  duration_minutes: 90
};

describe('deleteLesson', () => {
  beforeEach(createDB);
  afterEach(resetDB);

  it('should delete an existing lesson', async () => {
    // Create a lesson first
    const createdLesson = await db.insert(lessonsTable)
      .values(testLessonInput)
      .returning()
      .execute();

    const lessonId = createdLesson[0].id;

    // Delete the lesson
    const result = await deleteLesson(lessonId);

    expect(result).toBe(true);

    // Verify lesson is deleted from database
    const lessons = await db.select()
      .from(lessonsTable)
      .where(eq(lessonsTable.id, lessonId))
      .execute();

    expect(lessons).toHaveLength(0);
  });

  it('should return false when lesson does not exist', async () => {
    const nonExistentId = 999;

    const result = await deleteLesson(nonExistentId);

    expect(result).toBe(false);
  });

  it('should not affect other lessons when deleting one', async () => {
    // Create two lessons
    const lesson1 = await db.insert(lessonsTable)
      .values(testLessonInput)
      .returning()
      .execute();

    const lesson2Input = {
      ...testLessonInput,
      subject: 'Physics',
      teacher: 'Jane Doe'
    };

    const lesson2 = await db.insert(lessonsTable)
      .values(lesson2Input)
      .returning()
      .execute();

    // Delete first lesson
    const result = await deleteLesson(lesson1[0].id);

    expect(result).toBe(true);

    // Verify first lesson is deleted
    const deletedLesson = await db.select()
      .from(lessonsTable)
      .where(eq(lessonsTable.id, lesson1[0].id))
      .execute();

    expect(deletedLesson).toHaveLength(0);

    // Verify second lesson still exists
    const remainingLesson = await db.select()
      .from(lessonsTable)
      .where(eq(lessonsTable.id, lesson2[0].id))
      .execute();

    expect(remainingLesson).toHaveLength(1);
    expect(remainingLesson[0].subject).toEqual('Physics');
    expect(remainingLesson[0].teacher).toEqual('Jane Doe');
  });
});
