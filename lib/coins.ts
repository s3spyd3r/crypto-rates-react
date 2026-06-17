import type { Coin } from './types';

export const COINS: readonly Coin[] = [
  { id: 'BTC', name: 'Bitcoin',     color: '#0B1F3A', logo: '/img/btc.svg' },
  { id: 'ETH', name: 'Ethereum',    color: '#C99D66', logo: '/img/eth.svg' },
  { id: 'LTC', name: 'Litecoin',    color: '#0F1626', logo: '/img/ltc.svg' },
  { id: 'XLM', name: 'Stellar',     color: '#A6A6A6', logo: '/img/xlm.svg' },
  { id: 'XRP', name: 'XRP',         color: '#A6A6A6', logo: '/img/xrp.svg' },
  { id: 'BCH', name: 'Bitcoin Cash', color: '#0B2E3D', logo: '/img/bch.svg' },
] as const;

export const COIN_BY_ID: Readonly<Record<string, Coin>> = Object.freeze(
  COINS.reduce<Record<string, Coin>>((acc, c) => {
    acc[c.id] = c;
    return acc;
  }, {}),
);

export const DEFAULT_COIN = 'BTC';
export const DEFAULT_FIAT = 'EUR';

export function isCoinId(id: string): id is Coin['id'] {
  return id in COIN_BY_ID;
}

export function pickReadableTextColor(hex: string): '#000000' | '#FFFFFF' {
  const h = hex.replace('#', '');
  const full = h.length === 3 ? h.split('').map((c) => c + c).join('') : h;
  const r = parseInt(full.slice(0, 2), 16);
  const g = parseInt(full.slice(2, 4), 16);
  const b = parseInt(full.slice(4, 6), 16);
  const lum = 0.299 * r + 0.587 * g + 0.114 * b;
  return lum > 186 ? '#000000' : '#FFFFFF';
}
