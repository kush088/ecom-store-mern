import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import api from '../api/axios';
import { useWishlist } from '../context/WishlistContext';
import { ProductGrid } from '../components/ProductCard';

export default function Wishlist() {
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const { ids } = useWishlist();

  useEffect(() => {
    api.get('/users/wishlist').then((r) => setItems(r.data)).finally(() => setLoading(false));
  }, []);
  // reflect removals made via the heart button
  const visible = items.filter((p) => ids.includes(p._id));

  return (
    <div className="container section">
      <h1 style={{ fontSize: '2.4rem', marginBottom: 20 }}>My Wishlist</h1>
      {!loading && visible.length === 0 ? (
        <div className="center muted"><p>Your wishlist is empty.</p><Link className="btn" style={{ marginTop: 16 }} to="/shop">Discover jewellery</Link></div>
      ) : <ProductGrid items={visible} loading={loading} />}
    </div>
  );
}
