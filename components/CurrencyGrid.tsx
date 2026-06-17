import { FIAT_NAMES, fiatName } from '@/lib/fiat';
import { formatFiatRate } from '@/lib/format';

type Props = {
  rates: Record<string, number>;
  coin: string;
  coinName: string;
  selectedFiat: string;
  loading: boolean;
};

export function CurrencyGrid({ rates, coin, coinName, selectedFiat, loading }: Props) {
  const entries = Object.entries(rates)
    .filter(([code]) => fiatName(code) != null)
    .sort(([a], [b]) => a.localeCompare(b));

  const total = FIAT_NAMES ? Object.keys(FIAT_NAMES).length : entries.length;

  return (
    <section className="mx-auto max-w-6xl px-6 py-16 md:py-20">
      <div className="mb-8 flex items-end justify-between gap-4">
        <div>
          <p className="text-sm font-medium text-[var(--fg-muted)]">
            Reference
          </p>
          <h2 className="mt-1 text-2xl font-semibold text-[var(--fg)]">
            1 {coinName} in {total} currencies
          </h2>
        </div>
        {loading && (
          <span className="text-sm font-medium text-[var(--accent)]">
            Updating…
          </span>
        )}
      </div>

      <ul className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {entries.map(([code, value]) => {
          const isSelected = code === selectedFiat;
          return (
            <li
              key={code}
              className={`rounded-xl border bg-[var(--surface)] p-5 transition-all ${
                isSelected
                  ? 'border-[var(--accent)] ring-2 ring-[var(--accent)]/15'
                  : 'border-[var(--border)] hover:border-[var(--border-strong)]'
              }`}
            >
              <div className="flex items-center justify-between">
                <span className="font-mono text-xs font-semibold uppercase tracking-wider text-[var(--fg-muted)]">
                  {code}
                </span>
                {isSelected && (
                  <span className="rounded-full bg-[var(--accent)]/10 px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wider text-[var(--accent)]">
                    Selected
                  </span>
                )}
              </div>
              <p className="mt-2 text-sm text-[var(--fg)]">
                {fiatName(code) ?? '—'}
              </p>
              <p className="num mt-3 text-2xl font-semibold text-[var(--fg)]">
                {formatFiatRate(value, code)}
              </p>
            </li>
          );
        })}
      </ul>

      <p className="mt-8 text-sm text-[var(--fg-subtle)]">
        1 {coin} · live rates
      </p>
    </section>
  );
}
