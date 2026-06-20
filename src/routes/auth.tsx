import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { ArrowRight, Loader2 } from "lucide-react";
import { useServerFn } from "@tanstack/react-start";
import { sendPhoneOtp, verifyPhoneOtp } from "@/lib/api/otp.functions";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/lib/auth";

export const Route = createFileRoute("/auth")({
  head: () => ({
    meta: [
      { title: "Sign in — Maison" },
      { name: "description", content: "Sign in to Maison with a one-time code sent to your phone." },
      { name: "robots", content: "noindex" },
    ],
  }),
  component: AuthPage,
});

function AuthPage() {
  const nav = useNavigate();
  const { user, loading } = useAuth();
  const [step, setStep] = useState<"phone" | "otp">("phone");
  const [phone, setPhone] = useState("+91");
  const [fullName, setFullName] = useState("");
  const [otp, setOtp] = useState("");
  const [err, setErr] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  const sendFn = useServerFn(sendPhoneOtp);
  const verifyFn = useServerFn(verifyPhoneOtp);

  useEffect(() => {
    if (!loading && user) nav({ to: "/account" });
  }, [user, loading, nav]);

  async function send() {
    setErr(null); setBusy(true);
    try {
      await sendFn({ data: { phone } });
      setStep("otp");
    } catch (e: any) { setErr(e.message ?? "Could not send code"); }
    finally { setBusy(false); }
  }

  async function verify() {
    setErr(null); setBusy(true);
    try {
      const { email, password } = await verifyFn({ data: { phone, otp, full_name: fullName || undefined } });
      const { error } = await supabase.auth.signInWithPassword({ email, password });
      if (error) throw error;
      nav({ to: "/account" });
    } catch (e: any) { setErr(e.message ?? "Could not verify"); }
    finally { setBusy(false); }
  }

  return (
    <main className="min-h-[80vh] grid place-items-center px-6 py-16">
      <div className="w-full max-w-md">
        <div className="text-eyebrow text-accent text-center">Maison</div>
        <h1 className="text-display text-4xl text-center mt-3">{step === "phone" ? "Sign in" : "Enter code"}</h1>
        <p className="text-center text-sm text-muted-foreground mt-3">
          {step === "phone" ? "A one-time code will be sent to your phone." : `We sent a 6-digit code to ${phone}.`}
        </p>

        <div className="mt-10 space-y-5">
          {step === "phone" ? (
            <>
              <div>
                <label className="text-eyebrow block mb-2">Mobile number</label>
                <input value={phone} onChange={(e) => setPhone(e.target.value)} placeholder="+919876543210"
                  className="w-full bg-background border hairline px-4 py-3 text-sm focus:outline-none focus:border-foreground" />
                <div className="text-[11px] text-muted-foreground mt-2">Include country code, e.g. +91 for India.</div>
              </div>
              <div>
                <label className="text-eyebrow block mb-2">Full name <span className="lowercase text-muted-foreground">(new accounts)</span></label>
                <input value={fullName} onChange={(e) => setFullName(e.target.value)} placeholder="Optional"
                  className="w-full bg-background border hairline px-4 py-3 text-sm focus:outline-none focus:border-foreground" />
              </div>
              {err && <div className="text-xs text-destructive">{err}</div>}
              <button onClick={send} disabled={busy} className="btn-gold w-full">
                {busy ? <Loader2 className="h-4 w-4 animate-spin" /> : <>Send code <ArrowRight className="h-4 w-4" /></>}
              </button>
            </>
          ) : (
            <>
              <div>
                <label className="text-eyebrow block mb-2">6-digit code</label>
                <input value={otp} onChange={(e) => setOtp(e.target.value.replace(/\D/g, "").slice(0, 6))}
                  inputMode="numeric" autoFocus placeholder="••••••"
                  className="w-full bg-background border hairline px-4 py-3 text-center text-2xl tracking-[0.6em] focus:outline-none focus:border-foreground" />
              </div>
              {err && <div className="text-xs text-destructive">{err}</div>}
              <button onClick={verify} disabled={busy || otp.length !== 6} className="btn-gold w-full">
                {busy ? <Loader2 className="h-4 w-4 animate-spin" /> : <>Verify & continue <ArrowRight className="h-4 w-4" /></>}
              </button>
              <button onClick={() => { setStep("phone"); setOtp(""); setErr(null); }} className="text-xs text-muted-foreground link-underline mx-auto block">
                Change number
              </button>
            </>
          )}
        </div>
      </div>
    </main>
  );
}
