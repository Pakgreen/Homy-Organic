import { create } from 'zustand';
import { persist } from 'zustand/middleware';

interface CartItem {
  _id: string;
  name: string;
  price: number;
  quantity: number;
  image: string;
}

interface CartStore {
  items: CartItem[];
  isOpen: boolean;
  addItem: (item: CartItem) => void;
  removeItem: (id: string) => void;
  updateQuantity: (id: string, quantity: number) => void;
  clearCart: () => void;
  getTotalItems: () => number;
  getTotalPrice: () => number;
  openCart: () => void;
  closeCart: () => void;
  toggleCart: () => void;
}

export const useCartStore = create<CartStore>()(
  persist(
    (set, get) => ({
      items: [],
      isOpen: false,
      
      openCart: () => set({ isOpen: true }),
      closeCart: () => set({ isOpen: false }),
      toggleCart: () => set((state) => ({ isOpen: !state.isOpen })),

      addItem: (item: CartItem) => {
        const items = get().items;
        const existingItem = items.find((i) => i._id === item._id);

        if (existingItem) {
          set({
            items: items.map((i) =>
              i._id === item._id
                ? { ...i, quantity: i.quantity + item.quantity }
                : i
            ),
            isOpen: true,
          });
        } else {
          set({ items: [...items, item], isOpen: true });
        }
      },

      removeItem: (id: string) => {
        set({ items: get().items.filter((i) => i._id !== id) });
      },

      updateQuantity: (id: string, quantity: number) => {
        set({
          items: get().items.map((i) =>
            i._id === id ? { ...i, quantity: Math.max(1, quantity) } : i
          ),
        });
      },

      clearCart: () => {
        set({ items: [] });
      },

      getTotalItems: () => {
        return get().items.reduce((total, item) => total + item.quantity, 0);
      },

      getTotalPrice: () => {
        return get().items.reduce((total, item) => total + item.price * item.quantity, 0);
      },
    }),
    {
      name: 'cart-storage',
      partialize: (state) => ({ items: state.items }), // Only persist items, not isOpen
    }
  )
);
