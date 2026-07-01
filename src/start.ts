import { createStart, createMiddleware } from "@tanstack/react-start";

import { renderErrorPage } from "./lib/error-page";
import { attachSupabaseAuth } from "@/integrations/supabase/auth-attacher";

// Wraps server-function calls only.
// Errors thrown here are serialized as JSON by TanStack Start and surfaced
// to the client as real error messages (not swallowed as "Internal Server Error").
const fnErrorMiddleware = createMiddleware().server(async ({ next }) => {
  try {
    return await next();
  } catch (error) {
    console.error("[ServerFn error]", error);
    throw error; // TanStack Start serialises this → client sees the real message
  }
});

// Wraps full HTTP page requests (SSR, not server functions).
// Returns the HTML error page for catastrophic page-level failures.
const pageErrorMiddleware = createMiddleware().server(async ({ next }) => {
  try {
    return await next();
  } catch (error) {
    if (error != null && typeof error === "object" && "statusCode" in error) {
      throw error;
    }
    console.error("[Page error]", error);
    return new Response(renderErrorPage(), {
      status: 500,
      headers: { "content-type": "text/html; charset=utf-8" },
    });
  }
});

export const startInstance = createStart(() => ({
  functionMiddleware: [attachSupabaseAuth, fnErrorMiddleware],
  requestMiddleware: [pageErrorMiddleware],
}));
