# Lute — homepage

Next.js (App Router) build of the Figma "Homepage v1" (node 55:2944).

```bash
npm install
npm run dev     # http://localhost:3000
npm run build && npm start
```

## Structure

```
app/layout.tsx            fonts, metadata, first-frame guard for the intro
app/globals.css           all styles (1440-px design units, scaled to the viewport)
components/Home.tsx       viewport scaling + scroll reveals, composes the page
components/Hero.tsx       keyframed intro (Web Animations) + fixed navigation
components/sections/      Problem, How it works, How it learns, Industries, Team, Blog, Contact, Footer
components/Button.tsx     Lute button (Figma 40:2246) with the roll + arc-fill hover
components/icons.tsx      inline SVGs and the gradient-map filter
public/media/             videos: hero + How it works steps
public/assets/            posters, photos, team logos
```

Fonts: Fragment Mono and Newsreader load from Google Fonts. Season Mix is used if installed; otherwise the page falls back to Newsreader.

The static HTML prototype this was ported from is in the git history (commit `af6d1b1`).
