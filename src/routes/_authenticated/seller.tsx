import { createFileRoute, Link } from "@tanstack/react-router";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { useState } from "react";
import { Plus, Trash2, Package, ShoppingBag, Sparkles, TrendingUp } from "lucide-react";
import {
  getMySeller,
  listMySellerProducts,
  upsertSellerProduct,
  deleteSellerProduct,
  sellerOrderItems,
  changeMyPlan,
  listPlans,
} from "@/lib/api/sellers.functions";
import { formatINR } from "@/lib/products";

export const Route = createFileRoute("/_authenticated/seller")({
  head: () => ({ meta: [{ title: "Seller Dashboard — Maison" }, { name: "robots", content: "noindex" }] }),
  component: SellerDashboard,
});

function SellerDashboard() {
  const meFn = useServerFn(getMySeller);
  const me = useQuery({ queryKey: ["my-seller"], queryFn: () => meFn() });

  if (me.isLoading) return <Skeleton />;
  if (!me.data) {
    return (
      <div className="mx-auto max-w-xl px-6 py-32 text-center animate-fade-up">
        <h1 className="text-display text-4xl">You're not a seller yet</h1>
        <p className="mt-3 text-sm text-muted-foreground">Open a storefront to start listing pieces.</p>
        <Link to="/sell" className="btn-gold mt-8 inline-flex">Become a seller</Link>
      </div>
    );
  }

  const sub = me.data.seller_subscriptions?.find((s: any) => ["active", "trialing"].includes(s.status));
  const plan = sub?.subscription_plans;

  return (
    <main className="mx-auto max-w-[1400px] px-6 lg:px-10 pt-12 pb-24">
      <div className="border-b hairline pb-8 mb-10 flex flex-wrap items-end justify-between gap-6 animate-fade-up">
        <div>
          <div className="text-eyebrow text-accent">Storefront</div>
          <h1 className="text-display text-5xl mt-3">{me.data.brand_name}</h1>
          <div className="text-sm text-muted-foreground mt-2">
            Status: <span className="text-foreground capitalize">{me.data.status}</span> · Plan:{" "}
            <span className="text-foreground">{plan?.name ?? "—"}</span> · Commission:{" "}
            <span className="text-foreground">{me.data.commission_rate}%</span>
          </div>
        </div>
        <Link to="/plans" className="btn-outline-dark"><Sparkles className="h-4 w-4" /> Upgrade plan</Link>
      </div>

      <Stats sellerId={me.data.id} />

      <div className="grid lg:grid-cols-[1fr_2fr] gap-10 mt-12">
        <ProductsPanel />
        <OrdersPanel />
      </div>

      <PlanSwitcher current={plan?.code} />
    </main>
  );
}

function Stats({ sellerId }: { sellerId: string }) {
  const itemsFn = useServerFn(sellerOrderItems);
  const productsFn = useServerFn(listMySellerProducts);
  const items = useQuery({ queryKey: ["seller-orderitems"], queryFn: () => itemsFn() });
  const prods = useQuery({ queryKey: ["my-seller-products"], queryFn: () => productsFn() });

  const revenue = (items.data ?? []).reduce((s: number, i: any) => s + Number(i.unit_price) * i.quantity, 0);
  const sold = (items.data ?? []).reduce((s: number, i: any) => s + i.quantity, 0);

  return (
    <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
      <Stat icon={Package} label="Listed" value={String(prods.data?.length ?? 0)} />
      <Stat icon={ShoppingBag} label="Units sold" value={String(sold)} />
      <Stat icon={TrendingUp} label="Gross revenue" value={formatINR(revenue)} />
      <Stat icon={Sparkles} label="Rating" value="—" />
    </div>
  );
}

function Stat({ icon: Icon, label, value }: any) {
  return (
    <div className="border hairline p-5 bg-card animate-fade-up">
      <Icon className="h-4 w-4 text-accent" />
      <div className="text-eyebrow text-muted-foreground mt-3">{label}</div>
      <div className="text-display text-3xl mt-1">{value}</div>
    </div>
  );
}

