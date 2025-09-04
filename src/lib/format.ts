export function formatCurrency(cents: number, currency='usd') {
    return new Intl.NumberFormat(undefined, { style: 'currency', currency }).format((cents ?? 0) / 100)
  }