import { createFileRoute } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { useState } from "react";
import {
  checkIsAdmin, bootstrapAdmin,
  adminListAllOrders, adminUpdateOrderStatus, verifyDeliveryOtp,
  adminListProducts, adminSaveProduct,
  adminListReturns, adminUpdateReturn,
  adminListCategories, adminSaveCategory,
} from "@/lib/api/admin.functions";
import { formatINR } from "@/lib/products";

export const Route = createFileRoute("/_authenticated/admin")({
  head: () => ({ meta: [{ title: "Admin — Maison" }, { name: "robots", content: "noindex" }] }),
  component: AdminPage,
});

function AdminPage() {
  const checkFn = useServerFn(checkIsAdmin);
  const bootFn = useServerFn(bootstrapAdmin);
  const isAdminQ = useQuery({ queryKey: ["is-admin-page"], queryFn: () => checkFn() });
  const [tab, setTab] = useState<"orders"|"products"|"categories"|"returns">("orders");

  if (isAdminQ.isLoading) return <main className="p-12 text-sm text-muted-foreground">Loading…</main>;
  if (!isAdminQ.data?.is_admin) {
    return (
      <main className="mx-auto max-w-md text-center py-32 px-6">
        <h1 className="text-display text-3xl">Admin access</h1>
        <p className="text-sm text-muted-foreground mt-3">If you are the store owner, claim admin access. The first claimant becomes the admin.</p>
        <button onClick={async()=>{ await bootFn(); isAdminQ.refetch(); }} className="btn-gold mt-6">Claim admin</button>
      </main>
    );
  }
  return (
    <main className="mx-auto max-w-[1400px] px-6 lg:px-10 pt-12 pb-24">
      <div className="border-b hairline pb-8 mb-10">
        <div className="text-eyebrow text-accent">Admin</div>
        <h1 className="text-display text-5xl mt-3">Atelier control</h1>
      </div>
      <div className="flex gap-6 border-b hairline mb-8 text-sm">
        {(["orders","products","categories","returns"] as const).map((t) => (
          <button key={t} onClick={()=>setTab(t)} className={`pb-3 capitalize ${tab===t?"border-b-2 border-foreground -mb-px":"text-muted-foreground"}`}>{t}</button>
        ))}
      </div>
      {tab === "orders" && <OrdersTab />}
      {tab === "products" && <ProductsTab />}
      {tab === "categories" && <CategoriesTab />}
      {tab === "returns" && <ReturnsTab />}
    </main>
  );
}

function OrdersTab() {
  const listFn = useServerFn(adminListAllOrders);
  const updFn = useServerFn(adminUpdateOrderStatus);
  const otpFn = useServerFn(verifyDeliveryOtp);
  const q = useQuery({ queryKey: ["admin-orders"], queryFn: () => listFn() });
  const [busy, setBusy] = useState<string|null>(null);

  async function setStatus(orderId: string, status: any, tracking?: string) {
    setBusy(orderId);
    try { await updFn({ data: { order_id: orderId, status, tracking_number: tracking } }); await q.refetch(); }
    finally { setBusy(null); }
  }

  if (!q.data?.length) return <div className="text-sm text-muted-foreground py-12 text-center">No orders yet.</div>;

  return (
    <div className="space-y-3">
      {(q.data ?? []).map((o: any) => (
        <div key={o.id} className="border hairline p-5 grid lg:grid-cols-[1fr_auto] gap-4">
          <div>
            <div className="text-eyebrow text-muted-foreground">{o.order_number} · {new Date(o.created_at).toLocaleString()}</div>
            <div className="text-sm mt-1">{o.shipping_address?.full_name} · {o.shipping_address?.city}, {o.shipping_address?.state}</div>
            <div className="text-sm mt-1">{formatINR(Number(o.total))} · payment <span className="capitalize">{o.payment_status}</span></div>
          </div>
          <div className="flex flex-wrap gap-2 items-center">
            <select defaultValue={o.status} onChange={(e)=>setStatus(o.id, e.target.value)} disabled={busy===o.id}
              className="bg-background border hairline px-3 py-2 text-sm">
              {["pending","confirmed","packed","shipped","out_for_delivery","delivered","cancelled"].map(s => <option key={s} value={s}>{s}</option>)}
            </select>
            <DeliveryOtpVerify orderId={o.id} onDone={q.refetch} fn={otpFn} />
          </div>
        </div>
      ))}
    </div>
  );
}

