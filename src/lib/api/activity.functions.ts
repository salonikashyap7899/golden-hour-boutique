import { createServerFn } from "@tanstack/react-start";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";

export type ActivityEvent = {
  id: string;
  kind: "order" | "payment" | "wishlist" | "address" | "review" | "return" | "signin" | "account";
  title: string;
  detail?: string;
  amount?: number;
  link?: { to: string; params?: Record<string, string> };
  at: string;
};

export const getMyActivity = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    const { supabase, userId, claims } = context;
    const events: ActivityEvent[] = [];

    const [ordersRes, wishRes, addrRes, retRes, revRes] = await Promise.all([
      supabase.from("orders").select("id, order_number, status, payment_status, total, created_at, updated_at").order("created_at", { ascending: false }).limit(50),
      supabase.from("wishlist").select("id, created_at, products(title, slug)").order("created_at", { ascending: false }).limit(50),
      supabase.from("addresses").select("id, full_name, city, created_at, updated_at").order("updated_at", { ascending: false }).limit(20),
      supabase.from("returns").select("id, status, created_at, orders(order_number)").order("created_at", { ascending: false }).limit(20),
      supabase.from("reviews").select("id, rating, created_at, products(title, slug)").eq("user_id", userId).order("created_at", { ascending: false }).limit(20),
    ]);

    for (const o of (ordersRes.data ?? []) as any[]) {
      events.push({
        id: `order-${o.id}`,
        kind: "order",
        title: `Order ${o.order_number} placed`,
        detail: `Status: ${o.status}`,
        amount: Number(o.total),
        link: { to: "/account/orders/$id", params: { id: o.id } },
        at: o.created_at,
      });
      if (o.payment_status === "paid" && o.updated_at !== o.created_at) {
        events.push({
          id: `pay-${o.id}`,
          kind: "payment",
          title: `Payment received for ${o.order_number}`,
          amount: Number(o.total),
          link: { to: "/account/orders/$id", params: { id: o.id } },
          at: o.updated_at,
        });
      }
    }
    for (const w of (wishRes.data ?? []) as any[]) {
      events.push({
        id: `wish-${w.id}`,
        kind: "wishlist",
        title: `Saved “${w.products?.title ?? "a piece"}” to wishlist`,
        link: w.products?.slug ? { to: "/product/$slug", params: { slug: w.products.slug } } : undefined,
        at: w.created_at,
      });
    }
    for (const a of (addrRes.data ?? []) as any[]) {
      const updated = a.updated_at && a.updated_at !== a.created_at;
      events.push({
        id: `addr-${a.id}-${updated ? "u" : "c"}`,
        kind: "address",
        title: updated ? `Updated address — ${a.city}` : `Added address — ${a.city}`,
        detail: a.full_name,
        at: updated ? a.updated_at : a.created_at,
      });
    }
    for (const r of (retRes.data ?? []) as any[]) {
      events.push({
        id: `ret-${r.id}`,
        kind: "return",
        title: `Return requested for ${r.orders?.order_number ?? "order"}`,
        detail: `Status: ${r.status}`,
        at: r.created_at,
      });
    }
    for (const r of (revRes.data ?? []) as any[]) {
      events.push({
        id: `rev-${r.id}`,
        kind: "review",
        title: `Reviewed “${r.products?.title ?? "a piece"}”`,
        detail: `${r.rating}★`,
        link: r.products?.slug ? { to: "/product/$slug", params: { slug: r.products.slug } } : undefined,
        at: r.created_at,
      });
    }

    // Sign-in event from JWT claims (current session)
    const iat = (claims as any)?.iat;
    if (iat) {
      events.push({
        id: `signin-${iat}`,
        kind: "signin",
        title: "Signed in via OTP",
        detail: (claims as any)?.phone || (claims as any)?.email,
        at: new Date(Number(iat) * 1000).toISOString(),
      });
    }

    // Account created event from auth claims
    const created = (claims as any)?.user_metadata?.created_at || null;
    if (created) {
      events.push({
        id: `acct-${userId}`,
        kind: "account",
        title: "Account created",
        at: created,
      });
    }

    events.sort((a, b) => +new Date(b.at) - +new Date(a.at));
    return events.slice(0, 80);
  });
