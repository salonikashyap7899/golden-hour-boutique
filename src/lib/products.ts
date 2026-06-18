import p1 from "@/assets/p1.jpg";
import p2 from "@/assets/p2.jpg";
import p3 from "@/assets/p3.jpg";
import p4 from "@/assets/p4.jpg";
import p5 from "@/assets/p5.jpg";
import p6 from "@/assets/p6.jpg";
import p7 from "@/assets/p7.jpg";
import p8 from "@/assets/p8.jpg";

export type Category = "women" | "men" | "accessories";

export type Product = {
  id: string;
  slug: string;
  name: string;
  brand: string;
  category: Category;
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
};

export const PRODUCTS: Product[] = [
  {
    id: "1", slug: "champagne-silk-gown", name: "Aurelia Silk Gown", brand: "Maison Atelier",
    category: "women", price: 48900, compareAt: 62000, image: p1, hoverImage: p6,
    rating: 4.9, reviews: 128, sizes: ["XS", "S", "M", "L"],
    colors: [{ name: "Champagne", hex: "#C9A96E" }, { name: "Ivory", hex: "#FAF7F2" }],
    fabric: "100% Mulberry Silk", care: "Dry clean only", fit: "True to size, slim through waist",
    description: "An exquisite floor-length silk gown with hand-finished pleating and a fluid bias-cut skirt. Designed for moments that demand quiet command.",
    isNew: true, bestSeller: true,
  },
  {
    id: "2", slug: "noir-cashmere-turtleneck", name: "Noir Cashmere Turtleneck", brand: "Maison Atelier",
    category: "women", price: 18500, image: p2, hoverImage: p3,
    rating: 4.8, reviews: 342, sizes: ["XS", "S", "M", "L", "XL"],
    colors: [{ name: "Midnight", hex: "#0A0A0A" }, { name: "Ivory", hex: "#FAF7F2" }],
    fabric: "100% Grade-A Mongolian Cashmere", care: "Hand wash cold", fit: "Relaxed, sized down for slim fit",
    description: "A meditation on softness. Spun from the season's finest cashmere with a hand-loomed turtleneck that drapes with quiet weight.",
    bestSeller: true,
  },
  {
    id: "3", slug: "camel-trench", name: "Atelier Camel Trench", brand: "Maison Atelier",
    category: "men", price: 64000, compareAt: 78000, image: p3,
    rating: 4.9, reviews: 89, sizes: ["S", "M", "L", "XL"],
    colors: [{ name: "Camel", hex: "#B08A5B" }],
    fabric: "Italian Wool Gabardine", care: "Dry clean only", fit: "Tailored, true to size",
    description: "A foundational silhouette in heritage wool gabardine, finished with horn buttons and a hand-stitched storm flap.",
    isNew: true,
  },
  {
    id: "4", slug: "gilded-chain-necklace", name: "Gilded Chain Necklace", brand: "Maison Joaillerie",
    category: "accessories", price: 22500, image: p4, hoverImage: p7,
    rating: 4.7, reviews: 214, sizes: ["One Size"],
    colors: [{ name: "Yellow Gold", hex: "#C9A96E" }, { name: "Rose Gold", hex: "#D4A0A0" }],
    fabric: "18K Gold Vermeil", care: "Polish with soft cloth", fit: "42cm with 5cm extender",
    description: "An hour-of-flame chain in 18K gold vermeil. Heavy enough to feel; restrained enough to wear daily.",
    bestSeller: true,
  },
  {
    id: "5", slug: "caramel-tote", name: "Sienna Structured Tote", brand: "Maison Pelle",
    category: "accessories", price: 39800, compareAt: 49000, image: p5,
    rating: 4.8, reviews: 156, sizes: ["One Size"],
    colors: [{ name: "Caramel", hex: "#9A6A3A" }, { name: "Noir", hex: "#0A0A0A" }],
    fabric: "Full-grain Italian leather", care: "Wipe with damp cloth, condition seasonally", fit: "32cm × 26cm × 14cm",
    description: "An everyday architecture in vegetable-tanned Italian leather. Hand-burnished edges and brass furniture that ages with grace.",
    isNew: true,
  },
  {
    id: "6", slug: "ivory-silk-slip", name: "Ivory Silk Slip Dress", brand: "Maison Atelier",
    category: "women", price: 24500, image: p6, hoverImage: p1,
    rating: 4.7, reviews: 98, sizes: ["XS", "S", "M", "L"],
    colors: [{ name: "Ivory", hex: "#FAF7F2" }, { name: "Champagne", hex: "#C9A96E" }],
    fabric: "Sand-washed silk crêpe", care: "Dry clean recommended", fit: "Bias-cut, true to size",
    description: "The slip, perfected. Sand-washed for a softer hand and cut on the bias to move like water.",
  },
  {
    id: "7", slug: "rose-gold-watch", name: "Heritage Rose Gold Watch", brand: "Maison Horlogerie",
    category: "accessories", price: 84500, image: p7,
    rating: 4.9, reviews: 67, sizes: ["38mm", "42mm"],
    colors: [{ name: "Rose Gold / Noir", hex: "#D4A0A0" }],
    fabric: "Rose gold case, alligator strap", care: "Service every 5 years", fit: "Sapphire crystal, 50m water resistant",
    description: "Mechanical movement housed in a 38mm rose gold case. Restrained dial, applied indices, a quiet companion.",
    bestSeller: true,
  },
  {
    id: "8", slug: "noir-silk-clutch", name: "Noir Silk Evening Clutch", brand: "Maison Pelle",
    category: "accessories", price: 19800, image: p8,
    rating: 4.6, reviews: 73, sizes: ["One Size"],
    colors: [{ name: "Noir", hex: "#0A0A0A" }, { name: "Champagne", hex: "#C9A96E" }],
    fabric: "Duchesse silk satin", care: "Spot clean only", fit: "26cm × 14cm",
    description: "Ruched silk satin with a sculpted gold clasp. Designed for the late hours.",
  },
];

export const formatINR = (n: number) =>
  new Intl.NumberFormat("en-IN", { style: "currency", currency: "INR", maximumFractionDigits: 0 }).format(n);

export const findProduct = (slug: string) => PRODUCTS.find((p) => p.slug === slug);
