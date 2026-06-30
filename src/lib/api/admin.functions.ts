import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { createHmac } from "crypto";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";

async function assertAdmin(supabase: any, userId: string) {
  const { data } = await supabase.rpc("has_role", { _user_id: userId, _role: "admin" });
  if (!data) throw new Error("Forbidden");
}

export const checkIsAdmin = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    const { data } = await context.supabase.rpc("has_role", { _user_id: context.userId, _role: "admin" });
    return { is_admin: !!data };
  });

/**
 * One-shot admin bootstrap: the FIRST signed-in user who calls this becomes admin.
 * After that it returns the existing admin status without granting.
 */
export const bootstrapAdmin = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    const { count } = await supabaseAdmin.from("user_roles").select("id", { count: "exact", head: true }).eq("role", "admin");
    if ((count ?? 0) === 0) {
      await supabaseAdmin.from("user_roles").insert({ user_id: context.userId, role: "admin" });
      return { granted: true };
    }
    return { granted: false };
  });

export const adminListAllOrders = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    await assertAdmin(context.supabase, context.userId);
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    const { data, error } = await supabaseAdmin
      .from("orders")
      .select("id, order_number, status, payment_status, total, created_at, shipping_address")
      .order("created_at", { ascending: false }).limit(200);
    if (error) throw new Error(error.message);
    return data ?? [];
  });

export const adminUpdateOrderStatus = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d: unknown) =>
    z.object({
      order_id: z.string().uuid(),
      status: z.enum(["pending","confirmed","packed","shipped","out_for_delivery","delivered","cancelled","returned"]),
      tracking_number: z.string().optional(),
      courier: z.string().optional(),
      note: z.string().optional(),
    }).parse(d),
  )
  .handler(async ({ data, context }) => {
    await assertAdmin(context.supabase, context.userId);
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    await supabaseAdmin.from("orders").update({ status: data.status }).eq("id", data.order_id);
    await supabaseAdmin.from("order_status_history").insert({ order_id: data.order_id, status: data.status, note: data.note ?? null });
    if (data.status === "shipped" || data.tracking_number) {
      const { data: existing } = await supabaseAdmin.from("shipments").select("id").eq("order_id", data.order_id).maybeSingle();
      const patch: any = { courier: data.courier ?? "BlueDart", tracking_number: data.tracking_number ?? null, status: data.status };
      if (data.status === "shipped") patch.shipped_at = new Date().toISOString();
      if (data.status === "delivered") patch.delivered_at = new Date().toISOString();
      if (existing) await supabaseAdmin.from("shipments").update(patch).eq("id", existing.id);
      else await supabaseAdmin.from("shipments").insert({ order_id: data.order_id, ...patch });
    }
    return { ok: true };
  });

export const verifyDeliveryOtp = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d: unknown) =>
    z.object({ order_id: z.string().uuid(), otp: z.string().regex(/^\d{4}$/) }).parse(d),
  )
  .handler(async ({ data, context }) => {
    await assertAdmin(context.supabase, context.userId);
    const keySecret = process.env.RAZORPAY_KEY_SECRET ?? "fallback-secret";
    const expected = createHmac("sha256", keySecret).update(`${data.order_id}::${data.otp}`).digest("hex");
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    const { data: row } = await supabaseAdmin.from("delivery_otps").select("*").eq("order_id", data.order_id).maybeSingle();
    if (!row || row.otp_hash !== expected) throw new Error("Invalid OTP");
    await supabaseAdmin.from("delivery_otps").update({ verified: true, verified_at: new Date().toISOString() }).eq("id", row.id);
    await supabaseAdmin.from("orders").update({ status: "delivered" }).eq("id", data.order_id);
    await supabaseAdmin.from("shipments").update({ status: "delivered", delivered_at: new Date().toISOString() }).eq("order_id", data.order_id);
    await supabaseAdmin.from("order_status_history").insert({ order_id: data.order_id, status: "delivered", note: "Verified by delivery OTP" });
    return { ok: true };
  });

