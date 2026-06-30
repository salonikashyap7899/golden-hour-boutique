import { createStart, createMiddleware } from "@tanstack/react-start";

import { renderErrorPage } from "./lib/error-page";
import { attachSupabaseAuth } from "@/integrations/supabase/auth-attacher";

const errorMiddleware = createMiddleware().server(async ({ next }) => {
  try {
    return await next();
  } catch (error) {
    // Always re-throw so TanStack Start can handle the error natively:
    //   - server functions: serialized as JSON and returned to the client
    //   - page routes: rendered through React error boundaries
    // Catastrophic SSR failures are caught by normalizeCatastrophicSsrResponse in server.ts.
    console.error(error);
    throw error;
  }
});

export const startInstance = createStart(() => ({
  functionMiddleware: [attachSupabaseAuth],
  requestMiddleware: [errorMiddleware],
}));
