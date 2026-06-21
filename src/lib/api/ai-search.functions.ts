import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { createClient } from "@supabase/supabase-js";

/**
 * AI search: uses Lovable AI Gateway to translate a natural-language
 * query into filters, then runs them against the products table.
 */
export const aiSearchProducts = createServerFn({ method: "POST" })
  .inputValidator((d) => z.object({ q: z.string().trim().min(1).max(200) }).parse(d))
  .handler(async ({ data }) => {
    const sb = createClient(process.env.SUPABASE_URL!, process.env.SUPABASE_PUBLISHABLE_KEY!, {
      auth: { persistSession: false, autoRefreshToken: false },
    });

    let filters: {
      keywords: string[];
      max_price?: number;
      min_price?: number;
      category?: string;
    } = { keywords: [data.q] };

    const apiKey = process.env.LOVABLE_API_KEY;
    if (apiKey) {
      try {
        const res = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
          method: "POST",
          headers: { Authorization: `Bearer ${apiKey}`, "Content-Type": "application/json" },
          body: JSON.stringify({
            model: "google/gemini-2.5-flash",
            messages: [
              {
                role: "system",
                content:
                  "Extract product search filters from the user's natural language query. Reply with JSON only: {\"keywords\":string[],\"max_price\":number?,\"min_price\":number?,\"category\":\"women|men|accessories\"?}. Prices are in INR.",
              },
              { role: "user", content: data.q },
            ],
            response_format: { type: "json_object" },
          }),
        });
        if (res.ok) {
          const j = await res.json();
          const txt = j?.choices?.[0]?.message?.content;
          if (txt) {
            const parsed = JSON.parse(txt);
            filters = {
              keywords: Array.isArray(parsed.keywords) && parsed.keywords.length ? parsed.keywords : [data.q],
              max_price: typeof parsed.max_price === "number" ? parsed.max_price : undefined,
              min_price: typeof parsed.min_price === "number" ? parsed.min_price : undefined,
              category: parsed.category,
            };
          }
        }
      } catch {
        /* fall back to keyword */
      }
    }

    let q = sb
      .from("products")
      .select("id, slug, title, price, compare_at_price, product_images(url, position)")
      .eq("is_published", true)
      .limit(40);

    const orParts = filters.keywords
      .filter(Boolean)
      .slice(0, 5)
      .map((k) => `title.ilike.%${k.replace(/[%,()]/g, "")}%,description.ilike.%${k.replace(/[%,()]/g, "")}%`)
      .join(",");
    if (orParts) q = q.or(orParts);
    if (filters.max_price) q = q.lte("price", filters.max_price * 100);
    if (filters.min_price) q = q.gte("price", filters.min_price * 100);

    const { data: rows, error } = await q;
    if (error) throw new Error(error.message);
    return { filters, results: rows ?? [] };
  });
