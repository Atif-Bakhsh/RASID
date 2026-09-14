// Format exact decimal strings without converting authoritative amounts to Number.
export function formatMoney(value: string): string {
  const [whole, fraction] = value.split('.');
  return `${whole.replace(/\B(?=(\d{3})+(?!\d))/g, ',')}.${(fraction ?? '').padEnd(2, '0')}`;
}

export function monthStatus(
  month: string,
  now = new Date(),
): 'current' | 'future' | 'past' {
  const current = now.toISOString().slice(0, 7);
  return month === current ? 'current' : month > current ? 'future' : 'past';
}
