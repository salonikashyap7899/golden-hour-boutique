import { createContext, useContext, useEffect, useMemo, useState, type ReactNode } from "react";

export type CartItem = {
  id: string;
  slug: string;
  name: string;
  brand: string;
  image: string;
  price: number;
  size: string;
  color: string;
  qty: number;
};

type CartCtx = {
  items: CartItem[];
  add: (item: Omit<CartItem, "qty">, qty?: number) => void;
  remove: (key: string) => void;
  setQty: (key: string, qty: number) => void;
  clear: () => void;
  count: number;
  subtotal: number;
};

const Ctx = createContext<CartCtx | null>(null);
const KEY = "maison.cart.v1";

const keyOf = (i: Pick<CartItem, "id" | "size" | "color">) => `${i.id}::${i.size}::${i.color}`;

export function CartProvider({ children }: { children: ReactNode }) {
  const [items, setItems] = useState<CartItem[]>([]);
  const [ready, setReady] = useState(false);

  useEffect(() => {
    try {
      const raw = typeof window !== "undefined" ? window.localStorage.getItem(KEY) : null;
      if (raw) setItems(JSON.parse(raw));
    } catch {
      /* ignore */
    }
    setReady(true);
  }, []);

  useEffect(() => {
    if (!ready) return;
    try { window.localStorage.setItem(KEY, JSON.stringify(items)); } catch { /* ignore */ }
  }, [items, ready]);

  const value = useMemo<CartCtx>(() => ({
    items,
    add: (item, qty = 1) => {
      setItems((prev) => {
        const k = keyOf(item);
        const existing = prev.find((p) => keyOf(p) === k);
        if (existing) return prev.map((p) => (keyOf(p) === k ? { ...p, qty: p.qty + qty } : p));
        return [...prev, { ...item, qty }];
      });
    },
    remove: (k) => setItems((prev) => prev.filter((p) => keyOf(p) !== k)),
    setQty: (k, qty) =>
      setItems((prev) => prev.map((p) => (keyOf(p) === k ? { ...p, qty: Math.max(1, qty) } : p))),
    clear: () => setItems([]),
    count: items.reduce((n, i) => n + i.qty, 0),
    subtotal: items.reduce((n, i) => n + i.qty * i.price, 0),
  }), [items]);

  return <Ctx.Provider value={value}>{children}</Ctx.Provider>;
}

export function useCart() {
  const v = useContext(Ctx);
  if (!v) throw new Error("useCart must be used inside CartProvider");
  return v;
}

export const cartKey = keyOf;
