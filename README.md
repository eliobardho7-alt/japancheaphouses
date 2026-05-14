# Yama Vista - Real Estate Consulting Website

A modern, custom-coded replacement for your Wix site. Built with Next.js, Tailwind CSS, Supabase, and Stripe.

## What's Included

✅ Home page with hero, services, and featured listings
✅ Services page with all three offerings
✅ Booking page with calendar (Mon-Fri, 8 AM - 6 PM)
✅ Blog/Listings page with category filters
✅ Individual blog post pages with paywall for premium content
✅ Community page with 7 discussion categories
✅ Pricing page with subscription tiers
✅ Login & Signup pages
✅ Responsive navbar and footer with newsletter signup
✅ Premium content gating structure (subscription-based)

---

## Quick Start (5 minutes to see it running)

### Prerequisites
You need [Node.js](https://nodejs.org/) installed (version 18 or higher).
Check by running `node --version` in your terminal.

### Step 1: Install dependencies

Open a terminal in this project folder and run:

```bash
npm install
```

This downloads all the libraries needed.

### Step 2: Run it locally

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) in your browser. **Your site is now running!**

You can browse all pages. The auth/payments aren't connected yet - we'll do that in the next steps.

---

## Phase 2: Connect Backend Services (Auth, Database, Payments)

Your site needs three external services to be fully functional. **All have generous free tiers**:

1. **Supabase** - Database + Authentication (free tier covers small sites)
2. **Stripe** - Subscription payments (only pays on transactions, $0.30 + 2.9%)
3. **Vercel** - Hosting (free for personal projects)

### A. Set Up Supabase (Database & Auth)

