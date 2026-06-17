const FORMAT_CACHE = new Map<string, Intl.NumberFormat>();

function fmt(locale: string, options: Intl.NumberFormatOptions): Intl.NumberFormat {
  const key = locale + JSON.stringify(options);
  let f = FORMAT_CACHE.get(key);
  if (!f) {
    f = new Intl.NumberFormat(locale, options);
    FORMAT_CACHE.set(key, f);
  }
  return f;
}

export function formatFiatAmount(
  value: number,
  code: string,
  locale: string = 'en-US',
  options: { maximumFractionDigits?: number } = {},
): string {
  const max = options.maximumFractionDigits ?? 2;
  return fmt(locale, {
    style: 'currency',
    currency: code,
    currencyDisplay: 'code',
    maximumFractionDigits: max,
    minimumFractionDigits: 0,
  }).format(value);
}

export function formatFiatRate(
  value: number,
  code: string,
  locale: string = 'en-US',
): string {
  const max = value >= 1000 ? 2 : value >= 1 ? 4 : 8;
  return formatFiatAmount(value, code, locale, { maximumFractionDigits: max });
}

export function formatAmountInput(value: string): string {
  return value.replace(/[^0-9.]/g, '').replace(/(\..*)\./g, '$1');
}

export function parseAmount(value: string): number {
  if (!value) return 0;
  const n = Number(value);
  return Number.isFinite(n) ? n : 0;
}
