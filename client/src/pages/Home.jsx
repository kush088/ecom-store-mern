
import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import api from '../api/axios';
import { ProductGrid } from '../components/ProductCard';

const ICONS = ['👖', '👕','🧢' ];

const DEFAULT_BANNER = {
  title: 'Discover Something You’ll Love',
  subtitle:
    'Explore the latest trends, discover your favourite styles, and find something special for every occasion.',
  ctaText: 'Explore Now',
  link: '/shop',
};

const DEFAULT_PROMO_TITLE = 'Own Your Style';

const DEFAULT_PROMO_SUBTITLE =
  'Fresh fits. Bold looks. Discover the latest fashion for men and women.';

function Row({ title, sub, items, to }) {
  if (!items?.length) return null;

  return (
    <section className="section">
      <div className="container">
        <h2 className="section-title">{title}</h2>
        <p className="section-sub">{sub}</p>

        <ProductGrid items={items} />

        {to && (
          <div className="center" style={{ marginTop: 26 }}>
            <Link className="btn outline" to={to}>
              View all
            </Link>
          </div>
        )}
      </div>
    </section>
  );
}

function PromoVideo({ content }) {
  if (!content?.promoVideoEnabled || !content?.promoVideo?.url) {
    return null;
  }

  const title = content.promoVideoTitle || DEFAULT_PROMO_TITLE;
  const subtitle =
    content.promoVideoSubtitle || DEFAULT_PROMO_SUBTITLE;

  return (
    <section
      className="promo-hero"
      aria-label="Homepage promotional video"
      style={{
        position: 'relative',
        width: '100%',
        minHeight: 'clamp(420px, 58vw, 720px)',
        overflow: 'hidden',
        display: 'flex',
        alignItems: 'center',
        background: '#171717',
        color: '#fff',
        isolation: 'isolate',
      }}
    >
      <video
        key={content.promoVideo.url}
        className="promo-hero-video"
        src={content.promoVideo.url}
        autoPlay
        muted
        loop
        playsInline
        preload="metadata"
        aria-label={title}
        style={{
          position: 'absolute',
          inset: 0,
          width: '100%',
          height: '100%',
          objectFit: 'cover',
          objectPosition: 'center',
          zIndex: -2,
        }}
      >
        Your browser does not support video playback.
      </video>

      {/* Dark gradient keeps the text readable over the video. */}
      <div
        aria-hidden="true"
        style={{
          position: 'absolute',
          inset: 0,
          background:
            'linear-gradient(90deg, rgba(0,0,0,0.72) 0%, rgba(0,0,0,0.36) 48%, rgba(0,0,0,0.08) 100%)',
          zIndex: -1,
        }}
      />

      <div
        className="container"
        style={{
          width: '100%',
          paddingTop: 70,
          paddingBottom: 70,
        }}
      >
        <div
          className="promo-hero-content"
          style={{
            maxWidth: 650,
            animation: 'none',
          }}
        >
          <span
            style={{
              display: 'inline-block',
              marginBottom: 18,
              fontSize: 12,
              fontWeight: 600,
              letterSpacing: '0.22em',
              textTransform: 'uppercase',
            }}
          >
            NEW SEASON · NEW STYLE
          </span>

          <h1
            className="serif"
            style={{
              fontSize: 'clamp(2.6rem, 6vw, 5.5rem)',
              lineHeight: 1.05,
              marginBottom: 20,
              color: '#fff',
              overflowWrap: 'anywhere',
            }}
          >
            {title}
          </h1>

          <p
            style={{
              maxWidth: 520,
              marginBottom: 30,
              fontSize: 'clamp(1rem, 1.5vw, 1.2rem)',
              lineHeight: 1.8,
              color: 'rgba(255,255,255,0.9)',
            }}
          >
            {subtitle}
          </p>

          <Link
            to="/shop"
            className="btn"
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: 10,
            }}
          >
            Shop Now <span aria-hidden="true">↗</span>
          </Link>
        </div>
      </div>
    </section>
  );
}

function HeroBanner({ banners }) {
  const [i, setI] = useState(0);

  useEffect(() => {
    if (banners.length < 2) return undefined;

    const timer = setInterval(() => {
      setI((current) => (current + 1) % banners.length);
    }, 5500);

    return () => clearInterval(timer);
  }, [banners.length]);

  useEffect(() => {
    if (banners.length > 0 && i >= banners.length) {
      setI(0);
    }
  }, [banners.length, i]);

  const banner = banners[i] || DEFAULT_BANNER;

  return (
    <section className="hero">
      {banner.image?.url && (
        <img
          className="bg"
          src={banner.image.url}
          alt=""
        />
      )}

      <div className="container">
        <div className="content" key={i}>
          <h1 className="serif">{banner.title}</h1>

          <p>{banner.subtitle}</p>

          <Link
            to={banner.link || '/shop'}
            className="btn"
          >
            {banner.ctaText || 'Explore Now'}
          </Link>
        </div>
      </div>

      {banners.length > 1 && (
        <div className="dots">
          {banners.map((item, index) => (
            <button
              key={item._id || index}
              type="button"
              className={index === i ? 'on' : ''}
              onClick={() => setI(index)}
              aria-label={`Slide ${index + 1}`}
              aria-pressed={index === i}
            />
          ))}
        </div>
      )}
    </section>
  );
}

