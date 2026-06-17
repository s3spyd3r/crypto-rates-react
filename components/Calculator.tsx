'use client';

import { useCallback, useEffect, useRef, useState, useTransition } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { COINS, COIN_BY_ID, DEFAULT_COIN } from '@/lib/coins';
import { FIAT_NAMES, fiatName } from '@/lib/fiat';
import { formatAmountInput, formatFiatAmount, parseAmount } from '@/lib/format';
import { SITE } from '@/lib/site';
import { CurrencyGrid } from './CurrencyGrid';
import { ThemeToggle } from './ThemeToggle';

type Status =
  | { kind: 'ok' }
  | { kind: 'no-key' }
  | { kind: 'failed'; reason: string };

type Props = {
  initialCoin: string;
  initialAmount: string;
  initialFiat: string;
  initialRates: Record<string, number>;
  initialStatus: Status;
};

export function Calculator({
  initialCoin,
  initialAmount,
  initialFiat,
  initialRates,
  initialStatus,
}: Props) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [coin, setCoin] = useState(initialCoin);
  const [amount, setAmount] = useState(initialAmount);
  const [fiat, setFiat] = useState(initialFiat);
  const [rates, setRates] = useState(initialRates);
  const [status, setStatus] = useState<Status>(initialStatus);
  const [loading, setLoading] = useState(false);
  const [copied, setCopied] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [, startTransition] = useTransition();
  const abortRef = useRef<AbortController | null>(null);

  const updateUrl = useCallback(
    (next: Partial<{ coin: string; amt: string; code: string }>) => {
      const params = new URLSearchParams(searchParams.toString());
      if (next.coin !== undefined) params.set('coin', next.coin);
      if (next.amt !== undefined) params.set('amt', next.amt);
      if (next.code !== undefined) params.set('code', next.code);
      const qs = params.toString();
      startTransition(() => {
        router.replace(qs ? `?${qs}` : '?', { scroll: false });
      });
    },
    [router, searchParams],
  );

  const fetchRates = useCallback(
    async (target: string) => {
      abortRef.current?.abort();
      const ctrl = new AbortController();
      abortRef.current = ctrl;
      setLoading(true);
      setError(null);
      try {
        const res = await fetch(`/api/rates/${target}`, { signal: ctrl.signal });
        if (!res.ok) {
          const data: { error?: string } = await res.json().catch(() => ({}));
          throw new Error(data.error ?? `Request failed (${res.status})`);
        }
        const data: {
          coin: string;
          rates: Record<string, number>;
          partial?: boolean;
          warning?: string;
        } = await res.json();
        setRates(data.rates);
        if (data.partial) {
          setStatus(
            data.warning
              ? { kind: 'no-key' }
              : { kind: 'failed', reason: data.warning ?? 'Partial rates returned.' },
          );
        } else {
          setStatus({ kind: 'ok' });
        }
      } catch (err) {
        if ((err as Error).name === 'AbortError') return;
        setError('Could not refresh rates. Showing the last successful values.');
        setStatus({
          kind: 'failed',
          reason: (err as Error).message ?? 'Network error.',
        });
      } finally {
        if (abortRef.current === ctrl) {
          setLoading(false);
        }
      }
    },
    [],
  );

  const onCoinChange = useCallback(
    (newCoin: string) => {
      const symbol = newCoin.toUpperCase();
      if (!COIN_BY_ID[symbol]) return;
      setCoin(symbol);
      updateUrl({ coin: symbol });
      if (symbol === initialCoin) {
        setRates(initialRates);
        setStatus(initialStatus);
        setError(null);
        return;
      }
      void fetchRates(symbol);
    },
    [initialCoin, initialRates, initialStatus, updateUrl, fetchRates],
  );

  const onAmountChange = useCallback(
    (value: string) => {
      const cleaned = formatAmountInput(value);
      setAmount(cleaned);
      updateUrl({ amt: cleaned });
    },
    [updateUrl],
  );

  const onFiatChange = useCallback(
    (value: string) => {
      const code = value.toUpperCase();
      if (fiatName(code) == null) return;
      setFiat(code);
      updateUrl({ code });
    },
    [updateUrl],
  );

  useEffect(() => {
    return () => abortRef.current?.abort();
  }, []);

  const num = parseAmount(amount);
  const featuredRate = rates[fiat];
  const featured = featuredRate != null ? num * featuredRate : null;
  const coinMeta = COIN_BY_ID[coin] ?? COIN_BY_ID[DEFAULT_COIN];
  const fiatCurrencyCount = status.kind === 'ok' ? Object.keys(FIAT_NAMES).length : 1;

  const onCopy = useCallback(async () => {
    if (featured == null) return;
    const text = `${amount} ${coin} = ${formatFiatAmount(featured, fiat)}`;
    try {
      await navigator.clipboard.writeText(text);
      setCopied(true);
      window.setTimeout(() => setCopied(false), 1600);
    } catch {
      /* ignore */
    }
  }, [amount, coin, featured, fiat]);

  return (
    <>
      <header className="sticky top-0 z-10 border-b border-[var(--border)] bg-[var(--surface)]">
        <div className="mx-auto flex max-w-6xl items-center justify-between px-6 py-4">
          <a
            href="/"
            className="flex items-center gap-2 text-[var(--fg)]"
          >
            <span
              aria-hidden="true"
              className="inline-flex size-7 items-center justify-center rounded-full bg-[var(--accent)] font-sans text-sm font-bold text-white"
            >
              C
            </span>
            <span className="text-base font-semibold tracking-tight">
              {SITE.title}
            </span>
          </a>
          <ThemeToggle />
        </div>
      </header>

      <section className="border-b border-[var(--border)] bg-[var(--surface)]">
        <div
          aria-hidden="true"
          className="h-1 w-full"
          style={{ backgroundColor: coinMeta.color }}
        />
        <div className="mx-auto max-w-6xl px-6 py-16 md:py-20">
          <p
            className="text-sm text-[var(--fg-muted)]"
            aria-live="polite"
          >
            {coinMeta.name} <span className="mx-1">→</span> {fiat}{' '}
            {loading ? '· loading' : ''}
          </p>
          <h1
            className={`num mt-2 text-5xl font-bold leading-none tracking-tight text-[var(--accent)] sm:text-6xl md:text-7xl ${
              loading ? 'is-loading' : ''
            }`}
          >
            {featured == null ? '—' : formatFiatAmount(featured, fiat)}
          </h1>
          <p className="mt-3 text-base text-[var(--fg-muted)]">
            {amount || '1'} {coinMeta.name} equals{' '}
            {featured != null ? formatFiatAmount(featured, fiat) : '—'} {fiatName(fiat) ?? ''}
          </p>

          {error && (
            <p className="mt-3 text-sm text-[var(--danger)]">
              {error}
            </p>
          )}

          <div className="mt-8 grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-4">
            <label className="block">
              <span className="sr-only">Amount of {coinMeta.name}</span>
              <input
                type="text"
                inputMode="decimal"
                value={amount}
                onChange={(e) => onAmountChange(e.target.value)}
                placeholder="1"
                className="w-full rounded-lg border border-[var(--border)] bg-[var(--surface)] px-4 py-3 text-base text-[var(--fg)] placeholder:text-[var(--fg-subtle)] focus:border-[var(--accent)] focus:outline-none focus:ring-2 focus:ring-[var(--accent)]/20"
              />
            </label>
            <label className="block">
              <span className="sr-only">Cryptocurrency</span>
              <select
                value={coin}
                onChange={(e) => onCoinChange(e.target.value)}
                className="w-full appearance-none rounded-lg border border-[var(--border)] bg-[var(--surface)] px-4 py-3 text-base text-[var(--fg)] focus:border-[var(--accent)] focus:outline-none focus:ring-2 focus:ring-[var(--accent)]/20"
              >
                {COINS.map((c) => (
                  <option key={c.id} value={c.id}>
                    {c.id} — {c.name}
                  </option>
                ))}
              </select>
            </label>
            <label className="block">
              <span className="sr-only">Fiat currency</span>
              <select
                value={fiat}
                onChange={(e) => onFiatChange(e.target.value)}
                className="w-full appearance-none rounded-lg border border-[var(--border)] bg-[var(--surface)] px-4 py-3 text-base text-[var(--fg)] focus:border-[var(--accent)] focus:outline-none focus:ring-2 focus:ring-[var(--accent)]/20"
              >
                {Object.keys(rates)
                  .filter((code) => fiatName(code) != null)
                  .sort()
                  .map((code) => (
                    <option key={code} value={code}>
                      {code} — {fiatName(code)}
                    </option>
                  ))}
              </select>
            </label>
            <button
              type="button"
              onClick={onCopy}
              disabled={featured == null}
              className="rounded-lg bg-[var(--accent)] px-4 py-3 text-base font-semibold text-white transition-colors hover:bg-[var(--accent-hover)] disabled:opacity-50"
            >
              {copied ? 'Copied' : 'Copy result'}
            </button>
          </div>
        </div>
      </section>

      {status.kind !== 'ok' && (
        <div className="mx-auto max-w-6xl px-6 pt-6">
          <div
            role="status"
            className="rounded-lg border border-[var(--border)] bg-[var(--surface-2)] p-4 text-sm text-[var(--fg-muted)]"
          >
            {status.kind === 'no-key' ? (
              <p>
                Only EUR is shown because{' '}
                <code className="font-mono text-[var(--fg)]">FIXER_API_KEY</code> is not
                set. Add it to{' '}
                <code className="font-mono text-[var(--fg)]">.env.local</code> and
                restart{' '}
                <code className="font-mono text-[var(--fg)]">npm run dev</code> to
                load the other {Object.keys(FIAT_NAMES).length - 1} currencies.
              </p>
            ) : (
              <p>
                <span className="font-medium text-[var(--fg)]">Fixer error:</span>{' '}
                {status.reason}
              </p>
            )}
          </div>
        </div>
      )}

      <CurrencyGrid
        rates={rates}
        coin={coin}
        coinName={coinMeta.name}
        selectedFiat={fiat}
        loading={loading}
      />

      <footer className="border-t border-[var(--border)] bg-[var(--surface)]">
        <div className="mx-auto flex max-w-6xl items-center justify-between px-6 py-6 text-sm text-[var(--fg-subtle)]">
          <span>© {SITE.title}</span>
          <span className="font-mono text-xs uppercase tracking-widest">
            {fiatCurrencyCount} currencies · live rates
          </span>
        </div>
      </footer>
    </>
  );
}
