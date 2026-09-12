export const MONEY_PATTERN = /^(0|[1-9]\d{0,11})(\.\d{1,2})?$/;
export const SIGNED_MONEY_PATTERN = /^-?(0|[1-9]\d{0,11})(\.\d{1,2})?$/;

/** Amounts cross the API/DB as strings; integer minor units do arithmetic. */
export function toMinor(value: string): bigint {
  const negative = value.startsWith('-');
  const [whole, fraction = ''] = (negative ? value.slice(1) : value).split('.');
  const cents = BigInt(whole) * 100n + BigInt(fraction.padEnd(2, '0'));
  return negative ? -cents : cents;
}

export function fromMinor(value: bigint): string {
  const absolute = value < 0n ? -value : value;
  return `${value < 0n ? '-' : ''}${absolute / 100n}.${String(absolute % 100n).padStart(2, '0')}`;
}

export function money(value: string): string {
  return fromMinor(toMinor(value));
}
