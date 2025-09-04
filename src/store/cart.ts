import { create } from 'zustand'

export type CartItem = {
  id: string
  name: string
  price_cents: number
  currency: string
  qty: number
}

type CartState = {
  items: CartItem[]
  add: (item: Omit<CartItem, 'qty'>) => void
  inc: (id: string) => void
  dec: (id: string) => void
  remove: (id: string) => void
  clear: () => void
  subtotal: () => number
}

export const useCart = create<CartState>((set, get) => ({
  items: [],
  add: (item) =>
    set(state => {
      const found = state.items.find(i => i.id === item.id)
      if (found) {
        return {
          items: state.items.map(i => (i.id === item.id ? { ...i, qty: i.qty + 1 } : i)),
        }
      }
      return { items: [...state.items, { ...item, qty: 1 }] }
    }),
  inc: (id) =>
    set(state => ({ items: state.items.map(i => (i.id === id ? { ...i, qty: i.qty + 1 } : i)) })),
  dec: (id) =>
    set(state => {
      const it = state.items.find(i => i.id === id)
      if (!it) return state
      if (it.qty <= 1) return { items: state.items.filter(i => i.id !== id) }
      return { items: state.items.map(i => (i.id === id ? { ...i, qty: i.qty - 1 } : i)) }
    }),
  remove: (id) => set(state => ({ items: state.items.filter(i => i.id !== id) })),
  clear: () => set({ items: [] }),
  subtotal: () => get().items.reduce((sum, i) => sum + i.qty * i.price_cents, 0),
}))