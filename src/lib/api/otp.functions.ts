import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { createHash, randomBytes } from "crypto";

const phoneSchema = z.string().regex(/^\+?[1-9]\d{7,14}$/, "Invalid phone (E.164, e.g. +919876543210)");

function normalize(phone: string) {
  return phone.startsWith("+") ? phone : `+${phone}`;
}
function hash(otp: string, phone: string) {
  return createHash("sha256").update(`${otp}::${phone}::maison-otp`).digest("hex");
}
function synthEmail(phone: string) {
  return `${phone.replace(/[^\d]/g, "")}@phone.maison.local`;
}

async function sendTwilioSms(to: string, body: string) {
  const key = process.env.LOVABLE_API_KEY;
  const conn = process.env.TWILIO_API_KEY;
  if (!key || !conn) throw new Error("Twilio not configured");
  const res = await fetch("https://connector-gateway.lovable.dev/twilio/Messages.json", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${key}`,
      "X-Connection-Api-Key": conn,
      "Content-Type": "application/x-www-form-urlencoded",
    },
    body: new URLSearchParams({ To: to, Body: body, MessagingServiceSid: process.env.TWILIO_MESSAGING_SERVICE_SID ?? "" }).toString().replace(/MessagingServiceSid=&?/, ""),
  });
  if (!res.ok) {
    const t = await res.text();
    // Try with From fallback
    const from = process.env.TWILIO_FROM_NUMBER;
    if (from) {
      const r2 = await fetch("https://connector-gateway.lovable.dev/twilio/Messages.json", {
        method: "POST",
        headers: {
          Authorization: `Bearer ${key}`,
          "X-Connection-Api-Key": conn,
          "Content-Type": "application/x-www-form-urlencoded",
        },
        body: new URLSearchParams({ To: to, From: from, Body: body }),
      });
      if (!r2.ok) throw new Error(`Twilio: ${await r2.text()}`);
      return;
    }
    throw new Error(`Twilio: ${t}`);
  }
}

export const sendPhoneOtp = createServerFn({ method: "POST" })
  .inputValidator((data: { phone: string }) => ({ phone: phoneSchema.parse(data.phone) }))
  .handler(async ({ data }) => {
    const phone = normalize(data.phone);
    const otp = String(Math.floor(100000 + Math.random() * 900000));
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");

    // Rate limit: max 5 requests / 10 min
    const since = new Date(Date.now() - 10 * 60_000).toISOString();
    const { count } = await supabaseAdmin
      .from("phone_otps")
      .select("id", { count: "exact", head: true })
      .eq("phone", phone)
      .gte("created_at", since);
    if ((count ?? 0) >= 5) throw new Error("Too many requests. Try again in a few minutes.");

    await supabaseAdmin.from("phone_otps").insert({
      phone,
      otp_hash: hash(otp, phone),
      expires_at: new Date(Date.now() + 5 * 60_000).toISOString(),
    });

    try {
      await sendTwilioSms(phone, `Your Maison verification code is ${otp}. Valid for 5 minutes.`);
    } catch (e) {
      console.error("Twilio send failed:", e);
      // In dev / unconfigured Twilio, surface the OTP via logs so testing works
      console.warn(`[DEV OTP] ${phone} -> ${otp}`);
    }
    return { ok: true };
  });

export const verifyPhoneOtp = createServerFn({ method: "POST" })
  .inputValidator((data: { phone: string; otp: string; full_name?: string }) => ({
    phone: phoneSchema.parse(data.phone),
    otp: z.string().regex(/^\d{6}$/).parse(data.otp),
    full_name: z.string().max(120).optional().parse(data.full_name),
  }))
  .handler(async ({ data }) => {
    const phone = normalize(data.phone);
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");

    const { data: row } = await supabaseAdmin
      .from("phone_otps")
      .select("*")
      .eq("phone", phone)
      .eq("consumed", false)
      .gt("expires_at", new Date().toISOString())
      .order("created_at", { ascending: false })
      .limit(1)
      .maybeSingle();

    if (!row) throw new Error("Code expired or not found. Request a new code.");
    if (row.attempts >= 5) throw new Error("Too many attempts. Request a new code.");

    if (row.otp_hash !== hash(data.otp, phone)) {
      await supabaseAdmin.from("phone_otps").update({ attempts: row.attempts + 1 }).eq("id", row.id);
      throw new Error("Incorrect code");
    }

    await supabaseAdmin.from("phone_otps").update({ consumed: true }).eq("id", row.id);

    const email = synthEmail(phone);
    const password = randomBytes(24).toString("base64url");

    // Find existing user by email
    // Use listUsers with filter (admin API)
    const { data: existing } = await supabaseAdmin.auth.admin.listUsers({ page: 1, perPage: 200 });
    const found = existing?.users.find((u) => u.email === email);

    let userId: string;
    if (found) {
      userId = found.id;
      await supabaseAdmin.auth.admin.updateUserById(userId, { password, email_confirm: true });
    } else {
      const { data: created, error: cerr } = await supabaseAdmin.auth.admin.createUser({
        email,
        password,
        email_confirm: true,
        user_metadata: { phone, full_name: data.full_name ?? "" },
      });
      if (cerr || !created.user) throw new Error(cerr?.message ?? "Failed to create user");
      userId = created.user.id;
    }

    // Upsert profile with phone
    await supabaseAdmin.from("profiles").upsert({
      id: userId,
      phone,
      email,
      full_name: data.full_name ?? null,
    });

    return { email, password };
  });
