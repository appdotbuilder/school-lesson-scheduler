
import { initTRPC } from '@trpc/server';
import { createHTTPServer } from '@trpc/server/adapters/standalone';
import 'dotenv/config';
import cors from 'cors';
import superjson from 'superjson';
import { z } from 'zod';

import { 
  createLessonInputSchema, 
  updateLessonInputSchema, 
  getLessonsQuerySchema 
} from './schema';
import { createLesson } from './handlers/create_lesson';
import { getLessons } from './handlers/get_lessons';
import { getLessonById } from './handlers/get_lesson_by_id';
import { updateLesson } from './handlers/update_lesson';
import { deleteLesson } from './handlers/delete_lesson';
import { getScheduleConflicts } from './handlers/get_schedule_conflicts';

const t = initTRPC.create({
  transformer: superjson,
});

const publicProcedure = t.procedure;
const router = t.router;

const appRouter = router({
  healthcheck: publicProcedure.query(() => {
    return { status: 'ok', timestamp: new Date().toISOString() };
  }),
  
  createLesson: publicProcedure
    .input(createLessonInputSchema)
    .mutation(({ input }) => createLesson(input)),
  
  getLessons: publicProcedure
    .input(getLessonsQuerySchema.optional())
    .query(({ input }) => getLessons(input)),
  
  getLessonById: publicProcedure
    .input(z.number())
    .query(({ input }) => getLessonById(input)),
  
  updateLesson: publicProcedure
    .input(updateLessonInputSchema)
    .mutation(({ input }) => updateLesson(input)),
  
  deleteLesson: publicProcedure
    .input(z.number())
    .mutation(({ input }) => deleteLesson(input)),
  
  getScheduleConflicts: publicProcedure
    .input(z.object({
      classroom: z.string(),
      scheduledTime: z.coerce.date(),
      durationMinutes: z.number().int().positive(),
      excludeLessonId: z.number().optional()
    }))
    .query(({ input }) => getScheduleConflicts(
      input.classroom,
      input.scheduledTime,
      input.durationMinutes,
      input.excludeLessonId
    )),
});

export type AppRouter = typeof appRouter;

async function start() {
  const port = process.env['SERVER_PORT'] || 2022;
  const server = createHTTPServer({
    middleware: (req, res, next) => {
      cors()(req, res, next);
    },
    router: appRouter,
    createContext() {
      return {};
    },
  });
  server.listen(port);
  console.log(`TRPC server listening at port: ${port}`);
}

start();
