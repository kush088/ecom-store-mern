import { createContext, useContext, useEffect, useState } from 'react';

const CartContext = createContext(null);
export const useCart = () => useContext(CartContext);

// Cart stores minimal data; prices are always re-quoted by the server.
export function CartProvider({ children }) {
  const [items, setItems] = useState(() => {
    try { return JSON.parse(localStorage.getItem('cart')) || []; } catch { return []; }
  });
  const [coupon, setCoupon] = useState(() => localStorage.getItem('coupon') || '');

  useEffect(() => localStorage.setItem('cart', JSON.stringify(items)), [items]);
  useEffect(() => localStorage.setItem('coupon', coupon), [coupon]);

  const add = (p, qty = 1, size) => {
    setItems((prev) => {
      const i = prev.findIndex((x) => x.product === p._id && x.size === size);
      if (i >= 0) {
        const next = [...prev];
        next[i] = { ...next[i], qty: Math.min(next[i].qty + qty, p.stock || 99) };
        return next;
      }
      return [...prev, { product: p._id, name: p.name, image: p.images?.[0]?.url, price: p.price, slug: p.slug, qty, size }];
    });
  };
  const setQty = (product, size, qty) =>
    setItems((prev) => prev.map((x) => (x.product === product && x.size === size ? { ...x, qty: Math.max(1, qty) } : x)));
  const remove = (product, size) => setItems((prev) => prev.filter((x) => !(x.product === product && x.size === size)));
  const clear = () => { setItems([]); setCoupon(''); };
  const count = items.reduce((n, i) => n + i.qty, 0);

  return <CartContext.Provider value={{ items, coupon, setCoupon, add, setQty, remove, clear, count }}>{children}</CartContext.Provider>;
}