export default function Home() {
  const [banners, setBanners] = useState([]);
  const [cats, setCats] = useState([]);
  const [data, setData] = useState({});
  const [tests, setTests] = useState([]);
  const [homeContent, setHomeContent] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;

    const loadHome = async () => {
      const results = await Promise.allSettled([
        api.get('/banners'),
        api.get('/categories'),
        api.get('/products/home'),
        api.get('/testimonials'),
        api.get('/home-content'),
      ]);

      if (cancelled) return;

      const [
        bannerResult,
        categoryResult,
        productsResult,
        testsResult,
        contentResult,
      ] = results;

      if (bannerResult.status === 'fulfilled') {
        const bannerData = bannerResult.value.data;

        setBanners(
          Array.isArray(bannerData) ? bannerData : []
        );
      }

      if (categoryResult.status === 'fulfilled') {
        const categoryData = categoryResult.value.data;

        setCats(
          Array.isArray(categoryData) ? categoryData : []
        );
      }

      if (productsResult.status === 'fulfilled') {
        setData(productsResult.value.data || {});
      }

      if (testsResult.status === 'fulfilled') {
        const testimonialData = testsResult.value.data;

        setTests(
          Array.isArray(testimonialData)
            ? testimonialData
            : []
        );
      }

      if (contentResult.status === 'fulfilled') {
        setHomeContent(contentResult.value.data);
      }

      setLoading(false);
    };

    loadHome();

    return () => {
      cancelled = true;
    };
  }, []);

  const showPromoVideo = Boolean(
    homeContent?.promoVideoEnabled &&
    homeContent?.promoVideo?.url
  );

  return (
    <>
      {/* Top homepage hero: video replaces the default banner. */}
      {showPromoVideo ? (
        <PromoVideo content={homeContent} />
      ) : (
        <HeroBanner banners={banners} />
      )}

      {/* Shop by collection */}
      <section className="section">
        <div className="container">
          <h2 className="section-title">
            Shop by Collection
          </h2>

          <p className="section-sub">
            Explore our curated categories
          </p>

          <div className="cat-grid">
            {cats.map((category, index) => (
              <Link
                key={category._id}
                to={`/category/${category.slug}`}
                className="cat-tile"
              >
                <div className="gem">
                  {category.image?.url ? (
                    <img
                      src={category.image.url}
                      alt={category.name || ''}
                      style={{
                        height: 48,
                        margin: '0 auto',
                        objectFit: 'contain',
                      }}
                    />
                  ) : (
                    ICONS[index % ICONS.length]
                  )}
                </div>

                <h3>{category.name}</h3>
              </Link>
            ))}
          </div>
        </div>
      </section>

      {/* Loading products */}
      {loading && (
        <div className="container">
          <ProductGrid loading />
        </div>
      )}

      {/* Featured products */}
      <Row
        title="Featured Collection"
        sub="Hand-picked for your style"
        items={data.featured}
        to="/shop?sort=featured"
      />

      {/* Bestselling products */}
      <Row
        title="Bestsellers"
        sub="Popular picks for every occasion"
        items={data.bestsellers}
        to="/shop?sort=popularity"
      />

      {/* Welcome offer */}
      <section className="container">
        <div className="offer">
          <h2 style={{ fontSize: '2.2rem' }}>
            Welcome Offer
          </h2>

          <p style={{ margin: '8px 0 16px' }}>
            Get 10% off on your first order above ₹5,000
            (up to ₹5,000). Use code{' '}
            <code>WELCOME10</code>
          </p>

          <Link to="/shop" className="btn">
            Start Shopping
          </Link>
        </div>
      </section>

      {/* New arrivals */}
      <Row
        title="New Arrivals"
        sub="Discover the latest additions"
        items={data.newArrivals}
        to="/shop?sort=newest"
      />

      {/* Trending products */}
      <Row
        title="Trending Now"
        sub="Discover what's popular"
        items={data.trending}
        to="/shop?sort=popularity"
      />

      {/* Customer testimonials */}
      {tests.length > 0 && (
        <section className="section">
          <div className="container">
            <h2 className="section-title">
              Words from Our Customers
            </h2>

            <p className="section-sub">
              Trusted by our customers
            </p>

            <div className="tgrid">
              {tests.map((testimonial) => (
                <div
                  className="quote"
                  key={testimonial._id}
                >
                  <p>“{testimonial.text}”</p>

                  <b>{testimonial.name}</b>{' '}

                  <span className="muted">
                    · {testimonial.city}
                  </span>
                </div>
              ))}
            </div>
          </div>
        </section>
      )}
    </>
  );
}
