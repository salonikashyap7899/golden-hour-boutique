import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";
import { createClient } from "@supabase/supabase-js";

function publicClient() {
  return createClient(process.env.SUPABASE_URL!, process.env.SUPABASE_PUBLISHABLE_KEY!, {
    auth: { persistSession: false, autoRefreshToken: false, storage: undefined },
  });
}

export const listReviewsForSlug = createServerFn({ method: "GET" })
  .inputValidator((d: { slug: string }) => ({ slug: z.string().parse(d.slug) }))
  .handler(async ({ data }) => {
    const sb = publicClient();
    const { data: prod } = await sb.from("products").select("id").eq("slug", data.slug).maybeSingle();
    if (!prod) return { reviews: [], rating_avg: 0, rating_count: 0 };
    const { data: reviews } = await sb
      .from("reviews")
      .select("id, rating, title, body, is_verified_purchase, created_at, user_id")
      .eq("product_id", prod.id)
      .eq("is_approved", true)
      .order("created_at", { ascending: false })
      .limit(50);
    // Fetch reviewer names
    const ids = [...new Set((reviews ?? []).map((r) => r.user_id))];
    let names: Record<string, string> = {};
    if (ids.length) {
      const { data: profs } = await sb.from("profiles").select("id, full_name").in("id", ids);
      names = Object.fromEntries((profs ?? []).map((p) => [p.id, p.full_name ?? "Verified buyer"]));
    }
    const enriched = (reviews ?? []).map((r) => ({ ...r, author: names[r.user_id] ?? "Verified buyer" }));
    const { data: p2 } = await sb.from("products").select("rating_avg, rating_count").eq("id", prod.id).maybeSingle();
    return { reviews: enriched, rating_avg: Number(p2?.rating_avg ?? 0), rating_count: p2?.rating_count ?? 0 };
  });

export const submitReview = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d: { slug: string; rating: number; title?: string; body?: string }) => ({
    slug: z.string().parse(d.slug),
    rating: z.number().int().min(1).max(5).parse(d.rating),
    title: z.string().trim().max(120).optional().parse(d.title),
    body: z.string().trim().max(2000).optional().parse(d.body),
  }))
  .handler(async ({ data, context }) => {
    const { data: prod } = await context.supabase.from("products").select("id").eq("slug", data.slug).maybeSingle();
    if (!prod) throw new Error("Product not found");

    // Verified purchase?
    const { count } = await context.supabase
      .from("order_items")
      .select("id, orders!inner(user_id, payment_status)", { count: "exact", head: true })
      .eq("product_id", prod.id)
      .eq("orders.user_id", context.userId)
      .eq("orders.payment_status", "paid");

    const { error } = await context.supabase.from("reviews").upsert(
      {
        product_id: prod.id,
        user_id: context.userId,
        rating: data.rating,
        title: data.title ?? null,
        body: data.body ?? null,
        is_verified_purchase: (count ?? 0) > 0,
      },
      { onConflict: "product_id,user_id" },
    );
    if (error) throw new Error(error.message);
    return { ok: true };
  });