function ProductsPanel() {
  const qc = useQueryClient();
  const listFn = useServerFn(listMySellerProducts);
  const upsert = useServerFn(upsertSellerProduct);
  const del = useServerFn(deleteSellerProduct);
  const products = useQuery({ queryKey: ["my-seller-products"], queryFn: () => listFn() });
  const [open, setOpen] = useState(false);
  const [form, setForm] = useState({ title: "", description: "", price: "", stock: "10", image_url: "", category_slug: "women" });
  const [err, setErr] = useState<string | null>(null);

  async function save() {
    setErr(null);
    try {
      await upsert({
        data: {
          title: form.title,
          description: form.description || undefined,
          price: Math.round(Number(form.price) * 100),
          stock: Number(form.stock),
          image_url: form.image_url,
          category_slug: form.category_slug,
        },
      });
      setOpen(false);
      setForm({ title: "", description: "", price: "", stock: "10", image_url: "", category_slug: "women" });
      qc.invalidateQueries({ queryKey: ["my-seller-products"] });
    } catch (e: any) {
      setErr(e.message);
    }
  }

  return (
    <section>
      <div className="flex items-center justify-between mb-5">
        <h2 className="text-display text-2xl">Your products</h2>
        <button onClick={() => setOpen(!open)} className="btn-outline-dark text-xs"><Plus className="h-3.5 w-3.5" /> Add</button>
      </div>

      {open && (
        <div className="border hairline p-5 mb-5 space-y-3 bg-card animate-fade-up">
          <input className="input-luxe" placeholder="Title" value={form.title} onChange={(e) => setForm({ ...form, title: e.target.value })} />
          <textarea className="input-luxe min-h-[70px]" placeholder="Description" value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} />
          <div className="grid grid-cols-2 gap-3">
            <input className="input-luxe" placeholder="Price ₹" type="number" value={form.price} onChange={(e) => setForm({ ...form, price: e.target.value })} />
            <input className="input-luxe" placeholder="Stock" type="number" value={form.stock} onChange={(e) => setForm({ ...form, stock: e.target.value })} />
          </div>
          <input className="input-luxe" placeholder="Image URL (https://…)" value={form.image_url} onChange={(e) => setForm({ ...form, image_url: e.target.value })} />
          <select className="input-luxe" value={form.category_slug} onChange={(e) => setForm({ ...form, category_slug: e.target.value })}>
            <option value="women">Women</option>
            <option value="men">Men</option>
            <option value="accessories">Accessories</option>
          </select>
          {err && <div className="text-xs text-destructive">{err}</div>}
          <div className="flex gap-3">
            <button onClick={save} className="btn-gold text-xs">Publish</button>
            <button onClick={() => setOpen(false)} className="btn-outline-dark text-xs">Cancel</button>
          </div>
        </div>
      )}

      <div className="space-y-3">
        {(products.data ?? []).map((p: any) => (
          <div key={p.id} className="border hairline p-4 flex gap-4 items-center bg-card animate-fade-up">
            <img src={p.product_images?.[0]?.url ?? "/products/p1.jpg"} alt="" className="h-16 w-16 object-cover" />
            <div className="flex-1 min-w-0">
              <div className="text-sm font-medium truncate">{p.title}</div>
              <div className="text-xs text-muted-foreground mt-0.5">{formatINR(Number(p.price))} · {p.stock} in stock</div>
            </div>
            <button
              onClick={async () => {
                await del({ data: { id: p.id } });
                qc.invalidateQueries({ queryKey: ["my-seller-products"] });
              }}
              className="text-muted-foreground hover:text-destructive p-2"
            >
              <Trash2 className="h-4 w-4" />
            </button>
          </div>
        ))}
        {(products.data ?? []).length === 0 && (
          <div className="text-center py-12 border hairline border-dashed text-sm text-muted-foreground">
            No products yet. Add your first piece.
          </div>
        )}
      </div>
      <style>{`.input-luxe{width:100%;background:var(--background);border:1px solid var(--border);padding:.6rem .9rem;font-size:.85rem;}.input-luxe:focus{outline:none;border-color:var(--foreground);}`}</style>
    </section>
  );
}

function OrdersPanel() {
  const fn = useServerFn(sellerOrderItems);
  const items = useQuery({ queryKey: ["seller-orderitems"], queryFn: () => fn() });
  return (
    <section>
      <h2 className="text-display text-2xl mb-5">Recent orders</h2>
      <div className="border hairline overflow-hidden">
        <table className="w-full text-sm">
          <thead className="bg-secondary text-eyebrow text-muted-foreground">
            <tr>
              <th className="text-left p-3">Order</th>
              <th className="text-left p-3">Product</th>
              <th className="text-right p-3">Qty</th>
              <th className="text-right p-3">Revenue</th>
              <th className="text-right p-3">Status</th>
            </tr>
          </thead>
          <tbody>
            {(items.data ?? []).map((i: any) => (
              <tr key={i.id} className="border-t hairline">
                <td className="p-3 text-xs">{i.orders?.order_number}</td>
                <td className="p-3">{i.products?.title}</td>
                <td className="p-3 text-right">{i.quantity}</td>
                <td className="p-3 text-right">{formatINR(Number(i.unit_price) * i.quantity)}</td>
                <td className="p-3 text-right capitalize text-xs">{i.orders?.status}</td>
              </tr>
            ))}
            {(items.data ?? []).length === 0 && (
              <tr><td colSpan={5} className="p-8 text-center text-muted-foreground text-sm">No orders yet.</td></tr>
            )}
          </tbody>
        </table>
      </div>
    </section>
  );
}

function PlanSwitcher({ current }: { current?: string }) {
  const qc = useQueryClient();
  const plansFn = useServerFn(listPlans);
  const change = useServerFn(changeMyPlan);
  const { data: plans } = useQuery({ queryKey: ["plans"], queryFn: () => plansFn() });

  return (
    <section className="mt-20">
      <h2 className="text-display text-3xl mb-6">Subscription</h2>
      <div className="grid md:grid-cols-3 gap-4">
        {(plans ?? []).map((p: any) => {
          const active = p.code === current;
          return (
            <div key={p.id} className={`border hairline p-5 ${active ? "ring-1 ring-accent bg-card" : ""}`}>
              <div className="text-eyebrow text-muted-foreground">{p.name}</div>
              <div className="text-display text-3xl mt-2">₹{(p.price_monthly / 100).toLocaleString("en-IN")}<span className="text-sm text-muted-foreground">/mo</span></div>
              <button
                disabled={active}
                onClick={async () => { await change({ data: { plan_code: p.code } }); qc.invalidateQueries({ queryKey: ["my-seller"] }); }}
                className="btn-outline-dark mt-4 text-xs w-full disabled:opacity-40"
              >
                {active ? "Current plan" : "Switch"}
              </button>
            </div>
          );
        })}
      </div>
    </section>
  );
}

function Skeleton() {
  return <div className="mx-auto max-w-[1400px] px-6 py-32 text-center text-sm text-muted-foreground">Loading your storefront…</div>;
}