function DeliveryOtpVerify({ orderId, onDone, fn }: any) {
  const [otp, setOtp] = useState("");
  const [err, setErr] = useState<string|null>(null);
  return (
    <div className="flex gap-2">
      <input value={otp} onChange={(e)=>setOtp(e.target.value.replace(/\D/g,"").slice(0,4))} placeholder="OTP" className="w-20 bg-background border hairline px-2 py-2 text-sm" />
      <button onClick={async()=>{ try { await fn({ data: { order_id: orderId, otp } }); setOtp(""); onDone(); } catch(e:any){ setErr(e.message);} }} className="btn-outline-dark !py-2 !px-3 text-xs">Verify delivery</button>
      {err && <div className="text-xs text-destructive">{err}</div>}
    </div>
  );
}

function ProductsTab() {
  const listFn = useServerFn(adminListProducts);
  const saveFn = useServerFn(adminSaveProduct);
  const q = useQuery({ queryKey: ["admin-products"], queryFn: () => listFn() });
  const [edit, setEdit] = useState<any | null>(null);
  const blank = { slug: "", title: "", description: "", brand: "", material: "", category_slug: "women", price: 0, is_active: true, is_featured: false, image_url: "" };

  return (
    <div className="grid lg:grid-cols-[1fr_400px] gap-8">
      <div className="space-y-3">
        <button onClick={()=>setEdit(blank)} className="btn-gold">+ New product</button>
        {(q.data ?? []).map((p: any) => (
          <button key={p.id} onClick={()=>setEdit({
            id: p.id, slug: p.slug, title: p.title, price: Number(p.price), is_active: p.is_active, is_featured: p.is_featured,
            category_slug: p.categories?.slug ?? "", image_url: p.product_images?.[0]?.url ?? "",
            description: "", brand: "", material: "",
          })} className="w-full text-left border hairline p-4 flex justify-between items-center hover:border-foreground">
            <span className="flex items-center gap-3">
              {p.product_images?.[0]?.url && <img src={p.product_images[0].url} className="h-10 w-10 object-cover"/>}
              <span>
                <span className="block text-sm">{p.title}</span>
                <span className="block text-xs text-muted-foreground">{p.slug}</span>
              </span>
            </span>
            <span className="text-sm">{formatINR(Number(p.price))} {!p.is_active && <span className="text-destructive text-xs ml-2">inactive</span>}</span>
          </button>
        ))}
      </div>
      {edit && (
        <aside className="border hairline p-6 space-y-3 sticky top-28 self-start">
          <h3 className="text-display text-xl">{edit.id ? "Edit product" : "New product"}</h3>
          {[["Slug","slug"],["Title","title"],["Brand","brand"],["Material","material"],["Image URL","image_url"]].map(([l,k]) => (
            <label key={k} className="block"><span className="text-eyebrow block mb-1">{l}</span>
              <input value={edit[k] ?? ""} onChange={(e)=>setEdit({...edit, [k]: e.target.value})} className="w-full bg-background border hairline px-3 py-2 text-sm"/>
            </label>
          ))}
          <label className="block"><span className="text-eyebrow block mb-1">Description</span>
            <textarea value={edit.description ?? ""} onChange={(e)=>setEdit({...edit,description:e.target.value})} rows={3} className="w-full bg-background border hairline px-3 py-2 text-sm"/>
          </label>
          <div className="grid grid-cols-2 gap-3">
            <label><span className="text-eyebrow block mb-1">Price (INR)</span>
              <input type="number" value={edit.price} onChange={(e)=>setEdit({...edit,price:Number(e.target.value)})} className="w-full bg-background border hairline px-3 py-2 text-sm"/>
            </label>
            <label><span className="text-eyebrow block mb-1">Category</span>
              <select value={edit.category_slug} onChange={(e)=>setEdit({...edit,category_slug:e.target.value})} className="w-full bg-background border hairline px-3 py-2 text-sm">
                <option value="women">Women</option><option value="men">Men</option><option value="accessories">Accessories</option>
              </select>
            </label>
          </div>
          <label className="flex items-center gap-2 text-sm"><input type="checkbox" checked={edit.is_active} onChange={(e)=>setEdit({...edit,is_active:e.target.checked})}/> Active</label>
          <label className="flex items-center gap-2 text-sm"><input type="checkbox" checked={edit.is_featured} onChange={(e)=>setEdit({...edit,is_featured:e.target.checked})}/> Featured</label>
          <div className="flex gap-3 pt-3">
            <button onClick={async()=>{ await saveFn({ data: edit }); setEdit(null); q.refetch(); }} className="btn-gold">Save</button>
            <button onClick={()=>setEdit(null)} className="btn-outline-dark">Cancel</button>
          </div>
        </aside>
      )}
    </div>
  );
}

