
import { afterEach, beforeEach, describe, expect, it } from 'bun:test';
import { resetDB, createDB } from '../helpers';
import { db } from '../db';
import { lessonsTable } from '../db/schema';
import { type CreateLessonInput, type GetLessonsQuery } from '../schema';
import { getLessons } from '../handlers/get_lessons';

// Test lesson data
const testLesson1: CreateLessonInput = {
  subject: 'Mathematics',
  teacher: 'John Smith',
  scheduled_time: new Date('2024-01-15T09:00:00Z'),
  classroom: 'Room 101',
  duration_minutes: 60
};

const testLesson2: CreateLessonInput = {
  subject: 'Physics',
  teacher: 'Jane Doe',
  scheduled_time: new Date('2024-01-15T10:30:00Z'),
  classroom: 'Room 102',
  duration_minutes: 90
};

const testLesson3: CreateLessonInput = {
  subject: 'Chemistry',
  teacher: 'John Smith',
  scheduled_time: new Date('2024-01-16T14:00:00Z'),
  classroom: 'Room 101',
  duration_minutes: 45
};

describe('getLessons', () => {
  beforeEach(createDB);
  afterEach(resetDB);

  it('should return all lessons when no query provided', async () => {
    // Create test lessons
    await db.insert(lessonsTable).values([testLesson1, testLesson2, testLesson3]).execute();

    const result = await getLessons();

    expect(result).toHaveLength(3);
    expect(result[0].subject).toEqual('Mathematics');
    expect(result[1].subject).toEqual('Physics');
    expect(result[2].subject).toEqual('Chemistry');
  });

  it('should return lessons ordered by scheduled_time ascending', async () => {
    // Insert lessons in different order
    await db.insert(lessonsTable).values([testLesson3, testLesson1, testLesson2]).execute();

    const result = await getLessons();

    expect(result).toHaveLength(3);
    // Should be ordered by scheduled_time
    expect(result[0].scheduled_time).toEqual(testLesson1.scheduled_time);
    expect(result[1].scheduled_time).toEqual(testLesson2.scheduled_time);
    expect(result[2].scheduled_time).toEqual(testLesson3.scheduled_time);
  });

  it('should filter lessons by teacher', async () => {
    await db.insert(lessonsTable).values([testLesson1, testLesson2, testLesson3]).execute();

    const query: GetLessonsQuery = { teacher: 'John Smith' };
    const result = await getLessons(query);

    expect(result).toHaveLength(2);
    expect(result[0].teacher).toEqual('John Smith');
    expect(result[1].teacher).toEqual('John Smith');
    expect(result[0].subject).toEqual('Mathematics');
    expect(result[1].subject).toEqual('Chemistry');
  });

  it('should filter lessons by classroom', async () => {
    await db.insert(lessonsTable).values([testLesson1, testLesson2, testLesson3]).execute();

    const query: GetLessonsQuery = { classroom: 'Room 101' };
    const result = await getLessons(query);

    expect(result).toHaveLength(2);
    expect(result[0].classroom).toEqual('Room 101');
    expect(result[1].classroom).toEqual('Room 101');
    expect(result[0].subject).toEqual('Mathematics');
    expect(result[1].subject).toEqual('Chemistry');
  });

  it('should filter lessons by date', async () => {
    await db.insert(lessonsTable).values([testLesson1, testLesson2, testLesson3]).execute();

    const query: GetLessonsQuery = { date: new Date('2024-01-15') };
    const result = await getLessons(query);

    expect(result).toHaveLength(2);
    expect(result[0].subject).toEqual('Mathematics');
    expect(result[1].subject).toEqual('Physics');
    
    // Verify both lessons are on the same date
    const lesson1Date = new Date(result[0].scheduled_time);
    const lesson2Date = new Date(result[1].scheduled_time);
    expect(lesson1Date.toDateString()).toEqual(new Date('2024-01-15').toDateString());
    expect(lesson2Date.toDateString()).toEqual(new Date('2024-01-15').toDateString());
  });

  it('should filter by multiple criteria', async () => {
    await db.insert(lessonsTable).values([testLesson1, testLesson2, testLesson3]).execute();

    const query: GetLessonsQuery = { 
      teacher: 'John Smith',
      classroom: 'Room 101'
    };
    const result = await getLessons(query);

    expect(result).toHaveLength(2);
    expect(result[0].teacher).toEqual('John Smith');
    expect(result[0].classroom).toEqual('Room 101');
    expect(result[1].teacher).toEqual('John Smith');
    expect(result[1].classroom).toEqual('Room 101');
  });

  it('should return empty array when no lessons match filters', async () => {
    await db.insert(lessonsTable).values([testLesson1, testLesson2]).execute();

    const query: GetLessonsQuery = { teacher: 'Nonexistent Teacher' };
    const result = await getLessons(query);

    expect(result).toHaveLength(0);
  });

  it('should return empty array when no lessons exist', async () => {
    const result = await getLessons();

    expect(result).toHaveLength(0);
  });
});
