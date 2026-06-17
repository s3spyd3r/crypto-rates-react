export type Coin = {
  id: string;
  name: string;
  color: string;
  logo: string;
};

export type FiatRates = Record<string, number>;

export type ApiResult<T> =
  | { ok: true; data: T }
  | { ok: false; error: string };
