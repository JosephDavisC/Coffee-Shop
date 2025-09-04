import { create } from 'zustand'
import { persist } from 'zustand/middleware'

export type CartItem = {
  id: string
  name: string
  price_cents: number
  image_url?: string | null
  qty: number
}

type CartState = {
  items: CartItem[]
  add: (item: Omit<CartItem, 'qty'>, qty?: number) => void
  setQty: (id: string, qty: number) => void
  remove: (id: string) => void
  clear: () => void
  count: () => number
  subtotal: () => number
}

export const useCart = create<CartState>()(
  persist(
    (set, get) => ({
      items: [],
      add: (item, qty = 1) =>
        set(s => {
          const i = s.items.findIndex(x => x.id === item.id)
          if (i >= 0) {
            const next = [...s.items]
            next[i] = { ...next[i], qty: next[i].qty + qty }
            return { items: next }
          }
          return { items: [...s.items, { ...item, qty }] }
        }),
      setQty: (id, qty) =>
        set(s => ({ items: s.items.map(i => (i.id === id ? { ...i, qty } : i)) })),
      remove: (id) => set(s => ({ items: s.items.filter(i => i.id !== id) })),
      clear: () => set({ items: [] }),
      count: () => get().items.reduce((n, i) => n + i.qty, 0),
      subtotal: () => get().items.reduce((sum, i) => sum + i.price_cents * i.qty, 0),
    }),
    { name: 'coffee-cart' }
  )
)
