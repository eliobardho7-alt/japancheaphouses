# 🚀 Yama Vista - Complete Setup Guide

This guide walks you through setting up everything: Stripe payments, email notifications, and the admin dashboard.

---

## What You Now Have

✅ **Admin Dashboard** at `/admin` — Add/edit blogs and listings, view bookings, read messages
✅ **Stripe Subscriptions** — Real $5/month checkout flow
✅ **Email Notifications** — Get emails when someone books or contacts you
✅ **Separated Blogs vs Listings** — Two distinct sections

---

## Step 1: Set Up Resend (Email Notifications) - 5 minutes

This makes you get emails when customers book or submit forms.

### 1.1 Create Resend Account
1. Go to **https://resend.com**
2. Click **"Sign Up"** (free)
3. Verify your email

### 1.2 Get Your API Key
1. Once logged in, click **"API Keys"** in sidebar
2. Click **"Create API Key"**
3. Name it: `Yama Vista`
4. Click **"Add"**
5. **Copy the key** (starts with `re_...`) — save it somewhere safe!

### 1.3 Add to Vercel
1. Go to your Vercel project: **https://vercel.com/dashboard**
2. Click on `japancheaphouses` project
3. Click **Settings → Environment Variables**
4. Add new variable:
   - **Name:** `RESEND_API_KEY`
   - **Value:** Paste your `re_...` key
   - **Environment:** All
5. Click **Save**
6. Go to **Deployments** → click ••• on latest → **Redeploy**

✅ **Now you'll get emails when customers book or submit forms!**

---

## Step 2: Set Up Stripe (Payments) - 10 minutes

### 2.1 Create Stripe Account
1. Go to **https://stripe.com**
2. Sign up (free)
3. **Stay in Test Mode** (toggle at top-right) for now

### 2.2 Get API Keys
1. In Stripe dashboard, click **Developers → API Keys**
2. Copy these two values:
   - **Publishable key** (starts with `pk_test_...`)
   - **Secret key** (starts with `sk_test_...`)

### 2.3 Create Your $5/Month Product
1. In Stripe dashboard, click **Products → Add Product**
2. Fill in:
   - **Name:** Yama Vista Community
   - **Description:** Monthly access to premium listings and community
3. Under **Pricing**:
   - **Price:** $5.00
   - **Billing period:** Monthly
   - **Recurring** ✓
4. Click **Save**
5. On the product page, **copy the Price ID** (starts with `price_...`)

### 2.4 Add to Vercel
Go to Vercel → Settings → Environment Variables, add:
- `STRIPE_SECRET_KEY` = your `sk_test_...` key
- `NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY` = your `pk_test_...` key
- `STRIPE_PRICE_ID` = your `price_...` ID

Then redeploy.

### 2.5 Set Up Webhook (After deploy)
1. In Stripe dashboard: **Developers → Webhooks → Add endpoint**
2. **Endpoint URL:** `https://japancheaphouses.com/api/stripe/webhook`
3. **Events to send:**
   - `checkout.session.completed`
   - `customer.subscription.updated`
   - `customer.subscription.deleted`
4. Click **Add Endpoint**
5. Click on it, copy the **Signing Secret** (starts with `whsec_...`)
6. Add to Vercel: `STRIPE_WEBHOOK_SECRET` = your `whsec_...`
7. Redeploy

### 2.6 Going Live
When ready for real payments:
1. In Stripe, complete account verification
2. Switch to **Live Mode** (toggle off Test Mode)
3. Generate new keys (live ones start with `pk_live_...` and `sk_live_...`)
4. Update environment variables in Vercel with live keys

---

## Step 3: Set Up Supabase (Database & Admin Dashboard) - 15 minutes

This stores all your data and powers the admin dashboard.

### 3.1 Create Project
1. Go to **https://supabase.com** and sign up (free)
2. Click **New Project**
3. Name it: `yama-vista`
4. Set a **strong database password** (save it!)
5. Choose region: **Northeast Asia (Tokyo)**
6. Click **Create new project**
7. Wait ~2 minutes

