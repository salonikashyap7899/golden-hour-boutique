import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useState } from "react";
import { useServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { createSeller } from "@/lib/api/sellers.functions";
import { useAuth } from "@/lib/auth";
import { ArrowRight, Store, TrendingUp, Sparkles } from "lucide-react";

export const Route = createFileRoute("/sell")({
  validateSearch: (s: Record<string, unknown>) =>
    z.object({ plan: z.enum(["free", "pro", "elite"]).default("free") }).parse(s),
  head: () => ({
    meta: [
      { title: "Sell on Maison — Become a seller" },
      { name: "description", content: "Join Maison as a seller. Reach customers who care about craft." },
    ],
  }),
  component: SellPage,
});

function SellPage() {
  const { plan } = Route.useSearch();
  const { user } = useAuth();
  const nav = useNavigate();
  const create = useServerFn(createSeller);
  const [form, setForm] = useState({ brand_name: "", description: "", gst_number: "", pan_number: "" });
  const [err, setErr] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  async function submit() {
    setErr(null);
    if (!user) {
      nav({ to: "/auth" });
      return;
    }
    setLoading(true);
    try {
      await create({ data: { ...form, plan_code: plan } });
      nav({ to: "/seller" });
    } catch (e: any) {
      setErr(e.message);
    } finally {
      setLoading(false);
    }
  }

  return (
    <main>
      <section className="relative bg-foreground text-background py-24 md:py-32 overflow-hidden">
        <div className="absolute inset-0 opacity-30" style={{ background: "radial-gradient(circle at 20% 30%, var(--gold) 0%, transparent 50%)" }} />
        <div className="mx-auto max-w-[1400px] px-6 lg:px-10 relative">
          <div className="max-w-2xl animate-fade-up">
            <div className="text-eyebrow text-accent">For brands & artisans</div>
            <h1 className="text-display text-5xl md:text-7xl mt-5">
              Sell to customers <br /> who <em className="not-italic text-accent">care about craft.</em>
            </h1>
            <p className="mt-6 max-w-md text-[15px] leading-relaxed text-background/80">
              List your collection on Maison. We handle payments, shipping logistics support, and a curated audience.
              Keep up to 98% of every sale.
            </p>
          </div>
        </div>
      </section>

      <section className="mx-auto max-w-[1400px] px-6 lg:px-10 py-20 grid md:grid-cols-3 gap-8">
        {[
          { i: Store, t: "Beautiful storefront", s: "Your own branded page on Maison. Built for the way luxury shops." },
          { i: TrendingUp, t: "Tools that pay back", s: "Analytics, promoted listings, AI insights — included from Pro up." },
          { i: Sparkles, t: "Lowest commission in luxury", s: "2% on Elite. Compare to 15–25% on department stores." },
        ].map(({ i: Icon, t, s }, idx) => (
          <div key={t} style={{ animationDelay: `${idx * 80}ms` }} className="animate-fade-up border hairline p-8">
            <Icon className="h-7 w-7 text-accent" />
            <h3 className="text-display text-2xl mt-5">{t}</h3>
            <p className="mt-3 text-sm text-muted-foreground leading-relaxed">{s}</p>
          </div>
        ))}
      </section>

      <section className="bg-secondary py-20">
        <div className="mx-auto max-w-2xl px-6 lg:px-10">
          <div className="text-eyebrow text-accent">Apply · {plan}</div>
          <h2 className="text-display text-4xl mt-3">Open your storefront</h2>
          <p className="mt-3 text-sm text-muted-foreground">
            You picked the <strong className="capitalize text-foreground">{plan}</strong> plan.{" "}
            <Link to="/plans" className="link-underline">Change plan</Link>
          </p>

          <div className="mt-10 space-y-5">
            <Field label="Brand name *">
              <input className="input-luxe" value={form.brand_name} onChange={(e) => setForm({ ...form, brand_name: e.target.value })} placeholder="e.g. Atelier Banaras" />
            </Field>
            <Field label="What do you make?">
              <textarea className="input-luxe min-h-[100px]" value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} placeholder="Tell us about your craft, materials, and what makes you different…" />
            </Field>
            <div className="grid grid-cols-2 gap-4">
              <Field label="GST number"><input className="input-luxe" value={form.gst_number} onChange={(e) => setForm({ ...form, gst_number: e.target.value })} /></Field>
              <Field label="PAN number"><input className="input-luxe" value={form.pan_number} onChange={(e) => setForm({ ...form, pan_number: e.target.value })} /></Field>
            </div>
            {err && <div className="text-sm text-destructive">{err}</div>}
            <button onClick={submit} disabled={loading || !form.brand_name} className="btn-gold disabled:opacity-50">
              {loading ? "Opening storefront…" : <>Open my storefront <ArrowRight className="h-4 w-4" /></>}
            </button>
          </div>
        </div>
      </section>

      <style>{`.input-luxe{width:100%;background:var(--background);border:1px solid var(--border);padding:.75rem 1rem;font-size:.9rem;}.input-luxe:focus{outline:none;border-color:var(--foreground);}`}</style>
    </main>
  );
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <label className="block">
      <span className="text-eyebrow text-muted-foreground block mb-2">{label}</span>
      {children}
    </label>
  );
}
