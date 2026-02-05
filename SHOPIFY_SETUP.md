# Shopify Merch Store Setup

The merch button on the site connects to your Shopify store via the Storefront API. Products are loaded automatically from your store—no need to manually add product IDs.

## 1. Storefront API token (never commit to repo)

The token is kept out of the repo for security.

**Local development:**
1. Copy `shopify-config.example.js` to `shopify-config.js`
2. Replace `YOUR_STOREFRONT_API_TOKEN_HERE` with your token
3. `shopify-config.js` is gitignored and will not be committed

**Production (GitHub Pages):**
1. Add `SHOPIFY_STOREFRONT_TOKEN` to your repo: **Settings → Secrets and variables → Actions**
2. In **Settings → Pages**, set Source to **GitHub Actions**
3. The deploy workflow injects the token at build time

## 2. Get your Storefront API token

1. In Shopify Admin: **Settings** → **Apps and sales channels** → **Develop apps** → **Create an app**
2. Name it (e.g. "Storefront API") and click **Create**
3. Click **Configure Storefront API scopes**
4. Enable: `unauthenticated_read_product_listings`, `unauthenticated_read_checkouts`, `unauthenticated_write_checkouts`
5. Save, then **Install app** and **Reveal token once**
6. Copy the token into `SHOPIFY_STOREFRONT_TOKEN`

## 3. Products

Products are fetched automatically from your Shopify store when the merch window opens. Each product in your store will appear as a button. The "Design" link (logo preview) stays at the end.
