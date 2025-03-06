import { router, publicProcedure } from '../trpc';

export const appRouter = router({
  dummy: publicProcedure.query(() => 'Hello, world!'),
});

// Export type router type signature,
// NOT the router itself.
export type AppRouter = typeof appRouter;