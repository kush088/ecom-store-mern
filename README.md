# Aurelia – Jewellery E-commerce (MERN)

React + Vite storefront and admin panel, Express + MongoDB API, JWT auth, Cloudinary images, Razorpay payments.

## Setup

**Prerequisites:** Node 18+, a MongoDB instance, a Cloudinary account, Razorpay test keys.

```bash
# API
cd server
cp .env.example .env     # fill in MONGO_URI, JWT_SECRET, Cloudinary and Razorpay keys
npm install
npm run seed             # creates all categories/subcategories, an admin user, coupon WELCOME10, sample testimonials
npm run dev              # http://localhost:5000

# Web (new terminal)
cd client
npm install
npm run dev              # http://localhost:5173 (proxies /api to :5000)
```

Admin sign-in: `/admin/login` with `ADMIN_EMAIL` / `ADMIN_PASSWORD` from `.env` (defaults `admin@jewels.com` / `Admin@12345`). **Change these before deploying.**

## What's included

- **Storefront:** home (banners, collections, bestsellers, new arrivals, trending, offer, testimonials, newsletter), shop with filters/sorting/pagination, category pages, search, product page with zoom, wishlist, cart with coupons, checkout, payment success/failure pages, auth, account (profile, addresses, orders, password), contact, about, policies, 404.
- **Admin (`/admin`):** dashboard (revenue, orders, customers, 30-day chart, top sellers, low stock), products (multi-image Cloudinary upload, jewellery attributes), categories (create/edit/delete/hide/reorder with up/down), orders (status, tracking, payment status), customers (block/unblock), coupons, banners, testimonials, contact messages and newsletter subscribers.
- **Jewellery-aware data:** purity applies to gold/silver only, diamond carat/clarity/colour only for diamond products, and the shop only shows filter options that exist for the products being viewed.

## Security notes

- Prices, discounts, GST and delivery are **always recomputed on the server**; the client never sets them.
- Razorpay signatures are verified server-side (HMAC, timing-safe) before an order is marked paid. Stock is deducted only after payment succeeds (or on COD order).
- Passwords hashed with bcrypt (12 rounds); roles can't be set via registration; admin routes require an admin JWT; helmet, CORS allow-list and rate limiting are on; uploads are limited to 5 MB JPG/PNG/WEBP.

## Before going live

- Replace placeholder store address/phone/email in `client/src/pages/Static.jsx`, and have the policy text reviewed.
- Switch Razorpay to live keys, set `NODE_ENV=production`, a strong `JWT_SECRET`, and `CLIENT_URL` to your domain; set `VITE_API_URL` if the API is on another origin.
- Gold prices are fixed per product here (no live gold-rate pricing); GST is set to 3% in `server/utils/pricing.js`.
- Refunds are marked in the system but must be issued from the Razorpay dashboard.
