# Crypto Rates React

A simple cryptocurrency calculator built with Next.js, React, and Tailwind CSS. It converts between 6 cryptocurrencies and 162 fiat currencies using live exchange rates fetched from external APIs

## Features

- **6 cryptocurrencies**: Bitcoin, Ethereum, Litecoin, Stellar, XRP, and
  Bitcoin Cash, switchable from a single dropdown.
- **162 fiat currencies**: every entry from the ISO-4217 list (plus the
  legacy `XCG` slot from the original), with full names and live EUR-base
  rates.
- **Live rates with smart caching**: CEX.io prices refresh every 60 s;
  Fixer.io exchange rates every 24 h. Cache is per-coin, so switching
  coins is instant.
- **Shareable URLs**: `?coin=BTC&amt=1.5&code=USD`. Every state change
  rewrites the URL via `router.replace` inside `startTransition`, so
  history isn't polluted and the page never jumps.
- **Light and dark theme**: a `.dark` class on `<html>`, persisted in
  `localStorage`, with a no-flash inline script in `<head>`. System
  preference is the default.
- **Copy result**: one click copies the headline figure (`1.5 BTC = 67,000.00
  USD`) to the clipboard.
- **Locale-aware formatting**: prices use `Intl.NumberFormat` with tabular
  numerals (JetBrains Mono) so columns align. Currency codes are rendered
  with a code prefix (`USD 1,000.00`) for consistency across all 162
  currencies, including the non-ISO `XCG` entry.
- **Reference grid**: below the headline, every fiat is listed with its
  value for 1 coin. The currently selected currency is highlighted.
- **Clear error states**: missing or invalid `FIXER_API_KEY` shows a
  specific message (the real Fixer error, not a generic "not set"). The
  CEX.io failure mode surfaces the HTTP status, network error, or
  unexpected payload, whichever applies.
- **Mobile-friendly**: the hero, input row, and 3-column grid reflow
  cleanly down to phone-width.

## Stack

- **Next.js 16** (App Router) + **React 19** + **TypeScript 6**
- **Tailwind CSS 4** for styling
- `next/font` for Inter (UI) and JetBrains Mono (numbers)
- No client-side state library. A single `useState` / `startTransition`
  tree in the calculator component.

## Run

```bash
npm install
npm run dev          # http://localhost:3000
```

For production:

```bash
npm run build
npm start
```

Node 20+ is required (Next 16 minimum).

## Configuration

The Fixer.io key is the only required configuration. Create `.env.local`:

```
FIXER_API_KEY=your_key_here
```

Without it the app falls back to showing only EUR. Every other fiat will be
empty in the dropdowns and grid. The key is read server-side only and never
sent to the client.

Get a key at [fixer.io](https://fixer.io).

## How it works

- **CEX.io** (`https://cex.io/api/ticker/<COIN>/EUR`): last traded price of
  the selected coin in EUR. Cached server-side for 60 seconds.
- **Fixer.io** (`http://data.fixer.io/latest?base=EUR&access_key=...`): EUR
  base rates against 162 fiat currencies. Cached server-side for 24 hours.
- The two responses are combined in a tiny server function (`lib/cexio.ts`,
  `getCoinRates`) and the product is rendered as the headline figure plus a
  reference grid.

Both APIs are reached from `app/api/rates/[coin]/route.ts` (used when the
user switches coins client-side) and from the page itself when the page is
server-rendered. The page reads `?coin`, `?amt`, and `?code` from the URL so
every view is shareable.

## Project layout

```
app/
  layout.tsx               root layout, fonts, theme bootstrap
  page.tsx                 main page (server component, fetches initial rates)
  globals.css              Tailwind + design tokens
  api/rates/[coin]/        server proxy for CEX + Fixer
components/
  Calculator.tsx           client component, owns state
  CurrencyGrid.tsx         reference grid of all 162 currencies
  ThemeToggle.tsx          light / dark toggle
lib/
  coins.ts                 coin metadata (id, name, color, logo)
  fiat.ts                  ISO-4217 currency name map (162 entries)
  cexio.ts                 CEX + Fixer clients + combine
  format.ts                Intl.NumberFormat helpers
  types.ts                 shared types
  site.ts                  site-wide constants
public/img/                coin SVGs
```

## Adding a coin

Edit `lib/coins.ts` to add a `{ id, name, color, logo }` entry and drop a
SVG in `public/img/`. The dropdown and grid will pick it up automatically.

## Adding a fiat

Edit `lib/fiat.ts` to add `<CODE>: '<Display name>'` to the `FIAT_NAMES` map.
