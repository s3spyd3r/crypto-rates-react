import { NextResponse } from 'next/server';
import { getCoinRates } from '@/lib/cexio';
import { isCoinId } from '@/lib/coins';

export const revalidate = 60;

export async function GET(
  _req: Request,
  ctx: { params: Promise<{ coin: string }> },
) {
  const { coin } = await ctx.params;
  const symbol = coin.toUpperCase();
  if (!isCoinId(symbol)) {
    return NextResponse.json({ error: 'Unknown coin' }, { status: 400 });
  }

  const result = await getCoinRates(symbol);
  if (result.kind === 'failed') {
    return NextResponse.json(
      { error: result.reason, partial: true, rates: { EUR: 0 } },
      { status: 502 },
    );
  }
  if (result.kind === 'no-key') {
    return NextResponse.json(
      { warning: 'FIXER_API_KEY is not set', partial: true, rates: { EUR: 0 } },
    );
  }
  return NextResponse.json({ coin: symbol, rates: result.rates, partial: false });
}
