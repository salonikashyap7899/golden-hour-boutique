import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { createClient } from "@supabase/supabase-js";

function pub() {
  return createClient(process.env.SUPABASE_URL!, process.env.SUPABASE_PUBLISHABLE_KEY!, {
    auth: { persistSession: false, autoRefreshToken: false },
  });
}

export type PublicProduct = {
  id: string;
  slug: string;
  name: string;
  brand: string;
  category: "women" | "men" | "accessories";
  price: number;
  compareAt?: number;
  image: string;
  hoverImage?: string;
  rating: number;
  reviews: number;
  sizes: string[];
  colors: { name: string; hex: string }[];
  fabric: string;
  care: string;
  fit: string;
  description: string;
  isNew?: boolean;
  bestSeller?: boolean;
  fromDb?: boolean;
};

const FALLBACK = "/products/p1.jpg";

function mapRow(row: any): PublicProduct {
  const imgs = (row.product_images ?? []).sort((a: any, b: any) => (a.sort_order ?? 0) - (b.sort_order ?? 0));
  const catSlug = (row.categories?.slug as "women" | "men" | "accessories") || "women";
  return {
    id: row.id,
    slug: row.slug,
    name: row.title,
    brand: row.brand || "Maison",
    category: catSlug,
    price: Number(row.price),
    compareAt: row.compare_at_price ? Number(row.compare_at_price) : undefined,
    image: imgs[0]?.url ?? FALLBACK,
    hoverImage: imgs[1]?.url,
    rating: Number(row.rating_avg ?? 0),
    reviews: Number(row.rating_count ?? 0),
    sizes: catSlug === "accessories" ? ["One Size"] : ["XS", "S", "M", "L", "XL"],
    colors: [{ name: "Noir", hex: "#0A0A0A" }, { name: "Ivory", hex: "#FAF7F2" }],
    fabric: row.material || "Premium",
    care: "Care per label",
    fit: "True to size",
    description: row.description || row.title,
    isNew: row.created_at ? (Date.now() - new Date(row.created_at).getTime()) < 1000 * 60 * 60 * 24 * 60 : false,
    bestSeller: !!row.is_featured,
    fromDb: true,
  };
}

export const listPublicProducts = createServerFn({ method: "GET" }).handler(async () => {
  const sb = pub();
  const { data, error } = await sb
    .from("products")
    .select("id, slug, title, description, brand, material, price, compare_at_price, is_featured, rating_avg, rating_count, created_at, product_images(url, sort_order), categories(slug)")
    .eq("is_active", true)
    .order("created_at", { ascending: false });
  if (error) throw new Error(error.message);
  return (data ?? []).map(mapRow);
});

export const getPublicProductBySlug = createServerFn({ method: "GET" })
  .inputValidator((d) => z.object({ slug: z.string() }).parse(d))
  .handler(async ({ data }) => {
    const sb = pub();
    const { data: row } = await sb
      .from("products")
      .select("id, slug, title, description, brand, material, price, compare_at_price, is_featured, rating_avg, rating_count, created_at, product_images(url, sort_order), categories(slug)")
      .eq("slug", data.slug)
      .eq("is_active", true)
      .maybeSingle();
    return row ? mapRow(row) : null;
  });