function CategoriesTab() {
  const listFn = useServerFn(adminListCategories);
  const saveFn = useServerFn(adminSaveCategory);
  const q = useQuery({ queryKey: ["admin-categories"], queryFn: () => listFn() });
  const blank = { slug: "", name: "", description: "", image_url: "", sort_order: 0, is_active: true };
  const [edit, setEdit] = useState<any | null>(null);
  const [saving, setSaving] = useState(false);

  async function save() {
    setSaving(true);
    try { await saveFn({ data: edit }); setEdit(null); q.refetch(); }
    finally { setSaving(false); }
  }

  return (
    <div className="grid lg:grid-cols-[1fr_380px] gap-8">
      <div className="space-y-3">
        <button onClick={() => setEdit(blank)} className="btn-gold">+ New category</button>
        {(q.data ?? []).map((c: any) => (
          <button key={c.id} onClick={() => setEdit({ id: c.id, slug: c.slug, name: c.name, description: c.description ?? "", image_url: c.image_url ?? "", sort_order: c.sort_order, is_active: c.is_active })}
            className="w-full text-left border hairline p-4 flex justify-between items-center hover:border-foreground transition-colors">
            <span className="flex items-center gap-4">
              {c.image_url && <img src={c.image_url} className="h-10 w-10 object-cover" alt={c.name} />}
              <span>
                <span className="block text-sm font-medium">{c.name}</span>
                <span className="block text-xs text-muted-foreground">{c.slug} · order {c.sort_order}</span>
              </span>
            </span>
            <span className={`text-eyebrow text-xs ${c.is_active ? "text-accent" : "text-destructive"}`}>
              {c.is_active ? "Active" : "Hidden"}
            </span>
          </button>
        ))}
        {q.data?.length === 0 && (
          <div className="text-sm text-muted-foreground py-12 text-center border hairline">
            No categories yet. Add one to get started.
          </div>
        )}
      </div>

      {edit && (
        <aside className="border hairline p-6 space-y-4 sticky top-28 self-start">
          <h3 className="text-display text-xl">{edit.id ? "Edit category" : "New category"}</h3>
          {[["Name", "name"], ["Slug", "slug"], ["Image URL", "image_url"]].map(([l, k]) => (
            <label key={k} className="block">
              <span className="text-eyebrow block mb-1">{l}</span>
              <input value={edit[k] ?? ""} onChange={(e) => setEdit({ ...edit, [k]: e.target.value })}
                className="w-full bg-background border hairline px-3 py-2 text-sm" />
            </label>
          ))}
          <label className="block">
            <span className="text-eyebrow block mb-1">Description</span>
            <textarea value={edit.description ?? ""} onChange={(e) => setEdit({ ...edit, description: e.target.value })}
              rows={2} className="w-full bg-background border hairline px-3 py-2 text-sm" />
          </label>
          <label className="block">
            <span className="text-eyebrow block mb-1">Sort order</span>
            <input type="number" value={edit.sort_order} onChange={(e) => setEdit({ ...edit, sort_order: Number(e.target.value) })}
              className="w-full bg-background border hairline px-3 py-2 text-sm" />
          </label>
          {edit.image_url && (
            <img src={edit.image_url} alt="Preview" className="w-full aspect-video object-cover border hairline" />
          )}
          <label className="flex items-center gap-2 text-sm">
            <input type="checkbox" checked={edit.is_active} onChange={(e) => setEdit({ ...edit, is_active: e.target.checked })} />
            Active (visible on site)
          </label>
          <div className="flex gap-3 pt-2">
            <button onClick={save} disabled={saving} className="btn-gold">{saving ? "Saving…" : "Save"}</button>
            <button onClick={() => setEdit(null)} className="btn-outline-dark">Cancel</button>
          </div>
        </aside>
      )}
    </div>
  );
}

function ReturnsTab() {
  const listFn = useServerFn(adminListReturns);
  const updFn = useServerFn(adminUpdateReturn);
  const q = useQuery({ queryKey: ["admin-returns"], queryFn: () => listFn() });

  if (!q.data?.length) return <div className="text-sm text-muted-foreground py-12 text-center">No return requests yet.</div>;

  return (
    <div className="space-y-3">
      {(q.data ?? []).map((r: any) => (
        <div key={r.id} className="border hairline p-5">
          <div className="flex justify-between">
            <div>
              <div className="text-eyebrow text-muted-foreground">{r.orders?.order_number}</div>
              <div className="text-sm mt-1">{r.reason}</div>
            </div>
            <div className="flex gap-2 items-center">
              <select defaultValue={r.status} onChange={async(e)=>{ await updFn({ data: { id: r.id, status: e.target.value as any } }); q.refetch(); }}
                className="bg-background border hairline px-3 py-2 text-sm">
                {["requested","approved","rejected","picked_up","refunded"].map(s => <option key={s} value={s}>{s}</option>)}
              </select>
            </div>
          </div>
        </div>
      ))}
    </div>
  );
}
