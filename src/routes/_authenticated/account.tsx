import { createFileRoute, Link } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { useState } from "react";
import { Package, MapPin, Heart, RotateCcw, LogOut, ChevronRight, Plus, Trash2 } from "lucide-react";
import { listMyOrders } from "@/lib/api/orders.functions";
import { listAddresses, saveAddress, deleteAddress } from "@/lib/api/addresses.functions";
import { listMyReturns } from "@/lib/api/returns.functions";
import { listWishlist } from "@/lib/api/wishlist.functions";
import { checkIsAdmin, bootstrapAdmin } from "@/lib/api/admin.functions";
import { useAuth } from "@/lib/auth";
import { formatINR } from "@/lib/products";

export const Route = createFileRoute("/_authenticated/account")({
  head: () => ({ meta: [{ title: "Account — Maison" }, { name: "robots", content: "noindex" }] }),
  component: AccountPage,
});

type Tab = "orders" | "addresses" | "wishlist" | "returns";

function AccountPage() {
  const { user, signOut } = useAuth();
  const [tab, setTab] = useState<Tab>("orders");

  const ordersFn = useServerFn(listMyOrders);
  const addrFn = useServerFn(listAddresses);
  const retFn = useServerFn(listMyReturns);
  const wishFn = useServerFn(listWishlist);
  const adminFn = useServerFn(checkIsAdmin);

  const orders = useQuery({ queryKey: ["my-orders"], queryFn: () => ordersFn() });
  const addresses = useQuery({ queryKey: ["my-addresses"], queryFn: () => addrFn() });
  const returns = useQuery({ queryKey: ["my-returns"], queryFn: () => retFn() });
  const wishlist = useQuery({ queryKey: ["my-wishlist"], queryFn: () => wishFn() });
  const admin = useQuery({ queryKey: ["is-admin"], queryFn: () => adminFn() });

  return (
    <main className="mx-auto max-w-[1400px] px-6 lg:px-10 pt-12 pb-24">
      <div className="border-b hairline pb-8 mb-10">
        <div className="text-eyebrow text-accent">Account</div>
        <h1 className="text-display text-5xl mt-3">{user?.user_metadata?.full_name || "Welcome"}</h1>
        <div className="text-sm text-muted-foreground mt-2">{user?.user_metadata?.phone ?? user?.email}</div>
      </div>

      <div className="grid lg:grid-cols-[260px_1fr] gap-12">
        <nav className="space-y-1 text-sm">
          {(["orders","addresses","wishlist","returns"] as Tab[]).map((t) => (
            <button key={t} onClick={() => setTab(t)}
              className={`w-full flex items-center justify-between py-3 px-4 border-l-2 ${tab===t?"border-accent bg-secondary":"border-transparent hover:bg-secondary"}`}>
              <span className="capitalize flex items-center gap-3">
                {t==="orders" && <Package className="h-4 w-4" />}
                {t==="addresses" && <MapPin className="h-4 w-4" />}
                {t==="wishlist" && <Heart className="h-4 w-4" />}
                {t==="returns" && <RotateCcw className="h-4 w-4" />}
                {t}
              </span>
              <ChevronRight className="h-4 w-4 text-muted-foreground" />
            </button>
          ))}
          {admin.data?.is_admin && (
            <Link to="/admin" className="w-full flex items-center justify-between py-3 px-4 border-l-2 border-transparent hover:bg-secondary text-accent">
              Admin <ChevronRight className="h-4 w-4" />
            </Link>
          )}
          <button onClick={signOut} className="w-full flex items-center gap-3 py-3 px-4 text-muted-foreground hover:text-foreground mt-6">
            <LogOut className="h-4 w-4" /> Sign out
          </button>
        </nav>

        <section>
          {tab === "orders" && <OrdersTab data={orders.data} loading={orders.isLoading} />}
          {tab === "addresses" && <AddressesTab data={addresses.data} refetch={addresses.refetch} />}
          {tab === "wishlist" && <WishlistTab data={wishlist.data} />}
          {tab === "returns" && <ReturnsTab data={returns.data} />}
        </section>
      </div>
    </main>
  );
}

function OrdersTab({ data, loading }: any) {
  if (loading) return <div className="text-sm text-muted-foreground">Loading…</div>;
  if (!data?.length) return <Empty title="No orders yet" cta={{ to: "/shop", label: "Start shopping" }} />;
  return (
    <div className="space-y-4">
      {data.map((o: any) => (
        <Link key={o.id} to="/account/orders/$id" params={{ id: o.id }} className="block border hairline p-6 hover:border-foreground transition-colors">
          <div className="flex items-center justify-between">
            <div>
              <div className="text-eyebrow text-muted-foreground">Order {o.order_number}</div>
              <div className="text-sm mt-1">{o.order_items?.length ?? 0} pieces · {formatINR(Number(o.total))}</div>
            </div>
            <div className="text-right">
              <StatusPill status={o.status} />
              <div className="text-xs text-muted-foreground mt-2">{new Date(o.created_at).toLocaleDateString()}</div>
            </div>
          </div>
        </Link>
      ))}
    </div>
  );
}

