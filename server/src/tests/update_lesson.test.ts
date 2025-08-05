
import { afterEach, beforeEach, describe, expect, it } from 'bun:test';
import { resetDB, createDB } from '../helpers';
import { db } from '../db';
import { lessonsTable } from '../db/schema';
import { type UpdateLessonInput, type CreateLessonInput } from '../schema';
import { updateLesson } from '../handlers/update_lesson';
import { eq } from 'drizzle-orm';

const createTestLesson = async (overrides: Partial<CreateLessonInput> = {}): Promise<number> => {
  const defaultLesson: CreateLessonInput = {
    subject: 'Mathematics',
    teacher: 'John Doe',
    scheduled_time: new Date('2024-01-15T09:00:00Z'),
    classroom: 'A101',
    duration_minutes: 60
  };

  const result = await db.insert(lessonsTable)
    .values({ ...defaultLesson, ...overrides })
    .returning()
    .execute();

  return result[0].id;
};

describe('updateLesson', () => {
  beforeEach(createDB);
  afterEach(resetDB);

  it('should update a lesson successfully', async () => {
    const lessonId = await createTestLesson();

    const updateInput: UpdateLessonInput = {
      id: lessonId,
      subject: 'Advanced Mathematics',
      teacher: 'Jane Smith',
      duration_minutes: 90
    };

    const result = await updateLesson(updateInput);

    expect(result).not.toBeNull();
    expect(result!.id).toEqual(lessonId);
    expect(result!.subject).toEqual('Advanced Mathematics');
    expect(result!.teacher).toEqual('Jane Smith');
    expect(result!.duration_minutes).toEqual(90);
    expect(result!.classroom).toEqual('A101'); // Should remain unchanged
    expect(result!.created_at).toBeInstanceOf(Date);
  });

  it('should return null for non-existent lesson', async () => {
    const updateInput: UpdateLessonInput = {
      id: 999,
      subject: 'Non-existent lesson'
    };

    const result = await updateLesson(updateInput);

    expect(result).toBeNull();
  });

  it('should update only specified fields', async () => {
    const lessonId = await createTestLesson();

    const updateInput: UpdateLessonInput = {
      id: lessonId,
      subject: 'Updated Subject'
    };

    const result = await updateLesson(updateInput);

    expect(result).not.toBeNull();
    expect(result!.subject).toEqual('Updated Subject');
    expect(result!.teacher).toEqual('John Doe'); // Should remain unchanged
    expect(result!.classroom).toEqual('A101'); // Should remain unchanged
    expect(result!.duration_minutes).toEqual(60); // Should remain unchanged
  });

  it('should save updates to database', async () => {
    const lessonId = await createTestLesson();

    const updateInput: UpdateLessonInput = {
      id: lessonId,
      subject: 'Database Test Subject',
      classroom: 'B202'
    };

    await updateLesson(updateInput);

    const lessons = await db.select()
      .from(lessonsTable)
      .where(eq(lessonsTable.id, lessonId))
      .execute();

    expect(lessons).toHaveLength(1);
    expect(lessons[0].subject).toEqual('Database Test Subject');
    expect(lessons[0].classroom).toEqual('B202');
  });

  it('should prevent double-booking when updating classroom', async () => {
    // Create first lesson: 9:00-10:00 in A101
    const lesson1Id = await createTestLesson({
      classroom: 'A101',
      scheduled_time: new Date('2024-01-15T09:00:00Z'),
      duration_minutes: 60
    });

    // Create second lesson: 9:30-10:30 in B202
    const lesson2Id = await createTestLesson({
      classroom: 'B202',
      scheduled_time: new Date('2024-01-15T09:30:00Z'),
      duration_minutes: 60
    });

    // Try to update second lesson to use same classroom A101 (would overlap 9:30-10:00)
    const updateInput: UpdateLessonInput = {
      id: lesson2Id,
      classroom: 'A101'
    };

    await expect(updateLesson(updateInput)).rejects.toThrow(/classroom.*already booked/i);
  });

  it('should prevent double-booking when updating scheduled_time', async () => {
    // Create first lesson: 9:00-10:00 in A101
    const lesson1Id = await createTestLesson({
      classroom: 'A101',
      scheduled_time: new Date('2024-01-15T09:00:00Z'),
      duration_minutes: 60
    });

    // Create second lesson: 11:00-12:00 in A101
    const lesson2Id = await createTestLesson({
      classroom: 'A101',
      scheduled_time: new Date('2024-01-15T11:00:00Z'),
      duration_minutes: 60
    });

    // Try to update second lesson to overlap with first lesson (9:30-10:30 overlaps 9:00-10:00)
    const updateInput: UpdateLessonInput = {
      id: lesson2Id,
      scheduled_time: new Date('2024-01-15T09:30:00Z')
    };

    await expect(updateLesson(updateInput)).rejects.toThrow(/classroom.*already booked/i);
  });

  it('should allow updating to non-conflicting time slot', async () => {
    // Create first lesson: 9:00-10:00 in A101
    const lesson1Id = await createTestLesson({
      classroom: 'A101',
      scheduled_time: new Date('2024-01-15T09:00:00Z'),
      duration_minutes: 60
    });

    // Create second lesson: 11:00-12:00 in A101
    const lesson2Id = await createTestLesson({
      classroom: 'A101',
      scheduled_time: new Date('2024-01-15T11:00:00Z'),
      duration_minutes: 60
    });

    // Update second lesson to a non-conflicting time (13:00-14:00)
    const updateInput: UpdateLessonInput = {
      id: lesson2Id,
      scheduled_time: new Date('2024-01-15T13:00:00Z')
    };

    const result = await updateLesson(updateInput);

    expect(result).not.toBeNull();
    expect(result!.scheduled_time).toEqual(new Date('2024-01-15T13:00:00Z'));
  });

  it('should handle updating duration_minutes affecting overlap', async () => {
    // Create first lesson: 9:00-10:00 in A101
    const lesson1Id = await createTestLesson({
      classroom: 'A101',
      scheduled_time: new Date('2024-01-15T09:00:00Z'),
      duration_minutes: 60
    });

    // Create second lesson: 10:15-11:15 in A101 (15 minute gap)
    const lesson2Id = await createTestLesson({
      classroom: 'A101',
      scheduled_time: new Date('2024-01-15T10:15:00Z'),
      duration_minutes: 60
    });

    // Try to extend first lesson duration to overlap with second (9:00-10:30 overlaps 10:15-11:15)
    const updateInput: UpdateLessonInput = {
      id: lesson1Id,
      duration_minutes: 90 // Would end at 10:30, overlapping with lesson2 at 10:15
    };

    await expect(updateLesson(updateInput)).rejects.toThrow(/classroom.*already booked/i);
  });
});
