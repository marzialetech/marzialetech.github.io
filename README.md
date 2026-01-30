# Logos

Logo and pixel-reveal assets for Marziale Technologies.

- **pixel-reveal.html** – Animated pixel reveal (logo, angel, man on boat). Build with `node build-pixel-reveal.js`.
- **index.html** – Redirects to pixel-reveal (for serving at e.g. marziale.tech/logos/).

## Build

```bash
node build-pixel-reveal.js
```

Inlines the pixelated SVGs into `pixel-reveal.html` so the page works when opened directly or served statically.

## Assets

- **martechtext** – Marziale Technologies text (pixelated).
- **logo** – Logo mark (pixelated).
- **angel-silhouette**, **two-figures** (man on boat) – Figure SVGs.
- **cursor** – Potrace-traced hand cursor (white, for use on blue).

Pipeline: PNG → (ImageMagick → PBM) → potrace → SVG; pixelation via `pixels-to-svg.js` and ImageMagick `txt:-`.

---

## Move to Desktop and push to new repo

This folder was created inside the fitness repo. To use it as its own repo at **marziale.tech/logos**:

1. **Move to Desktop** (from Terminal):
   ```bash
   mv /Users/jjmarzia/Desktop/fitness/logos /Users/jjmarzia/Desktop/
   ```

2. **Create a new public repo** on GitHub (e.g. `marzialetech/logos` or `jjmarzia/logos`).

3. **Add remote and push**:
   ```bash
   cd /Users/jjmarzia/Desktop/logos
   git remote add origin https://github.com/YOUR_ORG/logos.git
   git push -u origin main
   ```

4. **Serve at marziale.tech/logos**: Configure your host (e.g. GitHub Pages, Vercel, or your main site) so the root of this repo is served at `marziale.tech/logos/`. Then `marziale.tech/logos/` will load `index.html` (redirect to pixel-reveal) and `marziale.tech/logos/pixel-reveal.html` will show the reveal directly.
