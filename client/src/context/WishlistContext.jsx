import { createContext, useContext, useEffect, useState, useCallback } from 'react';
import api from '../api/axios';
import { useAuth } from './AuthContext';

const WishlistContext = createContext(null);
export const useWishlist = () => useContext(WishlistContext);

export function WishlistProvider({ children }) {
  const { user } = useAuth();
  const [ids, setIds] = useState([]);

  const load = useCallback(async () => {
    if (!user) return setIds([]);
    try {
      const { data } = await api.get('/users/wishlist');
      setIds(data.map((p) => p._id));
    } catch { /* ignore */ }
  }, [user]);
  useEffect(() => { load(); }, [load]);

  // returns false if user must log in first
  const toggle = async (productId) => {
    if (!user) return false;
    if (ids.includes(productId)) {
      setIds((x) => x.filter((i) => i !== productId));
      await api.delete(`/users/wishlist/${productId}`);
    } else {
      setIds((x) => [...x, productId]);
      await api.post(`/users/wishlist/${productId}`);
    }
    return true;
  };

  return <WishlistContext.Provider value={{ ids, toggle, has: (id) => ids.includes(id), reload: load }}>{children}</WishlistContext.Provider>;
}