const productSchema = z.object({
  id: z.string().uuid().optional(),
  slug: z.string().min(2).max(120),
  title: z.string().min(2).max(200),
  description: z.string().max(4000).optional(),
  brand: z.string().max(120).optional(),
  material: z.string().max(200).optional(),
  category_slug: z.string().optional(),
  price: z.number().nonnegative(),
  compare_at_price: z.number().nonnegative().optional().nullable(),
  is_active: z.boolean().default(true),
  is_featured: z.boolean().default(false),
  image_url: z.string().optional(),
});

export const adminSaveProduct = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d: unknown) => productSchema.parse(d))
  .handler(async ({ data, context }) => {
    await assertAdmin(context.supabase, context.userId);
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    let category_id: string | null = null;
    if (data.category_slug) {
      const { data: c } = await supabaseAdmin.from("categories").select("id").eq("slug", data.category_slug).maybeSingle();
      category_id = c?.id ?? null;
    }
    const payload: any = {
      slug: data.slug, title: data.title, description: data.description ?? null, brand: data.brand ?? null,
      material: data.material ?? null, category_id, price: data.price, compare_at_price: data.compare_at_price ?? null,
      is_active: data.is_active, is_featured: data.is_featured,
    };
    let prodId = data.id;
    if (prodId) {
      await supabaseAdmin.from("products").update(payload).eq("id", prodId);
    } else {
      const { data: ins } = await supabaseAdmin.from("products").insert(payload).select("id").single();
      prodId = ins!.id;
    }
    if (data.image_url && prodId) {
      const { data: existing } = await supabaseAdmin.from("product_images").select("id").eq("product_id", prodId).limit(1);
      if (existing && existing.length) await supabaseAdmin.from("product_images").update({ url: data.image_url }).eq("id", existing[0].id);
      else await supabaseAdmin.from("product_images").insert({ product_id: prodId, url: data.image_url, sort_order: 0 });
    }
    return { ok: true, id: prodId };
  });

export const adminListProducts = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    await assertAdmin(context.supabase, context.userId);
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    const { data } = await supabaseAdmin.from("products").select("id, slug, title, price, is_active, is_featured, categories(slug), product_images(url)").order("created_at", { ascending: false });
    return data ?? [];
  });

export const adminListReturns = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    await assertAdmin(context.supabase, context.userId);
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    const { data } = await supabaseAdmin.from("returns").select("*, orders(order_number, total)").order("created_at", { ascending: false });
    return data ?? [];
  });

export const adminListCategories = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    await assertAdmin(context.supabase, context.userId);
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    const { data } = await supabaseAdmin.from("categories").select("*").order("sort_order", { ascending: true });
    return data ?? [];
  });

export const adminSaveCategory = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d: unknown) =>
    z.object({
      id: z.string().uuid().optional(),
      slug: z.string().min(2).max(80),
      name: z.string().min(1).max(120),
      description: z.string().max(500).optional(),
      image_url: z.string().optional(),
      sort_order: z.number().int().default(0),
      is_active: z.boolean().default(true),
    }).parse(d),
  )
  .handler(async ({ data, context }) => {
    await assertAdmin(context.supabase, context.userId);
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    const payload = { slug: data.slug, name: data.name, description: data.description ?? null, image_url: data.image_url ?? null, sort_order: data.sort_order, is_active: data.is_active };
    if (data.id) {
      await supabaseAdmin.from("categories").update(payload).eq("id", data.id);
    } else {
      await supabaseAdmin.from("categories").insert(payload);
    }
    return { ok: true };
  });

export const adminUpdateReturn = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d: unknown) =>
    z.object({
      id: z.string().uuid(),
      status: z.enum(["requested","approved","rejected","picked_up","refunded"]),
      refund_amount: z.number().optional(),
      admin_notes: z.string().optional(),
    }).parse(d),
  )
  .handler(async ({ data, context }) => {
    await assertAdmin(context.supabase, context.userId);
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    const patch: any = { status: data.status, admin_notes: data.admin_notes ?? null };
    if (data.refund_amount !== undefined) patch.refund_amount = data.refund_amount;
    await supabaseAdmin.from("returns").update(patch).eq("id", data.id);
    if (data.status === "refunded") {
      const { data: ret } = await supabaseAdmin.from("returns").select("order_id").eq("id", data.id).maybeSingle();
      if (ret) await supabaseAdmin.from("orders").update({ payment_status: "refunded", status: "returned" }).eq("id", ret.order_id);
    }
    return { ok: true };
  });
