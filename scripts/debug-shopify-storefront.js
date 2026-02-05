#!/usr/bin/env node
/**
 * Debug Storefront API token.
 * Run: node scripts/debug-shopify-storefront.js
 * Reads token from SHOPIFY_STOREFRONT_TOKEN env var or shopify-config.js (local).
 */
const fs = require('fs');
const path = require('path');

const SHOPIFY_DOMAIN = 'marzialetech.myshopify.com';
let token = process.env.SHOPIFY_STOREFRONT_TOKEN;

if (!token) {
  const configPath = path.join(__dirname, '..', 'shopify-config.js');
  if (fs.existsSync(configPath)) {
    const content = fs.readFileSync(configPath, 'utf8');
    const m = content.match(/SHOPIFY_STOREFRONT_TOKEN\s*=\s*['"]([^'"]+)['"]/);
    if (m) token = m[1];
  }
}

if (!token) {
  console.error('No token found. Either:');
  console.error('  1. Create shopify-config.js with your token');
  console.error('  2. Or run: SHOPIFY_STOREFRONT_TOKEN=your_token node scripts/debug-shopify-storefront.js');
  process.exit(1);
}

const url = `https://${SHOPIFY_DOMAIN}/api/2024-01/graphql.json`;
const query = '{ shop { name } products(first: 3) { edges { node { id title } } } }';

console.log('Testing Storefront API...');
console.log('URL:', url);
console.log('Token length:', token.length);
console.log('');

fetch(url, {
  method: 'POST',
  headers: {
    'Content-Type': 'application/json',
    'X-Shopify-Storefront-Access-Token': token,
  },
  body: JSON.stringify({ query }),
})
  .then((res) => {
    console.log('Status:', res.status, res.statusText);
    return res.json();
  })
  .then((data) => {
    if (data.errors) {
      console.error('API errors:', JSON.stringify(data.errors, null, 2));
      process.exit(1);
    }
    console.log('Success!');
    console.log('Shop:', data.data?.shop?.name);
    console.log('Products:', data.data?.products?.edges?.length ?? 0);
    if (data.data?.products?.edges?.length) {
      data.data.products.edges.forEach((e, i) => {
        console.log(`  ${i + 1}. ${e.node.title} (${e.node.id})`);
      });
    }
  })
  .catch((err) => {
    console.error('Request failed:', err.message);
    process.exit(1);
  });
