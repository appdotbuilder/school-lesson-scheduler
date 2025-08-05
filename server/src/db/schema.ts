
import { serial, text, pgTable, timestamp, integer } from 'drizzle-orm/pg-core';

export const lessonsTable = pgTable('lessons', {
  id: serial('id').primaryKey(),
  subject: text('subject').notNull(),
  teacher: text('teacher').notNull(),
  scheduled_time: timestamp('scheduled_time').notNull(),
  classroom: text('classroom').notNull(),
  duration_minutes: integer('duration_minutes').notNull(),
  created_at: timestamp('created_at').defaultNow().notNull(),
});

// TypeScript type for the table schema
export type Lesson = typeof lessonsTable.$inferSelect; // For SELECT operations
export type NewLesson = typeof lessonsTable.$inferInsert; // For INSERT operations

// Important: Export all tables for proper query building
export const tables = { lessons: lessonsTable };