1. Go to [supabase.com](https://supabase.com) and create a free account
2. Click "New Project" - choose a name like "yama-vista"
3. Wait ~2 minutes for project to be created
4. Once ready, go to **Settings → API**
5. Copy these values (we'll use them later):
   - **Project URL**
   - **anon public key**
   - **service_role key** (keep secret!)

6. Now create the database tables. Go to **SQL Editor** and run this:

```sql
-- Users profile table (extends Supabase auth.users)
CREATE TABLE profiles (
  id UUID REFERENCES auth.users PRIMARY KEY,
  full_name TEXT,
  avatar_url TEXT,
  bio TEXT,
  created_at TIMESTAMP DEFAULT NOW()
);

-- Subscriptions table
CREATE TABLE subscriptions (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES auth.users NOT NULL,
  stripe_customer_id TEXT,
  stripe_subscription_id TEXT,
  status TEXT,
  current_period_end TIMESTAMP,
  created_at TIMESTAMP DEFAULT NOW()
);

-- Bookings table
CREATE TABLE bookings (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES auth.users,
  service TEXT NOT NULL,
  full_name TEXT NOT NULL,
  email TEXT NOT NULL,
  phone TEXT,
  notes TEXT,
  date DATE NOT NULL,
  time TEXT NOT NULL,
  status TEXT DEFAULT 'pending',
  created_at TIMESTAMP DEFAULT NOW()
);

-- Community topics
CREATE TABLE topics (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES auth.users NOT NULL,
  category TEXT NOT NULL,
  title TEXT NOT NULL,
  content TEXT NOT NULL,
  created_at TIMESTAMP DEFAULT NOW()
);

-- Community replies
CREATE TABLE replies (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  topic_id UUID REFERENCES topics ON DELETE CASCADE,
  user_id UUID REFERENCES auth.users NOT NULL,
  content TEXT NOT NULL,
  created_at TIMESTAMP DEFAULT NOW()
);

-- Direct messages
CREATE TABLE messages (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  from_user_id UUID REFERENCES auth.users NOT NULL,
  to_user_id UUID REFERENCES auth.users NOT NULL,
  content TEXT NOT NULL,
  read BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMP DEFAULT NOW()
);

-- Newsletter subscribers
CREATE TABLE newsletter_subscribers (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  email TEXT UNIQUE NOT NULL,
  created_at TIMESTAMP DEFAULT NOW()
);

-- Reviews & ratings
CREATE TABLE reviews (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES auth.users NOT NULL,
  rating INT CHECK (rating BETWEEN 1 AND 5),
  content TEXT,
  service TEXT,
  created_at TIMESTAMP DEFAULT NOW()
);

-- Enable Row Level Security
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE subscriptions ENABLE ROW LEVEL SECURITY;
ALTER TABLE bookings ENABLE ROW LEVEL SECURITY;
ALTER TABLE topics ENABLE ROW LEVEL SECURITY;
ALTER TABLE replies ENABLE ROW LEVEL SECURITY;
ALTER TABLE messages ENABLE ROW LEVEL SECURITY;
ALTER TABLE reviews ENABLE ROW LEVEL SECURITY;

-- Basic policies (adjust as needed)
CREATE POLICY "Profiles viewable by all" ON profiles FOR SELECT USING (true);
CREATE POLICY "Users update own profile" ON profiles FOR UPDATE USING (auth.uid() = id);

CREATE POLICY "Topics viewable by subscribers" ON topics FOR SELECT
  USING (EXISTS (SELECT 1 FROM subscriptions WHERE user_id = auth.uid() AND status = 'active'));
CREATE POLICY "Subscribers can create topics" ON topics FOR INSERT
  WITH CHECK (EXISTS (SELECT 1 FROM subscriptions WHERE user_id = auth.uid() AND status = 'active'));
```

### B. Set Up Stripe (Payments)

1. Go to [stripe.com](https://stripe.com) and create an account
2. In dashboard, switch to **Test Mode** (toggle top-right) for development
3. Go to **Developers → API Keys** and copy:
   - **Publishable key** (pk_test_...)
   - **Secret key** (sk_test_...)

4. Create your $5/month subscription product:
   - Go to **Products** → **Add Product**
   - Name: "Yama Vista Community"
   - Pricing: **Recurring**, $5.00 / month
   - Save and copy the **Price ID** (price_...)

5. Set up webhook (after deployment):
   - **Developers → Webhooks → Add Endpoint**
   - URL: `https://yourdomain.com/api/stripe/webhook`
   - Events: `customer.subscription.created`, `customer.subscription.updated`, `customer.subscription.deleted`
   - Copy the **Signing Secret** (whsec_...)

### C. Configure Environment Variables

1. In the project folder, copy `.env.local.example` to `.env.local`:

```bash
cp .env.local.example .env.local
```

2. Open `.env.local` and fill in your keys from Supabase and Stripe.

3. Restart your dev server: `Ctrl+C` then `npm run dev`

---

## Phase 3: Deploy to Production

### Deploy to Vercel (Free)

1. Create a GitHub account if you don't have one
2. Push this code to a GitHub repository:
   ```bash
   git init
   git add .
   git commit -m "Initial commit"
   # Create repo on github.com, then:
   git remote add origin https://github.com/YOUR_USERNAME/yama-vista.git
   git push -u origin main
   ```

3. Go to [vercel.com](https://vercel.com) and sign up with GitHub
4. Click **"Add New Project"** → select your repo
5. **Add your environment variables** (from `.env.local`) in Vercel's project settings
6. Click **Deploy**

Your site will be live at `https://your-project.vercel.app` in about 2 minutes.

### Custom Domain

1. Buy a domain (Namecheap, Google Domains, etc. ~$12/year)
2. In Vercel: **Settings → Domains** → Add your domain
3. Follow the DNS instructions Vercel provides

---

## Project Structure

```
yama-vista/
├── app/
│   ├── page.jsx              # Home page
│   ├── layout.jsx            # Root layout (nav, footer)
│   ├── globals.css           # Global styles
│   ├── services/page.jsx     # Services page
│   ├── booking/page.jsx      # Booking calendar
│   ├── blog/
│   │   ├── page.jsx          # Blog list
│   │   └── [slug]/page.jsx   # Individual post
│   ├── community/page.jsx    # Community (gated)
│   ├── pricing/page.jsx      # Subscription plans
│   ├── login/page.jsx        # Sign in
│   ├── signup/page.jsx       # Sign up
│   └── listings/page.jsx     # Property listings
├── components/
│   ├── Navbar.jsx            # Top navigation
│   └── Footer.jsx            # Footer with newsletter
├── lib/
│   ├── supabase.js           # Database/auth client
│   └── stripe.js             # Payment client
├── data/
│   ├── services.js           # Service definitions
│   ├── blogs.js              # Blog posts (move to DB later)
│   └── community.js          # Community categories
└── public/                   # Images and assets
```

---

## Customization Guide

### Change Colors
Edit `tailwind.config.js` - the `brand` color object.

### Add Blog Posts
**Easy way:** Edit `data/blogs.js` and add new objects.
**Better way:** Set up a CMS like [Sanity](https://sanity.io) or use Supabase to store posts.

### Change Hero Image
Replace the URL in `app/page.jsx` (search for `images.unsplash.com`) or upload your own to `public/` folder.

### Add More Listings
Add to `data/blogs.js` with `category: 'Akiya Homes for Sale'`.

---

## What's Next (TODOs)

These features have the structure built but need backend connection:

- [ ] Connect Supabase auth to Login/Signup pages (lib/supabase.js is ready)
- [ ] Connect Stripe checkout to Pricing page (lib/stripe.js is ready)
- [ ] Connect booking form to save to Supabase
- [ ] Build community discussion threads (UI ready, needs API routes)
- [ ] Build direct messaging feature
- [ ] Add user profile page
- [ ] Add admin dashboard for managing listings/bookings
- [ ] Connect newsletter signup to email service (Resend, SendGrid)

I recommend tackling these one at a time. Start with **Supabase auth + Stripe subscriptions**, since those unlock the community features.

---

## Help & Support

- **Next.js docs:** https://nextjs.org/docs
- **Tailwind CSS:** https://tailwindcss.com/docs
- **Supabase docs:** https://supabase.com/docs
- **Stripe docs:** https://stripe.com/docs

---

## Estimated Monthly Costs

| Service | Free Tier | When You Pay |
|---------|-----------|--------------|
| Vercel | Sufficient for most sites | If high traffic, ~$20/mo |
| Supabase | 500MB database, 50K users | If you outgrow it, ~$25/mo |
| Stripe | No monthly fee | 2.9% + $0.30 per transaction |
| Domain | n/a | ~$12/year |

**Total starting cost: $1-12/year** (just domain), scaling with your growth.

Compare to Wix Premium: ~$16-45/month with limited control.