function AddressesTab({ data, refetch }: any) {
  const [form, setForm] = useState(false);
  const save = useServerFn(saveAddress);
  const del = useServerFn(deleteAddress);
  return (
    <div className="space-y-4">
      {(data ?? []).map((a: any) => (
        <div key={a.id} className="border hairline p-6 flex justify-between">
          <div className="text-sm">
            <div className="font-medium">{a.full_name} {a.is_default && <span className="ml-2 text-[10px] uppercase tracking-widest text-accent">Default</span>}</div>
            <div className="text-muted-foreground mt-1">{a.line1}{a.line2?`, ${a.line2}`:""}, {a.city}, {a.state} {a.pincode}</div>
            <div className="text-muted-foreground mt-1">{a.phone}</div>
          </div>
          <button onClick={async () => { await del({ data: { id: a.id } }); refetch(); }} className="text-muted-foreground hover:text-destructive"><Trash2 className="h-4 w-4" /></button>
        </div>
      ))}
      {!form ? (
        <button onClick={() => setForm(true)} className="btn-outline-dark"><Plus className="h-4 w-4" /> Add address</button>
      ) : (
        <AddressForm onSaved={() => { setForm(false); refetch(); }} onCancel={() => setForm(false)} />
      )}
    </div>
  );
}

function AddressForm({ onSaved, onCancel }: { onSaved: () => void; onCancel: () => void }) {
  const save = useServerFn(saveAddress);
  const [v, setV] = useState({ full_name: "", phone: "", line1: "", line2: "", city: "", state: "", pincode: "", country: "IN", is_default: false });
  const [err, setErr] = useState<string|null>(null);
  return (
    <div className="border hairline p-6 space-y-3">
      <div className="grid grid-cols-2 gap-3">
        <Input label="Full name" value={v.full_name} on={(x)=>setV({...v,full_name:x})}/>
        <Input label="Phone" value={v.phone} on={(x)=>setV({...v,phone:x})}/>
      </div>
      <Input label="Address line 1" value={v.line1} on={(x)=>setV({...v,line1:x})}/>
      <Input label="Address line 2" value={v.line2} on={(x)=>setV({...v,line2:x})}/>
      <div className="grid grid-cols-3 gap-3">
        <Input label="City" value={v.city} on={(x)=>setV({...v,city:x})}/>
        <Input label="State" value={v.state} on={(x)=>setV({...v,state:x})}/>
        <Input label="Pincode" value={v.pincode} on={(x)=>setV({...v,pincode:x})}/>
      </div>
      <label className="flex items-center gap-2 text-sm"><input type="checkbox" checked={v.is_default} onChange={(e)=>setV({...v,is_default:e.target.checked})}/> Set as default</label>
      {err && <div className="text-xs text-destructive">{err}</div>}
      <div className="flex gap-3">
        <button onClick={async()=>{ try { await save({ data: v }); onSaved(); } catch(e:any){ setErr(e.message); } }} className="btn-gold">Save</button>
        <button onClick={onCancel} className="btn-outline-dark">Cancel</button>
      </div>
    </div>
  );
}

function Input({ label, value, on }: { label: string; value: string; on: (s: string) => void }) {
  return (
    <label className="block">
      <span className="text-eyebrow block mb-1">{label}</span>
      <input value={value ?? ""} onChange={(e)=>on(e.target.value)} className="w-full bg-background border hairline px-3 py-2 text-sm focus:outline-none focus:border-foreground"/>
    </label>
  );
}

function WishlistTab({ data }: any) {
  if (!data?.length) return <Empty title="Your wishlist is empty" cta={{ to: "/shop", label: "Discover pieces" }} />;
  return (
    <div className="grid sm:grid-cols-2 gap-6">
      {data.map((w: any) => (
        <Link key={w.product_id} to="/product/$slug" params={{ slug: w.products.slug }} className="group block">
          <div className="aspect-[3/4] bg-secondary overflow-hidden">
            <img src={w.products.product_images?.[0]?.url ?? "/products/p1.jpg"} alt={w.products.title} className="h-full w-full object-cover group-hover:scale-105 transition-transform duration-700" />
          </div>
          <div className="mt-3 flex justify-between"><div className="text-sm">{w.products.title}</div><div className="text-sm">{formatINR(Number(w.products.price))}</div></div>
        </Link>
      ))}
    </div>
  );
}

function ReturnsTab({ data }: any) {
  if (!data?.length) return <Empty title="No returns" sub="From a delivered order, request a return on its detail page." />;
  return (
    <div className="space-y-4">
      {data.map((r: any) => (
        <div key={r.id} className="border hairline p-6">
          <div className="flex justify-between">
            <div>
              <div className="text-eyebrow text-muted-foreground">Order {r.orders?.order_number}</div>
              <div className="text-sm mt-1">{r.reason}</div>
              {r.admin_notes && <div className="text-xs text-muted-foreground mt-2">Note: {r.admin_notes}</div>}
            </div>
            <StatusPill status={r.status} />
          </div>
        </div>
      ))}
    </div>
  );
}

function Empty({ title, sub, cta }: { title: string; sub?: string; cta?: { to: string; label: string } }) {
  return (
    <div className="text-center py-20">
      <div className="text-display text-2xl">{title}</div>
      {sub && <div className="text-sm text-muted-foreground mt-3">{sub}</div>}
      {cta && <Link to={cta.to} className="btn-gold mt-6 inline-flex">{cta.label}</Link>}
    </div>
  );
}

function StatusPill({ status }: { status: string }) {
  const ok = ["delivered","paid","approved","refunded"].includes(status);
  const bad = ["cancelled","failed","rejected"].includes(status);
  const cls = ok ? "bg-foreground text-background" : bad ? "bg-destructive text-destructive-foreground" : "bg-secondary text-foreground";
  return <span className={`inline-block px-3 py-1 text-[10px] uppercase tracking-widest ${cls}`}>{status.replace(/_/g," ")}</span>;
}
