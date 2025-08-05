
import { db } from '../db';
import { lessonsTable } from '../db/schema';
import { type Lesson } from '../schema';
import { eq, and, lte, gte, ne, SQL } from 'drizzle-orm';

export const getScheduleConflicts = async (
    classroom: string,
    scheduledTime: Date,
    durationMinutes: number,
    excludeLessonId?: number
): Promise<Lesson[]> => {
    try {
        // Calculate end time for the proposed lesson
        const proposedEndTime = new Date(scheduledTime.getTime() + durationMinutes * 60000);

        // Build the base query
        let query = db.select().from(lessonsTable);

        // Build conditions array
        const conditions: SQL<unknown>[] = [];

        // Filter by classroom
        conditions.push(eq(lessonsTable.classroom, classroom));

        // Check for time overlap - lessons conflict if:
        // 1. Existing lesson starts before proposed lesson ends AND
        // 2. Existing lesson ends after proposed lesson starts
        // We'll use a broad time filter and then do precise checking in JavaScript
        const dayBefore = new Date(scheduledTime.getTime() - 24 * 60 * 60 * 1000);
        const dayAfter = new Date(proposedEndTime.getTime() + 24 * 60 * 60 * 1000);
        
        const timeRangeCondition = and(
            gte(lessonsTable.scheduled_time, dayBefore),
            lte(lessonsTable.scheduled_time, dayAfter)
        );
        
        if (timeRangeCondition) {
            conditions.push(timeRangeCondition);
        }

        // Exclude the lesson being updated (if specified)
        if (excludeLessonId !== undefined) {
            conditions.push(ne(lessonsTable.id, excludeLessonId));
        }

        // Apply conditions - avoid type issues by not reassigning query
        const finalQuery = conditions.length > 0 
            ? query.where(conditions.length === 1 ? conditions[0] : and(...conditions))
            : query;

        const results = await finalQuery.execute();

        // Filter results in JavaScript for precise time overlap checking
        const conflicts = results.filter(lesson => {
            const lessonEndTime = new Date(lesson.scheduled_time.getTime() + lesson.duration_minutes * 60000);
            
            // Check if times overlap:
            // Lesson conflicts if it starts before proposed lesson ends AND ends after proposed lesson starts
            return lesson.scheduled_time < proposedEndTime && lessonEndTime > scheduledTime;
        });

        return conflicts;
    } catch (error) {
        console.error('Schedule conflict check failed:', error);
        throw error;
    }
};
