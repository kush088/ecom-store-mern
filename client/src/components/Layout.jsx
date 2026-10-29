
import { useEffect, useState } from 'react';
import {
  Link,
  NavLink,
  Outlet,
  useNavigate,
  useLocation,
} from 'react-router-dom';

import api from '../api/axios';
import { useAuth } from '../context/AuthContext';
import { useCart } from '../context/CartContext';
import { useWishlist } from '../context/WishlistContext';
import Newsletter from './Newsletter';

export default function Layout() {
  const [cats, setCats] = useState([]);
  const [q, setQ] = useState('');

  const { user, logout } = useAuth();
  const { count } = useCart();
  const { ids } = useWishlist();

  const nav = useNavigate();
  const { pathname } = useLocation();

  const isAdmin = user?.role === 'admin';

  useEffect(() => {
    let active = true;

    api
      .get('/categories')
      .then((response) => {
        if (active) {
          setCats(
            Array.isArray(response.data) ? response.data : []
          );
        }
      })
      .catch(() => {
        if (active) setCats([]);
      });

    return () => {
      active = false;
    };
  }, []);

  useEffect(() => {
    window.scrollTo(0, 0);
  }, [pathname]);

  const search = (event) => {
    event.preventDefault();

    const query = q.trim();

    if (query) {
      nav(`/search?q=${encodeURIComponent(query)}`);
    }
  };

  const handleLogout = async () => {
    try {
      await logout();
      nav('/', { replace: true });
    } catch (error) {
      console.error('Logout failed:', error);
    }
  };

  return (
    <>
      <div className="topbar">
        Discover your style · New looks for every occasion
      </div>

      <header className="header">
        <div className="container row">
          <Link to="/" className="logo" aria-label="Aurelia home">
            AURELIA
          </Link>

          <form className="searchbar" onSubmit={search}>
            <input
              value={q}
              onChange={(event) => setQ(event.target.value)}
              placeholder="Search shirts, dresses, jeans..."
              aria-label="Search products"
            />
          </form>

          <div className="icons">
            <Link
              to="/wishlist"
              className="icon-btn"
              aria-label={`Wishlist${ids.length ? `, ${ids.length} items` : ''}`}
            >
              ♡
              {ids.length > 0 && (
                <span className="count">{ids.length}</span>
              )}
            </Link>

            <Link
              to="/cart"
              className="icon-btn"
              aria-label={`Shopping cart${count ? `, ${count} items` : ''}`}
            >
              🛒
              {count > 0 && (
                <span className="count">{count}</span>
              )}
            </Link>

            {user ? (
              <>
                <Link
                  to="/account"
                  className="icon-btn"
                  title="My Account"
                  aria-label="My Account"
                >
                  👤
                </Link>

                {/* Only administrators see this button. */}
                {isAdmin && (
                  <Link
                    to="/admin"
                    className="btn sm outline"
                  >
                    Admin
                  </Link>
                )}

                <button
                  type="button"
                  className="btn sm outline"
                  onClick={handleLogout}
                >
                  Logout
                </button>
              </>
            ) : (
              <Link to="/login" className="btn sm">
                Login
              </Link>
            )}
          </div>
        </div>

        <nav className="catnav" aria-label="Shop categories">
          <div className="container row">
            <div className="item">
              <NavLink to="/shop">Explore All</NavLink>
            </div>

            {cats.map((category) => (
              <div className="item" key={category._id}>
                <Link to={`/category/${category.slug}`}>
                  {category.name?.replace(' Jewellery', '')}
                </Link>

                {category.children?.length > 0 && (
                  <div className="dropdown">
                    <Link to={`/category/${category.slug}`}>
                      <b>View all {category.name}</b>
                    </Link>

                    {category.children.map((subcategory) => (
                      <Link
                        key={subcategory._id}
                        to={`/category/${subcategory.slug}`}
                      >
                        {subcategory.name}
                      </Link>
                    ))}
                  </div>
                )}
              </div>
            ))}
          </div>
        </nav>
      </header>

      <main>
        <Outlet />
      </main>

      <Newsletter />

      <footer className="footer">
        <div className="container">
          <div className="cols">
            <div>
              <Link
                to="/"
                className="logo"
                style={{
                  color: '#e3c274',
                  marginBottom: 8,
                  display: 'inline-block',
                }}
              >
                AURELIA
              </Link>

              <p>
                Discover timeless essentials, contemporary trends,
                and styles made for every moment.
              </p>
            </div>

            <div>
              <h4>Shop</h4>
              {cats.slice(0, 5).map((category) => (
                <Link
                  key={category._id}
                  to={`/category/${category.slug}`}
                >
                  {category.name}
                </Link>
              ))}
            </div>

            <div>
              <h4>Company</h4>
              <Link to="/about">About Us</Link>
              <Link to="/contact">Contact</Link>
              <Link to="/account">My Account</Link>
            </div>

            <div>
              <h4>Policies</h4>
              <Link to="/policies/privacy">Privacy</Link>
              <Link to="/policies/terms">Terms</Link>
              <Link to="/policies/shipping">Shipping</Link>
              <Link to="/policies/returns">Returns</Link>
              <Link to="/policies/refunds">Refunds</Link>
            </div>
          </div>

          <div className="copy">
            © {new Date().getFullYear()} Aurelia. All rights reserved.
          </div>
        </div>
      </footer>
    </>
  );
}