### 3.2 Get API Keys
1. Once ready, click **Settings → API**
2. Copy these:
   - **Project URL** (https://xxxxx.supabase.co)
   - **anon public** key
   - **service_role** key (keep secret!)

### 3.3 Set Up Database
1. Click **SQL Editor** in sidebar
2. Click **New Query**
3. Paste this entire SQL and click **Run**:

```sql
-- Blog posts
CREATE TABLE blog_posts (
  id BIGSERIAL PRIMARY KEY,
  slug TEXT UNIQUE NOT NULL,
  title TEXT NOT NULL,
  category TEXT,
  excerpt TEXT,
  content TEXT,
  cover_image TEXT,
  is_premium BOOLEAN DEFAULT FALSE,
  author TEXT DEFAULT 'Elio Bardho',
  date DATE DEFAULT CURRENT_DATE,
  read_time TEXT,
  tags TEXT[],
  created_at TIMESTAMP DEFAULT NOW()
);

-- Listings
CREATE TABLE listings (
  id BIGSERIAL PRIMARY KEY,
  slug TEXT UNIQUE NOT NULL,
  title TEXT NOT NULL,
  location TEXT,
  price TEXT,
  price_usd TEXT,
  property_type TEXT,
  land_included BOOLEAN DEFAULT TRUE,
  excerpt TEXT,
  content TEXT,
  cover_image TEXT,
  is_premium BOOLEAN DEFAULT TRUE,
  date DATE DEFAULT CURRENT_DATE,
  tags TEXT[],
  created_at TIMESTAMP DEFAULT NOW()
);

-- Bookings
CREATE TABLE bookings (
  id BIGSERIAL PRIMARY KEY,
  service TEXT,
  full_name TEXT NOT NULL,
  email TEXT NOT NULL,
  phone TEXT,
  notes TEXT,
  date DATE NOT NULL,
  time TEXT NOT NULL,
  status TEXT DEFAULT 'pending',
  created_at TIMESTAMP DEFAULT NOW()
);

-- Contact form submissions
CREATE TABLE contact_submissions (
  id BIGSERIAL PRIMARY KEY,
  name TEXT NOT NULL,
  email TEXT NOT NULL,
  subject TEXT,
  message TEXT NOT NULL,
  created_at TIMESTAMP DEFAULT NOW()
);

-- Subscriptions (linked to Stripe)
CREATE TABLE subscriptions (
  id BIGSERIAL PRIMARY KEY,
  user_id UUID,
  email TEXT,
  stripe_customer_id TEXT,
  stripe_subscription_id TEXT UNIQUE,
  status TEXT,
  current_period_end TIMESTAMP,
  created_at TIMESTAMP DEFAULT NOW()
);

-- Enable Row Level Security
ALTER TABLE blog_posts ENABLE ROW LEVEL SECURITY;
ALTER TABLE listings ENABLE ROW LEVEL SECURITY;
ALTER TABLE bookings ENABLE ROW LEVEL SECURITY;
ALTER TABLE contact_submissions ENABLE ROW LEVEL SECURITY;
ALTER TABLE subscriptions ENABLE ROW LEVEL SECURITY;

-- Allow public to read blog posts and listings
CREATE POLICY "Anyone can read blogs" ON blog_posts FOR SELECT USING (true);
CREATE POLICY "Anyone can read listings" ON listings FOR SELECT USING (true);
```

### 3.4 Enable Email Auth
1. Click **Authentication → Providers**
2. Make sure **Email** is enabled
3. (Optional) Disable email confirmation for testing: **Settings** → uncheck "Enable email confirmations"

### 3.5 Create Your Admin Account
1. Click **Authentication → Users → Add User**
2. Email: `eliobardho7@gmail.com`
3. Password: choose a strong password
4. Click **Create**

### 3.6 Add to Vercel
Go to Vercel → Settings → Environment Variables, add:
- `NEXT_PUBLIC_SUPABASE_URL` = your project URL
- `NEXT_PUBLIC_SUPABASE_ANON_KEY` = your anon key
- `SUPABASE_SERVICE_ROLE_KEY` = your service_role key

Then redeploy.

---

## Step 4: Using Your Admin Dashboard

After all setup is done:

1. Go to **https://japancheaphouses.com/login**
2. Sign in with `eliobardho7@gmail.com` and your password
3. Visit **https://japancheaphouses.com/admin**

You can now:
- ✅ Add new blog posts (click "Manage Blogs → New Post")
- ✅ Add new listings (click "Manage Listings → New Listing")
- ✅ View all bookings (also emailed to you)
- ✅ Read all messages (also emailed to you)
- ✅ Mark content as Premium or Free

**To add a new blog post:**
1. Click **Manage Blogs** → **New Post**
2. Fill in title, excerpt, content
3. Mark as Free or Premium
4. Click **Save Post**
5. The post is **instantly live** on your site!

---

## Quick Reference: Where Forms Go

| Form | Email to | Stored in |
|------|----------|-----------|
| Booking | eliobardho7@gmail.com + customer confirmation | Supabase `bookings` |
| Contact | eliobardho7@gmail.com | Supabase `contact_submissions` |
| Newsletter | (TODO: add Resend audience) | Supabase `newsletter_subscribers` |

---

## Costs

| Service | Free Tier | When you'd pay |
|---------|-----------|----------------|
| Vercel | Plenty for you | Only if huge traffic |
| Supabase | 500MB database | When you outgrow it (~500+ users) |
| Stripe | $0 monthly | 2.9% + $0.30 per transaction |
| Resend | 100 emails/day | $20/mo for more |

**Estimated monthly cost when starting: $0**
**With ~50 customers: $0**
**At 500+ customers: ~$25/month**

---

## Help

If anything goes wrong, just ask me for help with the specific service. Take a screenshot of the error and share it!
