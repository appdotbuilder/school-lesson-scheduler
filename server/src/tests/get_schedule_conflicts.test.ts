
import { afterEach, beforeEach, describe, expect, it } from 'bun:test';
import { resetDB, createDB } from '../helpers';
import { db } from '../db';
import { lessonsTable } from '../db/schema';
import { type CreateLessonInput } from '../schema';
import { getScheduleConflicts } from '../handlers/get_schedule_conflicts';

describe('getScheduleConflicts', () => {
    beforeEach(createDB);
    afterEach(resetDB);

    const createTestLesson = async (lesson: CreateLessonInput) => {
        const result = await db.insert(lessonsTable)
            .values({
                subject: lesson.subject,
                teacher: lesson.teacher,
                scheduled_time: lesson.scheduled_time,
                classroom: lesson.classroom,
                duration_minutes: lesson.duration_minutes
            })
            .returning()
            .execute();
        return result[0];
    };

    it('should return empty array when no conflicts exist', async () => {
        // Create a lesson at 9:00 AM
        await createTestLesson({
            subject: 'Math',
            teacher: 'Teacher A',
            scheduled_time: new Date('2024-01-15T09:00:00Z'),
            classroom: 'Room 101',
            duration_minutes: 60
        });

        // Check for conflicts at 11:00 AM (no overlap)
        const conflicts = await getScheduleConflicts(
            'Room 101',
            new Date('2024-01-15T11:00:00Z'),
            60
        );

        expect(conflicts).toHaveLength(0);
    });

    it('should detect exact time overlap conflict', async () => {
        const existingLesson = await createTestLesson({
            subject: 'Math',
            teacher: 'Teacher A',
            scheduled_time: new Date('2024-01-15T09:00:00Z'),
            classroom: 'Room 101',
            duration_minutes: 60
        });

        // Check for conflicts at the exact same time
        const conflicts = await getScheduleConflicts(
            'Room 101',
            new Date('2024-01-15T09:00:00Z'),
            60
        );

        expect(conflicts).toHaveLength(1);
        expect(conflicts[0].id).toEqual(existingLesson.id);
        expect(conflicts[0].subject).toEqual('Math');
    });

    it('should detect partial overlap conflicts', async () => {
        // Create lesson from 9:00-10:00 AM
        const existingLesson = await createTestLesson({
            subject: 'Math',
            teacher: 'Teacher A',
            scheduled_time: new Date('2024-01-15T09:00:00Z'),
            classroom: 'Room 101',
            duration_minutes: 60
        });

        // Check for conflicts from 9:30-10:30 AM (30 minutes overlap)
        const conflicts = await getScheduleConflicts(
            'Room 101',
            new Date('2024-01-15T09:30:00Z'),
            60
        );

        expect(conflicts).toHaveLength(1);
        expect(conflicts[0].id).toEqual(existingLesson.id);
    });

    it('should detect when new lesson completely contains existing lesson', async () => {
        // Create short lesson from 9:30-10:00 AM
        const existingLesson = await createTestLesson({
            subject: 'Math',
            teacher: 'Teacher A',
            scheduled_time: new Date('2024-01-15T09:30:00Z'),
            classroom: 'Room 101',
            duration_minutes: 30
        });

        // Check for conflicts from 9:00-11:00 AM (completely contains existing)
        const conflicts = await getScheduleConflicts(
            'Room 101',
            new Date('2024-01-15T09:00:00Z'),
            120
        );

        expect(conflicts).toHaveLength(1);
        expect(conflicts[0].id).toEqual(existingLesson.id);
    });

    it('should only return conflicts for the specified classroom', async () => {
        // Create lessons in different classrooms at the same time
        await createTestLesson({
            subject: 'Math',
            teacher: 'Teacher A',
            scheduled_time: new Date('2024-01-15T09:00:00Z'),
            classroom: 'Room 101',
            duration_minutes: 60
        });

        await createTestLesson({
            subject: 'Science',
            teacher: 'Teacher B',
            scheduled_time: new Date('2024-01-15T09:00:00Z'),
            classroom: 'Room 102',
            duration_minutes: 60
        });

        // Check for conflicts in Room 102 only
        const conflicts = await getScheduleConflicts(
            'Room 102',
            new Date('2024-01-15T09:00:00Z'),
            60
        );

        expect(conflicts).toHaveLength(1);
        expect(conflicts[0].classroom).toEqual('Room 102');
        expect(conflicts[0].subject).toEqual('Science');
    });

    it('should exclude specified lesson when updating', async () => {
        const existingLesson = await createTestLesson({
            subject: 'Math',
            teacher: 'Teacher A',
            scheduled_time: new Date('2024-01-15T09:00:00Z'),
            classroom: 'Room 101',
            duration_minutes: 60
        });

        // Check for conflicts excluding the existing lesson (simulating update)
        const conflicts = await getScheduleConflicts(
            'Room 101',
            new Date('2024-01-15T09:00:00Z'),
            60,
            existingLesson.id
        );

        expect(conflicts).toHaveLength(0);
    });

    it('should handle multiple overlapping lessons', async () => {
        // Create multiple overlapping lessons
        const lesson1 = await createTestLesson({
            subject: 'Math',
            teacher: 'Teacher A',
            scheduled_time: new Date('2024-01-15T09:00:00Z'),
            classroom: 'Room 101',
            duration_minutes: 90 // 9:00-10:30
        });

        const lesson2 = await createTestLesson({
            subject: 'Science',
            teacher: 'Teacher B',
            scheduled_time: new Date('2024-01-15T10:00:00Z'),
            classroom: 'Room 101',
            duration_minutes: 60 // 10:00-11:00
        });

        // Check for conflicts from 9:30-10:45 (overlaps with both)
        const conflicts = await getScheduleConflicts(
            'Room 101',
            new Date('2024-01-15T09:30:00Z'),
            75
        );

        expect(conflicts).toHaveLength(2);
        const conflictIds = conflicts.map(c => c.id).sort();
        expect(conflictIds).toEqual([lesson1.id, lesson2.id].sort());
    });

    it('should handle edge case where lessons just touch but do not overlap', async () => {
        // Create lesson from 9:00-10:00 AM
        await createTestLesson({
            subject: 'Math',
            teacher: 'Teacher A',
            scheduled_time: new Date('2024-01-15T09:00:00Z'),
            classroom: 'Room 101',
            duration_minutes: 60
        });

        // Check for conflicts from 10:00-11:00 AM (starts exactly when first ends)
        const conflicts = await getScheduleConflicts(
            'Room 101',
            new Date('2024-01-15T10:00:00Z'),
            60
        );

        expect(conflicts).toHaveLength(0);
    });
});
