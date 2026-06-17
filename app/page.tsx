import type { Metadata } from 'next';
import { Suspense } from 'react';
import { Calculator } from '@/components/Calculator';
import { getCoinRates } from '@/lib/cexio';
import { COIN_BY_ID, DEFAULT_COIN, isCoinId } from '@/lib/coins';
import { fiatName } from '@/lib/fiat';
import { SITE } from '@/lib/site';

export const dynamic = 'force-dynamic';

type SearchParams = Record<string, string | string[] | undefined>;

function pickCoin(value: string | undefined): string {
  if (!value) return DEFAULT_COIN;
  const upper = value.toUpperCase();
  return isCoinId(upper) ? upper : DEFAULT_COIN;
}

function pickAmount(value: string | undefined): string {
  if (!value) return '1';
  return value.replace(/[^0-9.]/g, '').replace(/(\..*)\./g, '$1') || '1';
}

function pickFiat(value: string | undefined): string {
  if (!value) return SITE.defaultCurrency;
  const upper = value.toUpperCase();
  return fiatName(upper) != null ? upper : SITE.defaultCurrency;
}

export async function generateMetadata({
  searchParams,
}: {
  searchParams: Promise<SearchParams>;
}): Promise<Metadata> {
  const sp = await searchParams;
  const coinRaw = Array.isArray(sp.coin) ? sp.coin[0] : sp.coin;
  const codeRaw = Array.isArray(sp.code) ? sp.code[0] : sp.code;
  const coin = pickCoin(coinRaw);
  const fiat = pickFiat(codeRaw);
  const name = COIN_BY_ID[coin]?.name ?? coin;
  return {
    title: `${name} → ${fiat} · ${SITE.title}`,
    description: SITE.description,
  };
}

export default async function Page({
  searchParams,
}: {
  searchParams: Promise<SearchParams>;
}) {
  const sp = await searchParams;
  const coinRaw = Array.isArray(sp.coin) ? sp.coin[0] : sp.coin;
  const amtRaw = Array.isArray(sp.amt) ? sp.amt[0] : sp.amt;
  const codeRaw = Array.isArray(sp.code) ? sp.code[0] : sp.code;

  const coin = pickCoin(coinRaw);
  const amount = pickAmount(amtRaw);
  const fiat = pickFiat(codeRaw);

  const result = await getCoinRates(coin);
  const rates = result.kind === 'ok' ? result.rates : { EUR: 0 };
  const status =
    result.kind === 'ok'
      ? { kind: 'ok' as const }
      : result.kind === 'no-key'
        ? { kind: 'no-key' as const }
        : { kind: 'failed' as const, reason: result.reason };

  return (
    <Suspense>
      <Calculator
        initialCoin={coin}
        initialAmount={amount}
        initialFiat={fiat}
        initialRates={rates}
        initialStatus={status}
      />
    </Suspense>
  );
}
