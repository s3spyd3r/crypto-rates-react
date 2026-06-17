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
      <div className="mb-10 flex items-end justify-between gap-4">
        <div>
          <p className="font-mono text-xs uppercase tracking-widest text-[var(--fg-muted)]">
            Reference
          </p>
          <h2 className="mt-1 text-2xl font-semibold">
            1 {coinName} in {total} currencies
          </h2>
        </div>
        {loading && (
          <span className="font-mono text-xs uppercase tracking-widest text-[var(--fg-muted)]">
            Updating…
          </span>
        )}
      </div>

      <ul className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3">
        {entries.map(([code, value]) => {
          const isSelected = code === selectedFiat;
          return (
            <li
              key={code}
              className={`group relative rounded-lg border bg-[var(--surface)] p-5 transition-colors ${
                isSelected
                  ? 'border-[var(--fg)]'
                  : 'border-[var(--border)] hover:border-[var(--fg-muted)]'
              }`}
            >
              <div className="flex items-baseline justify-between gap-3">
                <span className="font-mono text-xs uppercase tracking-widest text-[var(--fg-muted)]">
                  {code}
                </span>
                {isSelected && (
                  <span className="font-mono text-[10px] uppercase tracking-widest text-[var(--fg)]">
                    Selected
                  </span>
                )}
              </div>
              <p className="mt-1 text-sm text-[var(--fg)]">
                {fiatName(code) ?? '—'}
              </p>
              <p className="num mt-3 text-2xl font-medium text-[var(--fg)]">
                {formatFiatRate(value, code)}
              </p>
            </li>
          );
        })}
      </ul>

      <p className="mt-10 font-mono text-xs uppercase tracking-widest text-[var(--fg-muted)]">
        1 {coin} · live rates
      </p>
    </section>
  );
}
