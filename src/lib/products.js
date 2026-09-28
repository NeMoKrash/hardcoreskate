export const SIZES = ['8.25"', '8.5"']

export const STATUS_LABELS = {
  in_stock: 'В НАЛИЧИИ',
  sold_out: 'SOLD OUT',
  coming_soon: 'СКОРО',
}

export const STATUS_OPTIONS = [
  { value: 'in_stock', label: STATUS_LABELS.in_stock },
  { value: 'coming_soon', label: STATUS_LABELS.coming_soon },
  { value: 'sold_out', label: STATUS_LABELS.sold_out },
]

// Resolves the status actually shown to shoppers: an explicit "sold_out" or
// "coming_soon" always wins, otherwise it falls back to per-size stock counts.
export function getDisplayStatus(product) {
  if (!product) return 'sold_out'
  if (product.status === 'coming_soon') return 'coming_soon'
  if (product.status === 'sold_out') return 'sold_out'
  const allZero = SIZES.every((size) => Number(product.sizes?.[size] ?? 0) <= 0)
  return allZero ? 'sold_out' : 'in_stock'
}

export function isPurchasable(product) {
  return getDisplayStatus(product) === 'in_stock'
}

export function isSizeAvailable(product, size) {
  if (getDisplayStatus(product) !== 'in_stock') return false
  return Number(product?.sizes?.[size] ?? 0) > 0
}

export function formatPrice(price) {
  return Number(price || 0).toLocaleString('ru-RU')
}

export function coverImage(product) {
  return product?.images?.[0] || null
}
