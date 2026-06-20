import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";

export const listWishlist = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    const { data, error } = await context.supabase
      .from("wishlist")
      .select("product_id, created_at, products!inner(slug, title, price, currency, product_images(url))")
      .order("created_at", { ascending: false });
    if (error) throw new Error(error.message);
    return data ?? [];
  });

export const toggleWishlist = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d: { slug: string }) => ({ slug: z.string().parse(d.slug) }))
  .handler(async ({ data, context }) => {
    const { data: prod } = await context.supabase.from("products").select("id").eq("slug", data.slug).maybeSingle();
    if (!prod) throw new Error("Product not found");
    const { data: existing } = await context.supabase
      .from("wishlist").select("id").eq("user_id", context.userId).eq("product_id", prod.id).maybeSingle();
    if (existing) {
      await context.supabase.from("wishlist").delete().eq("id", existing.id);
      return { in_wishlist: false };
    }
    await context.supabase.from("wishlist").insert({ user_id: context.userId, product_id: prod.id });
    return { in_wishlist: true };
  });

export const isInWishlist = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d: { slug: string }) => ({ slug: z.string().parse(d.slug) }))
  .handler(async ({ data, context }) => {
    const { data: prod } = await context.supabase.from("products").select("id").eq("slug", data.slug).maybeSingle();
    if (!prod) return { in_wishlist: false };
    const { data: existing } = await context.supabase
      .from("wishlist").select("id").eq("user_id", context.userId).eq("product_id", prod.id).maybeSingle();
    return { in_wishlist: !!existing };
  });
