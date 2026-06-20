import { createFileRoute, Link } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { useState } from "react";
import { Package, Truck, CheckCircle2, Clock } from "lucide-react";
import { getOrderDetail } from "@/lib/api/orders.functions";
import { requestReturn } from "@/lib/api/returns.functions";
import { formatINR } from "@/lib/products";

export const Route = createFileRoute("/_authenticated/account/orders/$id")({
  head: () => ({ meta: [{ title: "Order — Maison" }, { name: "robots", content: "noindex" }] }),
  component: OrderDetailPage,
});

const STEPS = ["pending","confirmed","packed","shipped","out_for_delivery","delivered"] as const;

function OrderDetailPage() {
  const { id } = Route.useParams();
  const fn = useServerFn(getOrderDetail);
  const q = useQuery({ queryKey: ["order", id], queryFn: () => fn({ data: { id } }) });

  if (q.isLoading) return <main className="p-12 text-sm text-muted-foreground">Loading order…</main>;
  if (q.error || !q.data) return <main className="p-12">Order not found.</main>;

  const o: any = q.data;
  const stepIdx = STEPS.indexOf(o.status);
  const otp = o.delivery_otps?.[0];

  return (
    <main className="mx-auto max-w-[1100px] px-6 lg:px-10 pt-12 pb-24">
      <Link to="/account" className="text-eyebrow text-muted-foreground link-underline">← Back to account</Link>
      <div className="border-b hairline pb-8 mt-4 mb-10">
        <div className="text-eyebrow text-accent">Order {o.order_number}</div>
        <h1 className="text-display text-4xl mt-3">{formatINR(Number(o.total))} · {o.order_items.length} pieces</h1>
        <div className="text-sm text-muted-foreground mt-2">Placed {new Date(o.created_at).toLocaleString()}</div>
      </div>

      {/* Tracker */}
      <div className="border hairline p-8 mb-10">
        <div className="text-eyebrow mb-6">Tracking</div>
        <div className="grid grid-cols-6 gap-2">
          {STEPS.map((s, i) => {
            const done = i <= stepIdx;
            const Icon = i < 3 ? Package : i < 5 ? Truck : CheckCircle2;
            return (
              <div key={s} className="text-center">
                <div className={`mx-auto h-10 w-10 grid place-items-center rounded-full ${done ? "bg-accent text-accent-foreground" : "bg-secondary text-muted-foreground"}`}>
                  <Icon className="h-4 w-4" />
                </div>
                <div className={`text-[10px] uppercase tracking-widest mt-2 ${done ? "" : "text-muted-foreground"}`}>{s.replace(/_/g," ")}</div>
              </div>
            );
          })}
        </div>
        {o.shipments?.[0] && (
          <div className="mt-6 text-sm text-muted-foreground">
            {o.shipments[0].courier} · Tracking <span className="text-foreground">{o.shipments[0].tracking_number ?? "—"}</span>
          </div>
        )}
        {otp && !otp.verified && o.status !== "delivered" && (
          <div className="mt-6 border hairline bg-secondary p-4">
            <div className="text-eyebrow text-accent">Delivery OTP</div>
            <div className="text-display text-3xl mt-2 tracking-[0.6em]">{otp.otp_display}</div>
            <div className="text-xs text-muted-foreground mt-2">Share this code with the delivery agent only at the moment of handover.</div>
          </div>
        )}
      </div>

      {/* Items + summary */}
      <div className="grid lg:grid-cols-[1fr_360px] gap-12">
        <div className="space-y-6">
          {o.order_items.map((it: any) => (
            <div key={it.id} className="grid grid-cols-[100px_1fr_auto] gap-6 pb-6 border-b hairline">
              <div className="aspect-[3/4] bg-secondary"><img src={it.image_url ?? "/products/p1.jpg"} alt={it.title} className="h-full w-full object-cover"/></div>
              <div>
                <div className="text-sm">{it.title}</div>
                <div className="text-xs text-muted-foreground mt-2">{it.size} · {it.color} · Qty {it.quantity}</div>
              </div>
              <div className="text-sm text-right">{formatINR(Number(it.price) * it.quantity)}</div>
            </div>
          ))}

          {o.status === "delivered" && <ReturnSection orderId={o.id} items={o.order_items} onDone={q.refetch} />}

          {o.order_status_history?.length > 0 && (
            <div>
              <div className="text-eyebrow mt-8 mb-3">Status history</div>
              <ul className="text-sm space-y-2">
                {o.order_status_history.sort((a:any,b:any)=>+new Date(a.created_at)-+new Date(b.created_at)).map((h:any) => (
                  <li key={h.id} className="flex justify-between border-b hairline py-2">
                    <span className="capitalize">{h.status.replace(/_/g," ")} {h.note && <span className="text-muted-foreground">· {h.note}</span>}</span>
                    <span className="text-muted-foreground text-xs"><Clock className="inline h-3 w-3 mr-1"/>{new Date(h.created_at).toLocaleString()}</span>
                  </li>
                ))}
              </ul>
            </div>
          )}
        </div>

        <aside className="lg:sticky lg:top-28 lg:self-start bg-secondary p-6 text-sm space-y-3">
          <div className="text-eyebrow">Ship to</div>
          <div>
            <div>{o.shipping_address.full_name}</div>
            <div className="text-muted-foreground">{o.shipping_address.line1}{o.shipping_address.line2?`, ${o.shipping_address.line2}`:""}</div>
            <div className="text-muted-foreground">{o.shipping_address.city}, {o.shipping_address.state} {o.shipping_address.pincode}</div>
            <div className="text-muted-foreground">{o.shipping_address.phone}</div>
          </div>
          <div className="border-t hairline pt-3 space-y-2">
            <Row label="Subtotal" value={formatINR(Number(o.subtotal))} />
            {Number(o.discount) > 0 && <Row label="Discount" value={`− ${formatINR(Number(o.discount))}`} />}
            <Row label="Shipping" value={Number(o.shipping_fee) === 0 ? "Complimentary" : formatINR(Number(o.shipping_fee))} />
            <Row label={<span className="text-display text-base">Total</span>} value={<span className="text-display text-base">{formatINR(Number(o.total))}</span>} />
          </div>
          <div className="text-xs text-muted-foreground">Payment: <span className="text-foreground capitalize">{o.payment_status}</span> via Razorpay</div>
        </aside>
      </div>
    </main>
  );
}

