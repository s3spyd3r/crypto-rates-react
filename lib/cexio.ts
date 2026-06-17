import type { FiatRates } from './types';

export type RatesStatus =
  | { kind: 'ok'; rates: FiatRates }
  | { kind: 'no-key' }
  | { kind: 'failed'; reason: string };

export type CryptoPriceStatus =
  | { kind: 'ok'; price: number }
  | { kind: 'failed'; reason: string };

export async function getCryptoPrice(coin: string): Promise<CryptoPriceStatus> {
  const symbol = coin.toUpperCase();
  const url = `https://cex.io/api/ticker/${symbol}/EUR`;

  let res: Response;
  try {
    res = await fetch(url, {
      headers: { 'User-Agent': 'crypto-calculator/2.0' },
      next: { revalidate: 60, tags: [`crypto:${symbol}`] },
    });
  } catch (err) {
    return {
      kind: 'failed',
      reason: `Network error contacting cex.io: ${(err as Error).message ?? 'unknown'}`,
    };
  }

  if (!res.ok) {
    return { kind: 'failed', reason: `cex.io responded ${res.status}` };
  }

  let data: unknown;
  try {
    data = await res.json();
  } catch {
    return { kind: 'failed', reason: 'cex.io returned non-JSON.' };
  }

  const rawLast = (data as { last?: unknown }).last;
  if (typeof rawLast === 'number' && Number.isFinite(rawLast)) {
    return { kind: 'ok', price: rawLast };
  }
  if (typeof rawLast === 'string') {
    const n = Number(rawLast);
    if (Number.isFinite(n)) return { kind: 'ok', price: n };
  }
  if (
    data &&
    typeof data === 'object' &&
    'error' in data &&
    typeof (data as { error: unknown }).error === 'string'
  ) {
    return {
      kind: 'failed',
      reason: `cex.io: ${(data as { error: string }).error}`,
    };
  }
  return { kind: 'failed', reason: 'cex.io returned an unexpected payload.' };
}

export async function getFiatRates(): Promise<RatesStatus> {
  const raw = process.env.FIXER_API_KEY;
  const key = raw?.trim();
  if (!key) {
    return { kind: 'no-key' };
  }

  const url = `http://data.fixer.io/latest?base=EUR&access_key=${encodeURIComponent(key)}`;

  try {
    const res = await fetch(url, { next: { revalidate: 60 * 60 * 24 } });
    if (!res.ok) {
      return { kind: 'failed', reason: `Fixer responded ${res.status}` };
    }
    const data: unknown = await res.json();
    if (
      data &&
      typeof data === 'object' &&
      (data as { success?: unknown }).success === false
    ) {
      const info =
        (data as { error?: { info?: string } }).error?.info ??
        'Fixer rejected the API key.';
      return { kind: 'failed', reason: info };
    }
    if (
      data &&
      typeof data === 'object' &&
      'rates' in data &&
      (data as { rates: unknown }).rates &&
      typeof (data as { rates: unknown }).rates === 'object'
    ) {
      const rates = (data as { rates: Record<string, unknown> }).rates;
      const out: FiatRates = {};
      for (const [code, v] of Object.entries(rates)) {
        if (typeof v === 'number' && Number.isFinite(v)) out[code] = v;
      }
      out.EUR ??= 1;
      return { kind: 'ok', rates: out };
    }
    return { kind: 'failed', reason: 'Fixer returned no rates.' };
  } catch (err) {
    return {
      kind: 'failed',
      reason: (err as Error).message ?? 'Network error contacting Fixer.',
    };
  }
}

export async function getCoinRates(coin: string): Promise<RatesStatus> {
  const [price, fiat] = await Promise.all([getCryptoPrice(coin), getFiatRates()]);
  if (price.kind === 'failed') {
    return { kind: 'failed', reason: price.reason };
  }
  if (fiat.kind !== 'ok') return fiat;

  const out: FiatRates = { EUR: price.price };
  for (const [code, rate] of Object.entries(fiat.rates)) {
    if (typeof rate === 'number' && Number.isFinite(rate)) {
      out[code] = price.price * rate;
    }
  }
  return { kind: 'ok', rates: out };
}
