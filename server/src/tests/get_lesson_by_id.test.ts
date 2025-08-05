
import { afterEach, beforeEach, describe, expect, it } from 'bun:test';
import { resetDB, createDB } from '../helpers';
import { db } from '../db';
import { lessonsTable } from '../db/schema';
import { type CreateLessonInput } from '../schema';
import { getLessonById } from '../handlers/get_lesson_by_id';

// Test input for creating a lesson
const testInput: CreateLessonInput = {
  subject: 'Mathematics',
  teacher: 'Dr. Smith',
  scheduled_time: new Date('2024-01-15T09:00:00Z'),
  classroom: 'Room 101',
  duration_minutes: 90
};

describe('getLessonById', () => {
  beforeEach(createDB);
  afterEach(resetDB);

  it('should return a lesson when found', async () => {
    // Create a lesson first
    const created = await db.insert(lessonsTable)
      .values({
        subject: testInput.subject,
        teacher: testInput.teacher,
        scheduled_time: testInput.scheduled_time,
        classroom: testInput.classroom,
        duration_minutes: testInput.duration_minutes
      })
      .returning()
      .execute();

    const createdLesson = created[0];

    // Get the lesson by ID
    const result = await getLessonById(createdLesson.id);

    expect(result).not.toBeNull();
    expect(result!.id).toBe(createdLesson.id);
    expect(result!.subject).toBe('Mathematics');
    expect(result!.teacher).toBe('Dr. Smith');
    expect(result!.scheduled_time).toEqual(testInput.scheduled_time);
    expect(result!.classroom).toBe('Room 101');
    expect(result!.duration_minutes).toBe(90);
    expect(result!.created_at).toBeInstanceOf(Date);
  });

  it('should return null when lesson is not found', async () => {
    const result = await getLessonById(999);
    expect(result).toBeNull();
  });

  it('should handle database queries correctly', async () => {
    // Create multiple lessons
    const lesson1 = await db.insert(lessonsTable)
      .values({
        subject: 'Physics',
        teacher: 'Dr. Johnson',
        scheduled_time: new Date('2024-01-16T10:00:00Z'),
        classroom: 'Lab 1',
        duration_minutes: 120
      })
      .returning()
      .execute();

    const lesson2 = await db.insert(lessonsTable)
      .values({
        subject: 'Chemistry',
        teacher: 'Dr. Brown',
        scheduled_time: new Date('2024-01-17T14:00:00Z'),
        classroom: 'Lab 2',
        duration_minutes: 60
      })
      .returning()
      .execute();

    // Get specific lessons
    const result1 = await getLessonById(lesson1[0].id);
    const result2 = await getLessonById(lesson2[0].id);

    expect(result1!.subject).toBe('Physics');
    expect(result1!.teacher).toBe('Dr. Johnson');
    expect(result2!.subject).toBe('Chemistry');
    expect(result2!.teacher).toBe('Dr. Brown');

    // Ensure we get the correct lesson and not mix them up
    expect(result1!.id).toBe(lesson1[0].id);
    expect(result2!.id).toBe(lesson2[0].id);
    expect(result1!.id).not.toBe(result2!.id);
  });
});
