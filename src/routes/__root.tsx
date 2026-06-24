import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import {
  Outlet,
  Link,
  createRootRouteWithContext,
  useRouter,
  HeadContent,
  Scripts,
} from "@tanstack/react-router";
import { useEffect, type ReactNode } from "react";

import appCss from "../styles.css?url";
import { reportLovableError } from "../lib/lovable-error-reporting";
import { CartProvider } from "@/lib/cart";
import { AuthProvider } from "@/lib/auth";
import { Header } from "@/components/site/Header";
import { Footer } from "@/components/site/Footer";
import { LenisProvider } from "@/components/site/LenisProvider";
import { PageTransition } from "@/components/site/PageTransition";
import { CustomCursor } from "@/components/site/CustomCursor";

function NotFoundComponent() {
  return (
    <div className="flex min-h-[70vh] items-center justify-center px-4">
      <div className="max-w-md text-center">
        <div className="text-eyebrow text-accent">404</div>
        <h1 className="mt-4 text-display text-5xl">Lost in the atelier</h1>
        <p className="mt-4 text-sm text-muted-foreground">This page doesn't exist or has been retired from the collection.</p>
        <Link to="/" className="btn-outline-dark mt-8 inline-flex">Return home</Link>
      </div>
    </div>
  );
}

function ErrorComponent({ error, reset }: { error: Error; reset: () => void }) {
  console.error(error);
  const router = useRouter();
  useEffect(() => { reportLovableError(error, { boundary: "tanstack_root_error_component" }); }, [error]);
  return (
    <div className="flex min-h-[70vh] items-center justify-center px-4">
      <div className="max-w-md text-center">
        <h1 className="text-display text-3xl">This page didn't load</h1>
        <p className="mt-3 text-sm text-muted-foreground">Something went wrong on our end.</p>
        <div className="mt-6 flex justify-center gap-3">
          <button onClick={() => { router.invalidate(); reset(); }} className="btn-outline-dark">Try again</button>
          <a href="/" className="btn-outline-dark">Home</a>
        </div>
      </div>
    </div>
  );
}

export const Route = createRootRouteWithContext<{ queryClient: QueryClient }>()({
  head: () => ({
    meta: [
      { charSet: "utf-8" },
      { name: "viewport", content: "width=device-width, initial-scale=1" },
      { title: "Maison — Editorial luxury, considered objects" },
      { name: "description", content: "An editorial house for silk, cashmere, leather and gold. Shop the Maison collection." },
      { name: "author", content: "Maison Atelier" },
      { property: "og:title", content: "Maison — Editorial luxury" },
      { property: "og:description", content: "An editorial house for silk, cashmere, leather and gold." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
    links: [{ rel: "stylesheet", href: appCss }],
  }),
  shellComponent: RootShell,
  component: RootComponent,
  notFoundComponent: NotFoundComponent,
  errorComponent: ErrorComponent,
});

function RootShell({ children }: { children: ReactNode }) {
  return (
    <html lang="en">
      <head><HeadContent /></head>
      <body>{children}<Scripts /></body>
    </html>
  );
}

function RootComponent() {
  const { queryClient } = Route.useRouteContext();
  return (
    <QueryClientProvider client={queryClient}>
      <AuthProvider>
        <CartProvider>
          <LenisProvider>
            <div className="noise-overlay" aria-hidden="true" />
            <CustomCursor />
            <PageTransition />
            <Header />
            <Outlet />
            <Footer />
          </LenisProvider>
        </CartProvider>
      </AuthProvider>
    </QueryClientProvider>
  );
}
