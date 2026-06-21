
-- 1. Add 'seller' to app_role enum
ALTER TYPE public.app_role ADD VALUE IF NOT EXISTS 'seller';

-- 2. SELLERS table
CREATE TABLE public.sellers (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL UNIQUE REFERENCES auth.users(id) ON DELETE CASCADE,
  brand_name TEXT NOT NULL,
  slug TEXT NOT NULL UNIQUE,
  logo_url TEXT,
  description TEXT,
  gst_number TEXT,
  pan_number TEXT,
  pickup_address JSONB,
  bank_account JSONB,
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending','active','suspended','rejected')),
  commission_rate NUMERIC(5,2) NOT NULL DEFAULT 5.00,
  rating_avg NUMERIC(3,2) DEFAULT 0,
  rating_count INTEGER DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

GRANT SELECT ON public.sellers TO anon;
GRANT SELECT, INSERT, UPDATE ON public.sellers TO authenticated;
GRANT ALL ON public.sellers TO service_role;

ALTER TABLE public.sellers ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can view active sellers" ON public.sellers
  FOR SELECT USING (status = 'active' OR auth.uid() = user_id OR public.has_role(auth.uid(),'admin'));
CREATE POLICY "Users can create own seller" ON public.sellers
  FOR INSERT TO authenticated WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Sellers update own profile" ON public.sellers
  FOR UPDATE TO authenticated USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Admins manage all sellers" ON public.sellers
  FOR ALL TO authenticated USING (public.has_role(auth.uid(),'admin')) WITH CHECK (public.has_role(auth.uid(),'admin'));

CREATE TRIGGER trg_sellers_updated BEFORE UPDATE ON public.sellers
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- 3. SUBSCRIPTION PLANS (catalog of tiers)
CREATE TABLE public.subscription_plans (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  code TEXT NOT NULL UNIQUE,
  name TEXT NOT NULL,
  description TEXT,
  price_monthly INTEGER NOT NULL DEFAULT 0, -- in paise
  product_limit INTEGER, -- null = unlimited
  commission_rate NUMERIC(5,2) NOT NULL DEFAULT 5.00,
  features JSONB NOT NULL DEFAULT '[]'::jsonb,
  is_active BOOLEAN NOT NULL DEFAULT TRUE,
  sort_order INTEGER NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

GRANT SELECT ON public.subscription_plans TO anon, authenticated;
GRANT ALL ON public.subscription_plans TO service_role;

ALTER TABLE public.subscription_plans ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can view active plans" ON public.subscription_plans
  FOR SELECT USING (is_active OR public.has_role(auth.uid(),'admin'));
CREATE POLICY "Admins manage plans" ON public.subscription_plans
  FOR ALL TO authenticated USING (public.has_role(auth.uid(),'admin')) WITH CHECK (public.has_role(auth.uid(),'admin'));

CREATE TRIGGER trg_plans_updated BEFORE UPDATE ON public.subscription_plans
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- 4. SELLER SUBSCRIPTIONS
CREATE TABLE public.seller_subscriptions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  seller_id UUID NOT NULL REFERENCES public.sellers(id) ON DELETE CASCADE,
  plan_id UUID NOT NULL REFERENCES public.subscription_plans(id),
  status TEXT NOT NULL DEFAULT 'active' CHECK (status IN ('active','canceled','past_due','trialing')),
  current_period_start TIMESTAMPTZ NOT NULL DEFAULT now(),
  current_period_end TIMESTAMPTZ NOT NULL DEFAULT (now() + interval '30 days'),
  razorpay_subscription_id TEXT,
  cancel_at_period_end BOOLEAN NOT NULL DEFAULT FALSE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE UNIQUE INDEX one_active_sub_per_seller
  ON public.seller_subscriptions(seller_id) WHERE status IN ('active','trialing','past_due');

GRANT SELECT, INSERT, UPDATE ON public.seller_subscriptions TO authenticated;
GRANT ALL ON public.seller_subscriptions TO service_role;

ALTER TABLE public.seller_subscriptions ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Sellers view own subscription" ON public.seller_subscriptions
  FOR SELECT TO authenticated USING (
    EXISTS (SELECT 1 FROM public.sellers s WHERE s.id = seller_id AND s.user_id = auth.uid())
    OR public.has_role(auth.uid(),'admin')
  );
CREATE POLICY "Sellers create own subscription" ON public.seller_subscriptions
  FOR INSERT TO authenticated WITH CHECK (
    EXISTS (SELECT 1 FROM public.sellers s WHERE s.id = seller_id AND s.user_id = auth.uid())
  );
CREATE POLICY "Sellers update own subscription" ON public.seller_subscriptions
  FOR UPDATE TO authenticated USING (
    EXISTS (SELECT 1 FROM public.sellers s WHERE s.id = seller_id AND s.user_id = auth.uid())
    OR public.has_role(auth.uid(),'admin')
  );

CREATE TRIGGER trg_seller_subs_updated BEFORE UPDATE ON public.seller_subscriptions
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- 5. Attach seller_id to products (nullable for legacy/admin-owned items)
ALTER TABLE public.products
  ADD COLUMN IF NOT EXISTS seller_id UUID REFERENCES public.sellers(id) ON DELETE SET NULL;

CREATE INDEX IF NOT EXISTS idx_products_seller ON public.products(seller_id);

-- Sellers can manage their own products
CREATE POLICY "Sellers manage own products" ON public.products
  FOR ALL TO authenticated
  USING (
    seller_id IS NOT NULL AND EXISTS (
      SELECT 1 FROM public.sellers s WHERE s.id = products.seller_id AND s.user_id = auth.uid()
    )
  )
  WITH CHECK (
    seller_id IS NOT NULL AND EXISTS (
      SELECT 1 FROM public.sellers s WHERE s.id = products.seller_id AND s.user_id = auth.uid()
    )
  );

-- 6. Seed the 3 subscription plans
INSERT INTO public.subscription_plans (code, name, description, price_monthly, product_limit, commission_rate, features, sort_order)
VALUES
  ('free', 'Starter', 'Perfect to test the waters', 0, 10, 8.00,
    '["List up to 10 products","Basic seller dashboard","Email support","8% platform commission"]'::jsonb, 1),
  ('pro', 'Pro', 'For growing brands', 49900, 100, 5.00,
    '["List up to 100 products","Advanced analytics","Priority support","5% platform commission","Promoted listings (3/mo)"]'::jsonb, 2),
  ('elite', 'Elite', 'For established sellers', 199900, NULL, 2.00,
    '["Unlimited products","Premium analytics + AI insights","Dedicated account manager","2% platform commission","Featured on homepage","Custom storefront"]'::jsonb, 3)
ON CONFLICT (code) DO NOTHING;
