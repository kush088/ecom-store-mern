import { useEffect, useRef, useState } from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import api, { errMsg, inr } from '../api/axios';
import { useCart } from '../context/CartContext';
import { useWishlist } from '../context/WishlistContext';
import { useToast } from '../context/ToastContext';
import { useAuth } from '../context/AuthContext';
import ProductCard from '../components/ProductCard';

export default function ProductDetails() {
  const { slug } = useParams();
  const [d, setD] = useState(null);
  const [err, setErr] = useState('');
  const [img, setImg] = useState(0);
  const [selectedMedia, setSelectedMedia] = useState('image');
  const [size, setSize] = useState('');
  const [qty, setQty] = useState(1);
  const [rv, setRv] = useState({ rating: 5, comment: '' });

  const zoomRef = useRef(null);

  const { add } = useCart();
  const { has, toggle } = useWishlist();
  const { user } = useAuth();
  const toast = useToast();
  const nav = useNavigate();

  useEffect(() => {
    setD(null);
    setErr('');
    setImg(0);
    setSelectedMedia('image');
    setSize('');
    setQty(1);

    api
      .get(`/products/slug/${slug}`)
      .then((r) => setD(r.data))
      .catch((e) => setErr(errMsg(e)));
  }, [slug]);

  if (err) {
    return (
      <div className="container section center">
        <h2>{err}</h2>
        <Link
          to="/shop"
          className="btn"
          style={{ marginTop: 16 }}
        >
          Back to shop
        </Link>
      </div>
    );
  }

  if (!d) {
    return (
      <div className="container section">
        <div className="skeleton" style={{ minHeight: 480 }} />
      </div>
    );
  }

  const { product: p, related = [], reviews = [] } = d;

  const images = Array.isArray(p.images) ? p.images : [];
  const videoUrl = p.video?.url || '';
  const needSize = Array.isArray(p.sizes) && p.sizes.length > 0;

  const occasionText = Array.isArray(p.occasion)
    ? p.occasion.join(', ')
    : p.occasion;

  const sizeText = Array.isArray(p.sizes)
    ? p.sizes.join(', ')
    : '';

  const materialLabel = p.material
    ? p.material
    : p.fabric;

  const onMove = (e) => {
    const container = zoomRef.current;
    if (!container) return;

    const image = container.querySelector('img');
    if (!image) return;

    const rect = container.getBoundingClientRect();

    image.style.transformOrigin = `${
      ((e.clientX - rect.left) / rect.width) * 100
    }% ${((e.clientY - rect.top) / rect.height) * 100}%`;

    image.style.transform = 'scale(2.2)';
  };

  const onLeave = () => {
    const image = zoomRef.current?.querySelector('img');

    if (image) {
      image.style.transform = 'scale(1)';
      image.style.transformOrigin = 'center center';
    }
  };

  const selectImage = (index) => {
    setImg(index);
    setSelectedMedia('image');
  };

  const addToCart = (goCheckout) => {
    if (needSize && !size) {
      return toast('Please select a size', 'err');
    }

    if (p.stock <= 0) {
      return toast('This product is currently out of stock', 'err');
    }

    if (qty > p.stock) {
      return toast(`Only ${p.stock} items are available`, 'err');
    }

    add(p, qty, size || undefined);
    toast('Added to cart');

    if (goCheckout) nav('/cart');
  };

  const heart = async () => {
    const ok = await toggle(p._id);

    if (!ok) {
      toast('Please log in to save favourites', 'err');
      nav('/login');
    }
  };

  const submitReview = async (e) => {
    e.preventDefault();

    try {
      await api.post(`/products/${p._id}/reviews`, {
        ...rv,
        rating: Number(rv.rating),
      });

      toast('Review saved');
      setRv({ rating: 5, comment: '' });
    } catch (er) {
      toast(errMsg(er), 'err');
    }
  };

  // Clothing-specific product specifications.
  // Jewellery-specific fields have been removed.
  const rows = [
    ['Fabric', materialLabel],
    ['Style', p.style],
    ['Occasion', occasionText],
    ['Gender', p.gender],
    ['Age Group', p.ageGroup],
    ['Available Sizes', sizeText],
    ['SKU', p.sku],
  ].filter(([, value]) => value);

  return (
    <div className="container section" style={{ paddingTop: 28 }}>
      <div className="crumbs">
        <Link to="/">Home</Link>
        {' / '}

        {p.category?.slug ? (
          <Link to={`/category/${p.category.slug}`}>
            {p.category.name}
          </Link>
        ) : (
          p.category?.name
        )}

        {p.subcategory && (
          <>
            {' / '}
            <Link to={`/category/${p.subcategory.slug}`}>
              {p.subcategory.name}
            </Link>
          </>
        )}

        {' / '}
        {p.name}
      </div>

      <div className="pd">
        {/* Product media gallery */}
        <div>
          <div
            className="zoom"
            ref={zoomRef}
            onMouseMove={selectedMedia === 'image' ? onMove : undefined}
            onMouseLeave={onLeave}
          >
            {selectedMedia === 'video' && videoUrl ? (
              <video
                key={videoUrl}
                src={videoUrl}
                controls
                playsInline
                preload="metadata"
                aria-label={`${p.name} product video`}
                style={{
                  display: 'block',
                  width: '100%',
                  height: '100%',
                  maxHeight: 600,
                  objectFit: 'contain',
                  background: '#111',
                }}
              >
                Your browser does not support HTML video.
              </video>
            ) : images[img]?.url ? (
              <img
                src={images[img].url}
                alt={p.name}
                style={{
                  transition: 'transform 0.25s ease',
                }}
              />
            ) : (
              <div
                className="center"
                style={{ fontSize: 80, paddingTop: '30%' }}
              >
                🛍️
              </div>
            )}
          </div>

          {/* Image thumbnails and optional video thumbnail */}
          {(images.length > 1 || videoUrl) && (
            <div className="thumbs">
              {images.map((image, index) => (
                <button
                  type="button"
                  key={image.publicId || image.url || index}
                  className={
                    selectedMedia === 'image' && index === img ? 'on' : ''
                  }
                  onClick={() => selectImage(index)}
                  aria-label={`View product image ${index + 1}`}
                >
                  <img
                    src={image.url}
                    alt={`${p.name} ${index + 1}`}
                  />
                </button>
              ))}

              {videoUrl && (
                <button
                  type="button"
                  className={selectedMedia === 'video' ? 'on' : ''}
                  onClick={() => setSelectedMedia('video')}
                  aria-label={`Play ${p.name} product video`}
                  title="Play product video"
                  style={{
                    position: 'relative',
                    overflow: 'hidden',
                    background: '#222',
                    color: '#fff',
                    minWidth: 64,
                    minHeight: 64,
                  }}
                >
                  <span
                    aria-hidden="true"
                    style={{
                      fontSize: 26,
                      display: 'block',
                    }}
                  >
                    ▶
                  </span>

                  <span style={{ fontSize: 10 }}>VIDEO</span>
                </button>
              )}
            </div>
          )}

          {videoUrl && (
            <p className="muted" style={{ fontSize: 12, marginTop: 8 }}>
              Select VIDEO to watch the product in motion.
            </p>
          )}
        </div>

        {/* Product information */}
        <div>
          <h1 style={{ fontSize: '2.3rem', lineHeight: 1.15 }}>
            {p.name}
          </h1>

          {p.ratingCount > 0 && (
            <p className="muted">
              ★ {Number(p.ratingAvg || 0).toFixed(1)} (
              {p.ratingCount} reviews)
            </p>
          )}

          <p
            className="price"
            style={{ fontSize: '1.6rem', margin: '10px 0' }}
          >
            {inr(p.price)}

            {p.mrp > p.price && (
              <>
                <s>{inr(p.mrp)}</s>
                <span className="off">{p.discountPercent}% off</span>
              </>
            )}
          </p>

          <p className="muted" style={{ fontSize: '.8rem' }}>
            Check the available sizes before adding this item to your cart.
          </p>

          <p style={{ margin: '14px 0' }}>{p.description}</p>

          {rows.length > 0 && (
            <table className="specs">
              <tbody>
                {rows.map(([key, value]) => (
                  <tr key={key}>
                    <td>{key}</td>
                    <td>{value}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}

          {needSize && (
            <>
              <b>Size</b>

              <div className="sizes">
                {p.sizes.map((s) => (
                  <button
                    type="button"
                    key={s}
                    className={s === size ? 'on' : ''}
                    onClick={() => setSize(s)}
                    aria-pressed={s === size}
                  >
                    {s}
                  </button>
                ))}
              </div>
            </>
          )}

          <p
            style={{
              marginBottom: 12,
              color: p.stock > 0 ? 'var(--ok)' : 'var(--danger)',
              fontWeight: 500,
            }}
          >
            {p.stock === 0
              ? 'Out of stock'
              : p.stock <= 5
                ? `Only ${p.stock} left`
                : 'In stock'}
          </p>

          <div
            style={{
              display: 'flex',
              gap: 12,
              flexWrap: 'wrap',
              alignItems: 'center',
            }}
          >
            <div className="qty">
              <button
                type="button"
                onClick={() => setQty((q) => Math.max(1, q - 1))}
                aria-label="Decrease quantity"
                disabled={qty <= 1}
              >
                −
              </button>

              <span>{qty}</span>

              <button
                type="button"
                onClick={() =>
                  setQty((q) => Math.min(p.stock || 1, q + 1))
                }
                aria-label="Increase quantity"
                disabled={p.stock <= 0 || qty >= p.stock}
              >
                +
              </button>
            </div>

            <button
              type="button"
              className="btn"
              disabled={p.stock <= 0}
              onClick={() => addToCart(false)}
            >
              Add to Cart
            </button>

            <button
              type="button"
              className="btn dark"
              disabled={p.stock <= 0}
              onClick={() => addToCart(true)}
            >
              Buy Now
            </button>

            <button
              type="button"
              className="btn outline"
              onClick={heart}
            >
              {has(p._id) ? '♥ Saved' : '♡ Wishlist'}
            </button>
          </div>

          <div
            className="card"
            style={{ marginTop: 20, fontSize: '.9rem' }}
          >
            🚚 {p.deliveryInfo || 'Delivery details available at checkout.'}
            <br />
            ↩️ 7-day return policy · 🔒 Secure payments
          </div>
        </div>
      </div>

      {/* Reviews */}
      <section style={{ marginTop: 48 }}>
        <h2 style={{ fontSize: '1.8rem', marginBottom: 12 }}>
          Reviews
        </h2>

        {reviews.length === 0 && (
          <p className="muted">No reviews yet.</p>
        )}

        {reviews.map((review) => (
          <div
            key={review._id}
            className="card"
            style={{ marginBottom: 10 }}
          >
            <b>{review.name}</b> · {'★'.repeat(review.rating)}
            <p>{review.comment}</p>
          </div>
        ))}

        {user && (
          <form
            onSubmit={submitReview}
            className="card"
            style={{ maxWidth: 520, marginTop: 14 }}
          >
            <p className="muted" style={{ marginBottom: 8 }}>
              Received this product? Share your thoughts.
            </p>

            <div className="field">
              <label>Rating</label>

              <select
                value={rv.rating}
                onChange={(e) =>
                  setRv({ ...rv, rating: Number(e.target.value) })
                }
              >
                {[5, 4, 3, 2, 1].map((n) => (
                  <option key={n} value={n}>
                    {n} ★
                  </option>
                ))}
              </select>
            </div>

            <div className="field">
              <label>Comment</label>

              <textarea
                rows="3"
                value={rv.comment}
                onChange={(e) =>
                  setRv({ ...rv, comment: e.target.value })
                }
              />
            </div>

            <button className="btn sm">Submit review</button>
          </form>
        )}
      </section>

      {/* Related products */}
      {related.length > 0 && (
        <section style={{ marginTop: 48 }}>
          <h2 style={{ fontSize: '1.8rem', marginBottom: 16 }}>
            You may also like
          </h2>

          <div className="pgrid">
            {related.map((relatedProduct) => (
              <ProductCard
                key={relatedProduct._id}
                p={relatedProduct}
              />
            ))}
          </div>
        </section>
      )}
    </div>
  );
}
