import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";

export const requestReturn = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d: unknown) =>
    z.object({
      order_id: z.string().uuid(),
      order_item_id: z.string().uuid().optional(),
      reason: z.string().trim().min(5).max(500),
    }).parse(d),
  )
  .handler(async ({ data, context }) => {
    const { data: order } = await context.supabase
      .from("orders").select("id, user_id, status, payment_status").eq("id", data.order_id).maybeSingle();
    if (!order || order.user_id !== context.userId) throw new Error("Order not found");
    if (order.payment_status !== "paid") throw new Error("Only paid orders can be returned");
    if (!["delivered", "out_for_delivery"].includes(order.status)) {
      throw new Error("Only delivered orders are eligible for return");
    }

    const { data: ret, error } = await context.supabase.from("returns").insert({
      order_id: data.order_id,
      order_item_id: data.order_item_id ?? null,
      user_id: context.userId,
      reason: data.reason,
      status: "requested",
    }).select().single();
    if (error) throw new Error(error.message);
    return ret;
  });

export const listMyReturns = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    const { data, error } = await context.supabase
      .from("returns")
      .select("*, orders(order_number)")
      .order("created_at", { ascending: false });
    if (error) throw new Error(error.message);
    return data ?? [];
  });
