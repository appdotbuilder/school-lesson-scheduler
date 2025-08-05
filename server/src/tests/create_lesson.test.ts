
import { afterEach, beforeEach, describe, expect, it } from 'bun:test';
import { resetDB, createDB } from '../helpers';
import { db } from '../db';
import { lessonsTable } from '../db/schema';
import { type CreateLessonInput } from '../schema';
import { createLesson } from '../handlers/create_lesson';
import { eq } from 'drizzle-orm';

const testInput: CreateLessonInput = {
  subject: 'Mathematics',
  teacher: 'John Smith',
  scheduled_time: new Date('2024-03-15T10:00:00Z'),
  classroom: 'Room 101',
  duration_minutes: 60
};

describe('createLesson', () => {
  beforeEach(createDB);
  afterEach(resetDB);

  it('should create a lesson', async () => {
    const result = await createLesson(testInput);

    expect(result.subject).toEqual('Mathematics');
    expect(result.teacher).toEqual('John Smith');
    expect(result.scheduled_time).toEqual(testInput.scheduled_time);
    expect(result.classroom).toEqual('Room 101');
    expect(result.duration_minutes).toEqual(60);
    expect(result.id).toBeDefined();
    expect(result.created_at).toBeInstanceOf(Date);
  });

  it('should save lesson to database', async () => {
    const result = await createLesson(testInput);

    const lessons = await db.select()
      .from(lessonsTable)
      .where(eq(lessonsTable.id, result.id))
      .execute();

    expect(lessons).toHaveLength(1);
    expect(lessons[0].subject).toEqual('Mathematics');
    expect(lessons[0].teacher).toEqual('John Smith');
    expect(lessons[0].scheduled_time).toEqual(testInput.scheduled_time);
    expect(lessons[0].classroom).toEqual('Room 101');
    expect(lessons[0].duration_minutes).toEqual(60);
    expect(lessons[0].created_at).toBeInstanceOf(Date);
  });

  it('should prevent double booking of classroom', async () => {
    // Create first lesson
    await createLesson(testInput);

    // Try to create overlapping lesson in same classroom
    const overlappingInput: CreateLessonInput = {
      subject: 'Physics',
      teacher: 'Jane Doe',
      scheduled_time: new Date('2024-03-15T10:30:00Z'), // 30 minutes overlap
      classroom: 'Room 101',
      duration_minutes: 90
    };

    await expect(createLesson(overlappingInput)).rejects.toThrow(/Room 101 is already booked/);
  });

  it('should allow lessons in same classroom at different times', async () => {
    // Create first lesson
    await createLesson(testInput);

    // Create lesson in same classroom but different time (no overlap)
    const nonOverlappingInput: CreateLessonInput = {
      subject: 'Physics',
      teacher: 'Jane Doe',
      scheduled_time: new Date('2024-03-15T12:00:00Z'), // 2 hours later
      classroom: 'Room 101',
      duration_minutes: 60
    };

    const result = await createLesson(nonOverlappingInput);

    expect(result.subject).toEqual('Physics');
    expect(result.classroom).toEqual('Room 101');
    expect(result.scheduled_time).toEqual(nonOverlappingInput.scheduled_time);
  });

  it('should allow lessons in different classrooms at same time', async () => {
    // Create first lesson
    await createLesson(testInput);

    // Create lesson in different classroom at same time
    const differentClassroomInput: CreateLessonInput = {
      subject: 'Physics',
      teacher: 'Jane Doe',
      scheduled_time: new Date('2024-03-15T10:00:00Z'), // Same time
      classroom: 'Room 102', // Different classroom
      duration_minutes: 60
    };

    const result = await createLesson(differentClassroomInput);

    expect(result.subject).toEqual('Physics');
    expect(result.classroom).toEqual('Room 102');
    expect(result.scheduled_time).toEqual(differentClassroomInput.scheduled_time);
  });

  it('should detect exact time conflict', async () => {
    // Create first lesson
    await createLesson(testInput);

    // Try to create lesson at exact same time and classroom
    const exactConflict: CreateLessonInput = {
      subject: 'Chemistry',
      teacher: 'Bob Wilson',
      scheduled_time: new Date('2024-03-15T10:00:00Z'), // Exact same time
      classroom: 'Room 101',
      duration_minutes: 30
    };

    await expect(createLesson(exactConflict)).rejects.toThrow(/Room 101 is already booked/);
  });

  it('should detect partial overlap at lesson end', async () => {
    // Create first lesson (10:00 - 11:00)
    await createLesson(testInput);

    // Try to create lesson that starts during first lesson
    const partialOverlap: CreateLessonInput = {
      subject: 'History',
      teacher: 'Alice Brown',
      scheduled_time: new Date('2024-03-15T10:45:00Z'), // Starts 45 minutes into first lesson
      classroom: 'Room 101',
      duration_minutes: 60
    };

    await expect(createLesson(partialOverlap)).rejects.toThrow(/Room 101 is already booked/);
  });
});
