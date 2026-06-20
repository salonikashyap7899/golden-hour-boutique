import { createFileRoute, useNavigate, Link } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { useEffect, useState } from "react";
import { ArrowRight, Loader2 } from "lucide-react";
import { listAddresses, saveAddress } from "@/lib/api/addresses.functions";
import { createOrder, verifyPayment } from "@/lib/api/orders.functions";
import { useCart } from "@/lib/cart";
import { formatINR } from "@/lib/products";

export const Route = createFileRoute("/_authenticated/checkout")({
  head: () => ({ meta: [{ title: "Checkout — Maison" }, { name: "robots", content: "noindex" }] }),
  component: CheckoutPage,
});

declare global { interface Window { Razorpay: any } }

function useRazorpayScript() {
  const [ready, setReady] = useState(false);
  useEffect(() => {
    if (typeof window === "undefined") return;
    if (window.Razorpay) { setReady(true); return; }
    const s = document.createElement("script");
    s.src = "https://checkout.razorpay.com/v1/checkout.js";
    s.onload = () => setReady(true);
    document.body.appendChild(s);
  }, []);
  return ready;
}

function CheckoutPage() {
  const nav = useNavigate();
  const { items, subtotal, clear } = useCart();
  const addrFn = useServerFn(listAddresses);
  const saveFn = useServerFn(saveAddress);
  const orderFn = useServerFn(createOrder);
  const verifyFn = useServerFn(verifyPayment);
  const addresses = useQuery({ queryKey: ["my-addresses-co"], queryFn: () => addrFn() });
  const [selected, setSelected] = useState<string | null>(null);
  const [newAddr, setNewAddr] = useState({ full_name: "", phone: "", line1: "", line2: "", city: "", state: "", pincode: "", country: "IN", is_default: true });
  const [coupon, setCoupon] = useState("");
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState<string | null>(null);
  const rzpReady = useRazorpayScript();

  useEffect(() => {
    if (addresses.data?.length && !selected) setSelected(addresses.data[0].id);
  }, [addresses.data, selected]);

  const shipping = subtotal >= 4999 || subtotal === 0 ? 0 : 250;
  const total = subtotal + shipping;

  if (items.length === 0) {
    return (
      <main className="mx-auto max-w-md text-center py-32 px-6">
        <h1 className="text-display text-4xl">Your bag is empty</h1>
        <Link to="/shop" className="btn-gold mt-6 inline-flex">Shop</Link>
      </main>
    );
  }

  async function pay() {
    setErr(null); setBusy(true);
    try {
      let addressPayload;
      if (selected) {
        const a = addresses.data!.find((x: any) => x.id === selected)!;
        addressPayload = { full_name: a.full_name, phone: a.phone, line1: a.line1, line2: a.line2, city: a.city, state: a.state, pincode: a.pincode, country: a.country };
      } else {
        const saved = await saveFn({ data: newAddr });
        addressPayload = { full_name: saved.full_name, phone: saved.phone, line1: saved.line1, line2: saved.line2, city: saved.city, state: saved.state, pincode: saved.pincode, country: saved.country };
      }
      const order = await orderFn({
        data: {
          items: items.map((i) => ({ slug: i.slug, title: i.name, image_url: typeof i.image === "string" ? i.image : null, price: i.price, size: i.size, color: i.color, quantity: i.qty })),
          address: addressPayload,
          coupon_code: coupon || undefined,
        },
      });
      if (!rzpReady || !window.Razorpay) throw new Error("Payment script not ready");
      const rzp = new window.Razorpay({
        key: order.key_id,
        amount: order.amount_paise,
        currency: order.currency,
        name: "Maison",
        description: `Order ${order.order_number}`,
        order_id: order.razorpay_order_id,
        prefill: { name: addressPayload.full_name, contact: addressPayload.phone },
        theme: { color: "#C9A96E" },
        handler: async (resp: any) => {
          try {
            await verifyFn({ data: { order_id: order.order_id, razorpay_order_id: resp.razorpay_order_id, razorpay_payment_id: resp.razorpay_payment_id, razorpay_signature: resp.razorpay_signature } });
            clear();
            nav({ to: "/account/orders/$id", params: { id: order.order_id } });
          } catch (e: any) { setErr(e.message); setBusy(false); }
        },
        modal: { ondismiss: () => setBusy(false) },
      });
      rzp.open();
    } catch (e: any) { setErr(e.message ?? "Could not start checkout"); setBusy(false); }
  }

  return (
    <main className="mx-auto max-w-[1300px] px-6 lg:px-10 pt-12 pb-24">
      <div className="border-b hairline pb-8 mb-10">
        <div className="text-eyebrow text-accent">Checkout</div>
        <h1 className="text-display text-5xl mt-3">Secure payment</h1>
      </div>
      <div className="grid lg:grid-cols-[1fr_400px] gap-12">
        <div className="space-y-8">
          <section>
            <h2 className="text-display text-2xl mb-4">Shipping address</h2>
            {(addresses.data ?? []).length > 0 && (
              <div className="space-y-3 mb-4">
                {addresses.data!.map((a: any) => (
                  <label key={a.id} className={`block border hairline p-4 cursor-pointer ${selected===a.id?"border-foreground":"hover:border-foreground/50"}`}>
                    <input type="radio" checked={selected===a.id} onChange={()=>setSelected(a.id)} className="mr-3"/>
                    <span className="text-sm">
                      <span className="font-medium">{a.full_name}</span> · {a.phone}
                      <span className="block text-muted-foreground">{a.line1}, {a.city}, {a.state} {a.pincode}</span>
                    </span>
                  </label>
                ))}
                <button onClick={()=>setSelected(null)} className={`block border hairline p-4 text-sm w-full text-left ${selected===null?"border-foreground":"hover:border-foreground/50"}`}>
                  + Use a new address
                </button>
              </div>
            )}
            {selected === null && (
              <div className="border hairline p-4 space-y-3">
                <div className="grid grid-cols-2 gap-3">
                  <Field label="Full name" v={newAddr.full_name} on={(x)=>setNewAddr({...newAddr,full_name:x})}/>
                  <Field label="Phone" v={newAddr.phone} on={(x)=>setNewAddr({...newAddr,phone:x})}/>
                </div>
                <Field label="Address line 1" v={newAddr.line1} on={(x)=>setNewAddr({...newAddr,line1:x})}/>
                <Field label="Address line 2" v={newAddr.line2} on={(x)=>setNewAddr({...newAddr,line2:x})}/>
                <div className="grid grid-cols-3 gap-3">
                  <Field label="City" v={newAddr.city} on={(x)=>setNewAddr({...newAddr,city:x})}/>
                  <Field label="State" v={newAddr.state} on={(x)=>setNewAddr({...newAddr,state:x})}/>
                  <Field label="Pincode" v={newAddr.pincode} on={(x)=>setNewAddr({...newAddr,pincode:x})}/>
                </div>
              </div>
            )}
          </section>
        </div>

        <aside className="lg:sticky lg:top-28 lg:self-start bg-secondary p-8">
          <h2 className="text-display text-2xl mb-6">Order</h2>
          <div className="space-y-2 mb-4">
            {items.map((i) => (
              <div key={`${i.id}-${i.size}-${i.color}`} className="flex justify-between text-sm">
                <span>{i.name} <span className="text-muted-foreground">× {i.qty}</span></span>
                <span>{formatINR(i.price * i.qty)}</span>
              </div>
            ))}
          </div>
          <div className="border-t hairline pt-4 space-y-3 text-sm">
            <div className="flex justify-between"><span className="text-muted-foreground">Subtotal</span><span>{formatINR(subtotal)}</span></div>
            <div className="flex justify-between"><span className="text-muted-foreground">Shipping</span><span>{shipping===0?"Complimentary":formatINR(shipping)}</span></div>
          </div>
          <div className="mt-3">
            <input value={coupon} onChange={(e)=>setCoupon(e.target.value.toUpperCase())} placeholder="Promo code"
              className="w-full bg-background border hairline px-3 py-2 text-sm focus:outline-none focus:border-foreground" />
          </div>
          <div className="border-t hairline mt-4 pt-4 flex justify-between">
            <span className="text-display text-lg">Total</span>
            <span className="text-display text-lg">{formatINR(total)}</span>
          </div>
          {err && <div className="text-xs text-destructive mt-3">{err}</div>}
          <button onClick={pay} disabled={busy} className="btn-gold w-full mt-6">
            {busy ? <Loader2 className="h-4 w-4 animate-spin" /> : <>Pay with Razorpay <ArrowRight className="h-4 w-4" /></>}
          </button>
          <div className="text-[11px] text-center text-muted-foreground mt-3">Secured by Razorpay · UPI, Cards, Netbanking</div>
        </aside>
      </div>
    </main>
  );
}

function Field({ label, v, on }: { label: string; v: string; on: (x: string) => void }) {
  return (
    <label className="block">
      <span className="text-eyebrow block mb-1">{label}</span>
      <input value={v ?? ""} onChange={(e)=>on(e.target.value)} className="w-full bg-background border hairline px-3 py-2 text-sm focus:outline-none focus:border-foreground"/>
    </label>
  );
}
