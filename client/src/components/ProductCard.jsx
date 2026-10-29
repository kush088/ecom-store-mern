import { Link, useNavigate } from 'react-router-dom';
import { inr } from '../api/axios';
import { useWishlist } from '../context/WishlistContext';
import { useToast } from '../context/ToastContext';

export default function ProductCard({ p }) {
  const { has, toggle } = useWishlist();
  const toast = useToast();
  const nav = useNavigate();
  const liked = has(p._id);

  const images = Array.isArray(p.images) ? p.images : [];
  const firstImage = images[0]?.url;
  const secondImage = images[1]?.url;

  const onHeart = async (e) => {
    e.preventDefault();
    e.stopPropagation();

    const ok = await toggle(p._id);

    if (!ok) {
      toast('Please log in to save favourites', 'err');
      nav('/login');
    }
  };

  // Clothing product details
  const meta = [p.material || p.fabric, p.style]
    .filter(Boolean)
    .join(' · ');

  return (
    <Link to={`/product/${p.slug}`} className="pcard">
      <div className={`img ${secondImage ? 'has-hover-image' : ''}`}>
        {firstImage ? (
          <>
            <img
              src={firstImage}
              alt={p.name}
              loading="lazy"
              className="primary-image"
            />

            {secondImage && (
              <img
                src={secondImage}
                alt={`${p.name} alternate view`}
                loading="lazy"
                aria-hidden="true"
                className="secondary-image"
              />
            )}
          </>
        ) : (
          <span className="image-placeholder">🛍️</span>
        )}

        {p.stock === 0 && (
          <div className="oos">Out of stock</div>
        )}
      </div>

      {p.discountPercent > 0 && (
        <span className="tag">{p.discountPercent}% OFF</span>
      )}

      <button
        type="button"
        className={`heart ${liked ? 'on' : ''}`}
        onClick={onHeart}
        aria-label={liked ? 'Remove from wishlist' : 'Add to wishlist'}
      >
        {liked ? '♥' : '♡'}
      </button>

      <div className="body">
        <span className="name">{p.name}</span>

        {meta && <span className="meta">{meta}</span>}

        <span className="price">
          {inr(p.price)}
          {p.mrp > p.price && <s>{inr(p.mrp)}</s>}
        </span>
      </div>
    </Link>
  );
}

export function ProductGrid({ items, loading }) {
  if (loading) {
    return (
      <div className="pgrid">
        {Array.from({ length: 8 }).map((_, i) => (
          <div key={i} className="skeleton" />
        ))}
      </div>
    );
  }

  if (!items?.length) {
    return (
      <p className="muted center" style={{ padding: 40 }}>
        No products found.
      </p>
    );
  }

  return (
    <div className="pgrid">
      {items.map((p) => (
        <ProductCard key={p._id} p={p} />
      ))}
    </div>
  );
}
