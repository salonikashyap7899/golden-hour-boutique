import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { createClient } from "@supabase/supabase-js";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";

const slugify = (s: string) =>
  s.toLowerCase().trim().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "").slice(0, 60) || `seller-${Date.now()}`;

/* ---------------- Public reads ---------------- */

export const listPlans = createServerFn({ method: "GET" }).handler(async () => {
  const sb = createClient(process.env.SUPABASE_URL!, process.env.SUPABASE_PUBLISHABLE_KEY!, {
    auth: { persistSession: false, autoRefreshToken: false },
  });
  const { data, error } = await sb
    .from("subscription_plans")
    .select("*")
    .eq("is_active", true)
    .order("sort_order");
  if (error) throw new Error(error.message);
  return data ?? [];
});

export const listActiveSellers = createServerFn({ method: "GET" }).handler(async () => {
  const sb = createClient(process.env.SUPABASE_URL!, process.env.SUPABASE_PUBLISHABLE_KEY!, {
    auth: { persistSession: false, autoRefreshToken: false },
  });
  const { data, error } = await sb
    .from("sellers")
    .select("id, brand_name, slug, logo_url, description, rating_avg, rating_count")
    .eq("status", "active");
  if (error) throw new Error(error.message);
  return data ?? [];
});

/* ---------------- Authenticated: become a seller ---------------- */

export const getMySeller = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    const { data } = await context.supabase
      .from("sellers")
      .select("*, seller_subscriptions(*, subscription_plans(*))")
      .eq("user_id", context.userId)
      .maybeSingle();
    return data;
  });

export const createSeller = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d) =>
    z.object({
      brand_name: z.string().trim().min(2).max(80),
      description: z.string().max(500).optional(),
      gst_number: z.string().max(20).optional(),
      pan_number: z.string().max(15).optional(),
      plan_code: z.enum(["free", "pro", "elite"]).default("free"),
    }).parse(d),
  )
  .handler(async ({ data, context }) => {
    const { supabase, userId } = context;

    const existing = await supabase.from("sellers").select("id").eq("user_id", userId).maybeSingle();
    if (existing.data) throw new Error("You already have a seller account");

    let slug = slugify(data.brand_name);
    let attempt = 0;
    while (attempt < 5) {
      const dup = await supabase.from("sellers").select("id").eq("slug", slug).maybeSingle();
      if (!dup.data) break;
      slug = `${slugify(data.brand_name)}-${Math.floor(Math.random() * 9000 + 1000)}`;
      attempt++;
    }

    const { data: seller, error } = await supabase
      .from("sellers")
      .insert({
        user_id: userId,
        brand_name: data.brand_name,
        slug,
        description: data.description ?? null,
        gst_number: data.gst_number ?? null,
        pan_number: data.pan_number ?? null,
        status: "active", // auto-approve for now; admin can suspend
      })
      .select()
      .single();
    if (error) throw new Error(error.message);

    // Grant seller role (requires admin client)
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    await supabaseAdmin
      .from("user_roles")
      .insert({ user_id: userId, role: "seller" })
      .select();

    // Attach plan
    const { data: plan } = await supabase
      .from("subscription_plans")
      .select("id")
      .eq("code", data.plan_code)
      .single();
    if (plan) {
      await supabase.from("seller_subscriptions").insert({
        seller_id: seller.id,
        plan_id: plan.id,
        status: data.plan_code === "free" ? "active" : "trialing",
      });
    }

    return seller;
  });

/* ---------------- Seller dashboard: products ---------------- */

export const listMySellerProducts = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    const { data: seller } = await context.supabase
      .from("sellers")
      .select("id")
      .eq("user_id", context.userId)
      .maybeSingle();
    if (!seller) return [];
    const { data } = await context.supabase
      .from("products")
      .select("*, product_images(*)")
      .eq("seller_id", seller.id)
      .order("created_at", { ascending: false });
    return data ?? [];
  });

