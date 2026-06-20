import { createFileRoute } from "@tanstack/react-router";
import { createHmac, timingSafeEqual } from "crypto";

export const Route = createFileRoute("/api/public/razorpay-webhook")({
  server: {
    handlers: {
      POST: async ({ request }) => {
        const secret = process.env.RAZORPAY_WEBHOOK_SECRET;
        if (!secret) return new Response("Not configured", { status: 500 });

        const signature = request.headers.get("x-razorpay-signature") ?? "";
        const body = await request.text();
        const expected = createHmac("sha256", secret).update(body).digest("hex");

        const sigBuf = Buffer.from(signature);
        const expBuf = Buffer.from(expected);
        if (sigBuf.length !== expBuf.length || !timingSafeEqual(sigBuf, expBuf)) {
          return new Response("Invalid signature", { status: 401 });
        }

        const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
        const payload = JSON.parse(body) as any;
        const event = payload.event as string;
        const payment = payload.payload?.payment?.entity;
        const rpOrderId = payment?.order_id;
        if (!rpOrderId) return new Response("ok");

        const { data: order } = await supabaseAdmin
          .from("orders").select("id, payment_status").eq("razorpay_order_id", rpOrderId).maybeSingle();
        if (!order) return new Response("ok");

        if (event === "payment.captured" && order.payment_status !== "paid") {
          await supabaseAdmin.from("orders").update({
            payment_status: "paid",
            status: "confirmed",
            razorpay_payment_id: payment.id,
          }).eq("id", order.id);
          await supabaseAdmin.from("order_status_history").insert({ order_id: order.id, status: "confirmed", note: "Webhook: payment.captured" });
        } else if (event === "payment.failed") {
          await supabaseAdmin.from("orders").update({ payment_status: "failed" }).eq("id", order.id);
          await supabaseAdmin.from("order_status_history").insert({ order_id: order.id, status: "cancelled", note: "Webhook: payment.failed" });
        }
        return new Response("ok");
      },
    },
  },
});
