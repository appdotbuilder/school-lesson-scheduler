
import { z } from 'zod';

// Lesson schema
export const lessonSchema = z.object({
  id: z.number(),
  subject: z.string(),
  teacher: z.string(),
  scheduled_time: z.coerce.date(),
  classroom: z.string(),
  duration_minutes: z.number().int().positive(),
  created_at: z.coerce.date()
});

export type Lesson = z.infer<typeof lessonSchema>;

// Input schema for creating lessons
export const createLessonInputSchema = z.object({
  subject: z.string().min(1, "Subject is required"),
  teacher: z.string().min(1, "Teacher is required"),
  scheduled_time: z.coerce.date(),
  classroom: z.string().min(1, "Classroom is required"),
  duration_minutes: z.number().int().positive().max(480) // Max 8 hours
});

export type CreateLessonInput = z.infer<typeof createLessonInputSchema>;

// Input schema for updating lessons
export const updateLessonInputSchema = z.object({
  id: z.number(),
  subject: z.string().min(1).optional(),
  teacher: z.string().min(1).optional(),
  scheduled_time: z.coerce.date().optional(),
  classroom: z.string().min(1).optional(),
  duration_minutes: z.number().int().positive().max(480).optional()
});

export type UpdateLessonInput = z.infer<typeof updateLessonInputSchema>;

// Query schema for filtering lessons
export const getLessonsQuerySchema = z.object({
  teacher: z.string().optional(),
  classroom: z.string().optional(),
  date: z.coerce.date().optional()
});

export type GetLessonsQuery = z.infer<typeof getLessonsQuerySchema>;