export const upsertSellerProduct = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d) =>
    z.object({
      id: z.string().uuid().optional(),
      title: z.string().trim().min(2).max(120),
      description: z.string().max(2000).optional(),
      price: z.number().int().min(1),
      compare_at_price: z.number().int().optional(),
      stock: z.number().int().min(0).default(0),
      image_url: z.string().url(),
      category_slug: z.string().optional(),
    }).parse(d),
  )
  .handler(async ({ data, context }) => {
    const { data: seller } = await context.supabase
      .from("sellers")
      .select("id")
      .eq("user_id", context.userId)
      .maybeSingle();
    if (!seller) throw new Error("Become a seller first");

    // Plan enforcement
    const { data: sub } = await context.supabase
      .from("seller_subscriptions")
      .select("subscription_plans(product_limit)")
      .eq("seller_id", seller.id)
      .in("status", ["active", "trialing"])
      .maybeSingle();
    const limit = (sub as any)?.subscription_plans?.product_limit;
    if (!data.id && typeof limit === "number") {
      const { count } = await context.supabase
        .from("products")
        .select("id", { count: "exact", head: true })
        .eq("seller_id", seller.id);
      if ((count ?? 0) >= limit) throw new Error(`Plan limit reached (${limit} products). Upgrade your plan.`);
    }

    let category_id: string | null = null;
    if (data.category_slug) {
      const c = await context.supabase.from("categories").select("id").eq("slug", data.category_slug).maybeSingle();
      category_id = c.data?.id ?? null;
    }

    const slug = slugify(data.title) + "-" + Math.floor(Math.random() * 9000 + 1000);

    if (data.id) {
      const sb: any = context.supabase;
      const { data: row, error } = await sb
        .from("products")
        .update({
          title: data.title,
          description: data.description ?? null,
          price: data.price,
          compare_at_price: data.compare_at_price ?? null,
          stock: data.stock,
          category_id,
        })
        .eq("id", data.id)
        .eq("seller_id", seller.id)
        .select()
        .single();
      if (error) throw new Error(error.message);
      await sb.from("product_images").delete().eq("product_id", data.id);
      await sb.from("product_images").insert({ product_id: data.id, url: data.image_url, position: 0 });
      return row;
    }

    const sb: any = context.supabase;
    const { data: row, error } = await sb
      .from("products")
      .insert({
        seller_id: seller.id,
        title: data.title,
        slug,
        description: data.description ?? null,
        price: data.price,
        compare_at_price: data.compare_at_price ?? null,
        stock: data.stock,
        category_id,
        is_published: true,
      })
      .select()
      .single();
    if (error) throw new Error(error.message);
    await sb.from("product_images").insert({ product_id: row.id, url: data.image_url, position: 0 });
    return row;
  });

export const deleteSellerProduct = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d) => z.object({ id: z.string().uuid() }).parse(d))
  .handler(async ({ data, context }) => {
    const { data: seller } = await context.supabase
      .from("sellers")
      .select("id")
      .eq("user_id", context.userId)
      .maybeSingle();
    if (!seller) throw new Error("Not a seller");
    const { error } = await context.supabase
      .from("products")
      .delete()
      .eq("id", data.id)
      .eq("seller_id", seller.id);
    if (error) throw new Error(error.message);
    return { ok: true };
  });

export const sellerOrderItems = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    const { data: seller } = await context.supabase
      .from("sellers")
      .select("id")
      .eq("user_id", context.userId)
      .maybeSingle();
    if (!seller) return [];
    const { data } = await context.supabase
      .from("order_items")
      .select("*, products!inner(seller_id, title), orders(order_number, status, created_at)")
      .eq("products.seller_id", seller.id)
      .order("created_at", { ascending: false })
      .limit(100);
    return data ?? [];
  });

/* ---------------- Switch plan ---------------- */

export const changeMyPlan = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d) => z.object({ plan_code: z.enum(["free", "pro", "elite"]) }).parse(d))
  .handler(async ({ data, context }) => {
    const { data: seller } = await context.supabase
      .from("sellers")
      .select("id")
      .eq("user_id", context.userId)
      .maybeSingle();
    if (!seller) throw new Error("Not a seller");
    const { data: plan } = await context.supabase
      .from("subscription_plans")
      .select("id")
      .eq("code", data.plan_code)
      .single();
    if (!plan) throw new Error("Invalid plan");
    // Cancel any existing
    await context.supabase
      .from("seller_subscriptions")
      .update({ status: "canceled" })
      .eq("seller_id", seller.id)
      .in("status", ["active", "trialing", "past_due"]);
    const { data: sub, error } = await context.supabase
      .from("seller_subscriptions")
      .insert({
        seller_id: seller.id,
        plan_id: plan.id,
        status: data.plan_code === "free" ? "active" : "trialing",
      })
      .select()
      .single();
    if (error) throw new Error(error.message);
    return sub;
  });
