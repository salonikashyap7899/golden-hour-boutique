import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { createHmac, randomBytes } from "crypto";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";

const itemSchema = z.object({
  slug: z.string(),
  title: z.string(),
  image_url: z.string().nullable().optional(),
  price: z.number().int().positive(),
  size: z.string(),
  color: z.string(),
  quantity: z.number().int().min(1).max(10),
});

const addressSnapshot = z.object({
  full_name: z.string(),
  phone: z.string(),
  line1: z.string(),
  line2: z.string().nullable().optional(),
  city: z.string(),
  state: z.string(),
  pincode: z.string(),
  country: z.string().default("IN"),
});

export const getPaymentConfig = createServerFn({ method: "GET" }).handler(async () => {
  return { razorpay_key_id: process.env.RAZORPAY_KEY_ID ?? null };
});

export const createOrder = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d: unknown) =>
    z.object({
      items: z.array(itemSchema).min(1),
      address: addressSnapshot,
      coupon_code: z.string().trim().max(40).optional().nullable(),
    }).parse(d),
  )
  .handler(async ({ data, context }) => {
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    const keyId = process.env.RAZORPAY_KEY_ID;
    const keySecret = process.env.RAZORPAY_KEY_SECRET;
    if (!keyId || !keySecret) throw new Error("Razorpay not configured");

    // Server-side price authority: re-fetch products by slug
    const slugs = data.items.map((i) => i.slug);
    const { data: dbProducts } = await supabaseAdmin.from("products").select("id, slug, title, price, is_active").in("slug", slugs);
    if (!dbProducts || dbProducts.length !== slugs.length) throw new Error("Some products are unavailable");

    const priceBySlug = Object.fromEntries(dbProducts.map((p) => [p.slug, p]));
    let subtotal = 0;
    const items = data.items.map((i) => {
      const dbp = priceBySlug[i.slug];
      if (!dbp || !dbp.is_active) throw new Error(`Unavailable: ${i.slug}`);
      const lineTotal = Number(dbp.price) * i.quantity;
      subtotal += lineTotal;
      return { ...i, db: dbp };
    });

    // Coupon
    let discount = 0;
    let appliedCoupon: string | null = null;
    if (data.coupon_code) {
      const code = data.coupon_code.trim().toUpperCase();
      const { data: coupon } = await supabaseAdmin
        .from("coupons").select("*").eq("code", code).eq("is_active", true).maybeSingle();
      if (coupon && (!coupon.expires_at || new Date(coupon.expires_at) > new Date())
          && (!coupon.max_uses || coupon.used_count < coupon.max_uses)
          && subtotal >= Number(coupon.min_subtotal ?? 0)) {
        if (coupon.percent_off) discount = Math.round(subtotal * Number(coupon.percent_off) / 100);
        else if (coupon.flat_off) discount = Number(coupon.flat_off);
        appliedCoupon = code;
      }
    }

    const shipping = subtotal - discount >= 4999 ? 0 : 250;
    const total = Math.max(0, subtotal - discount + shipping);
    const amountPaise = Math.round(total * 100);

    // Order number
    const { data: ordNum } = await supabaseAdmin.rpc("gen_order_number");
    const order_number = (ordNum as string) ?? `MSN${Date.now()}`;

    // Razorpay order
    const rpRes = await fetch("https://api.razorpay.com/v1/orders", {
      method: "POST",
      headers: {
        Authorization: `Basic ${Buffer.from(`${keyId}:${keySecret}`).toString("base64")}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        amount: amountPaise,
        currency: "INR",
        receipt: order_number,
        notes: { user_id: context.userId },
      }),
    });
    if (!rpRes.ok) {
      throw new Error(`Razorpay order failed: ${await rpRes.text()}`);
    }
    const rpOrder = await rpRes.json() as { id: string };

    // Insert order
    const { data: order, error: oerr } = await supabaseAdmin.from("orders").insert({
      order_number,
      user_id: context.userId,
      status: "pending",
      payment_status: "pending",
      payment_provider: "razorpay",
      razorpay_order_id: rpOrder.id,
      subtotal, discount, shipping_fee: shipping, tax: 0, total,
      currency: "INR",
      coupon_code: appliedCoupon,
      shipping_address: data.address,
    }).select().single();
    if (oerr || !order) throw new Error(oerr?.message ?? "Failed to create order");

    // Items
    const itemsInsert = items.map((i) => ({
      order_id: order.id,
      product_id: i.db.id,
      title: i.title,
      image_url: i.image_url ?? null,
      size: i.size,
      color: i.color,
      price: Number(i.db.price),
      quantity: i.quantity,
    }));
    await supabaseAdmin.from("order_items").insert(itemsInsert);

    await supabaseAdmin.from("order_status_history").insert({ order_id: order.id, status: "pending", note: "Order created" });

    // Generate delivery OTP up-front (revealed to customer; verified by courier)
    const deliveryOtp = String(Math.floor(1000 + Math.random() * 9000));
    const otpHash = createHmac("sha256", keySecret).update(`${order.id}::${deliveryOtp}`).digest("hex");
    await supabaseAdmin.from("delivery_otps").insert({
      order_id: order.id,
      otp_hash: otpHash,
      otp_display: deliveryOtp,
      expires_at: new Date(Date.now() + 30 * 24 * 60 * 60_000).toISOString(),
    });

    return {
      order_id: order.id,
      order_number,
      razorpay_order_id: rpOrder.id,
      amount_paise: amountPaise,
      key_id: keyId,
      currency: "INR",
    };
  });

export const verifyPayment = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d: unknown) =>
    z.object({
      order_id: z.string().uuid(),
      razorpay_order_id: z.string(),
      razorpay_payment_id: z.string(),
      razorpay_signature: z.string(),
    }).parse(d),
  )
  .handler(async ({ data, context }) => {
    const keySecret = process.env.RAZORPAY_KEY_SECRET;
    if (!keySecret) throw new Error("Razorpay not configured");
    const expected = createHmac("sha256", keySecret)
      .update(`${data.razorpay_order_id}|${data.razorpay_payment_id}`)
      .digest("hex");
    if (expected !== data.razorpay_signature) throw new Error("Invalid payment signature");

    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    const { data: order } = await supabaseAdmin.from("orders").select("*").eq("id", data.order_id).maybeSingle();
    if (!order || order.user_id !== context.userId) throw new Error("Order not found");

    await supabaseAdmin.from("orders").update({
      payment_status: "paid",
      status: "confirmed",
      razorpay_payment_id: data.razorpay_payment_id,
      razorpay_signature: data.razorpay_signature,
    }).eq("id", data.order_id);

    await supabaseAdmin.from("order_status_history").insert({ order_id: data.order_id, status: "confirmed", note: "Payment verified" });

    // Increment coupon usage
    if (order.coupon_code) {
      const { data: c } = await supabaseAdmin.from("coupons").select("id, used_count").eq("code", order.coupon_code).maybeSingle();
      if (c) await supabaseAdmin.from("coupons").update({ used_count: (c.used_count ?? 0) + 1 }).eq("id", c.id);
    }

    return { ok: true, order_number: order.order_number };
  });

export const listMyOrders = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    const { data, error } = await context.supabase
      .from("orders")
      .select("id, order_number, status, payment_status, total, currency, created_at, order_items(title, image_url, quantity)")
      .eq("user_id", context.userId)
      .order("created_at", { ascending: false });
    if (error) throw new Error(error.message);
    return data ?? [];
  });

export const getOrderDetail = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d: { id: string }) => ({ id: z.string().uuid().parse(d.id) }))
  .handler(async ({ data, context }) => {
    const { data: order, error } = await context.supabase
      .from("orders")
      .select("*, order_items(*), order_status_history(*), shipments(*), delivery_otps(otp_display, verified, expires_at), returns(*)")
      .eq("id", data.id)
      .maybeSingle();
    if (error) throw new Error(error.message);
    if (!order) throw new Error("Order not found");
    return order;
  });