function ReturnSection({ orderId, items, onDone }: { orderId: string; items: any[]; onDone: () => void }) {
  const [open, setOpen] = useState(false);
  const [reason, setReason] = useState("");
  const [itemId, setItemId] = useState<string>("");
  const [err, setErr] = useState<string|null>(null);
  const fn = useServerFn(requestReturn);
  return (
    <div className="border hairline p-6 mt-4">
      <div className="text-eyebrow mb-2">Returns</div>
      {!open ? (
        <button onClick={() => setOpen(true)} className="btn-outline-dark">Request a return</button>
      ) : (
        <div className="space-y-3">
          <select value={itemId} onChange={(e)=>setItemId(e.target.value)} className="w-full bg-background border hairline px-3 py-2 text-sm">
            <option value="">Entire order</option>
            {items.map((i: any) => <option key={i.id} value={i.id}>{i.title}</option>)}
          </select>
          <textarea value={reason} onChange={(e)=>setReason(e.target.value)} placeholder="Reason for return" rows={3}
            className="w-full bg-background border hairline px-3 py-2 text-sm focus:outline-none focus:border-foreground" />
          {err && <div className="text-xs text-destructive">{err}</div>}
          <div className="flex gap-3">
            <button onClick={async()=>{ try { await fn({ data: { order_id: orderId, order_item_id: itemId || undefined, reason } }); setOpen(false); onDone(); } catch(e:any){ setErr(e.message);} }} className="btn-gold">Submit</button>
            <button onClick={()=>setOpen(false)} className="btn-outline-dark">Cancel</button>
          </div>
        </div>
      )}
    </div>
  );
}

function Row({ label, value }: { label: React.ReactNode; value: React.ReactNode }) {
  return <div className="flex justify-between"><div className="text-muted-foreground">{label}</div><div>{value}</div></div>;
}
