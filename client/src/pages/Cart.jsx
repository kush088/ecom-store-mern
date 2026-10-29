import { useEffect, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import api, { errMsg, inr } from '../api/axios';
import { useCart } from '../context/CartContext';
import { useToast } from '../context/ToastContext';

// Server-quoted totals, so what you see is what you pay.
export function useQuote(items, coupon) {
  const [quote, setQuote] = useState(null);
  const [error, setError] = useState('');
  useEffect(() => {
    if (!items.length) { setQuote(null); return; }
    const t = setTimeout(() => {
      api.post('/orders/quote', { items: items.map(({ product, qty, size }) => ({ product, qty, size })), couponCode: coupon || undefined })
        .then((r) => { setQuote(r.data); setError(''); })
        .catch((e) => { setError(errMsg(e)); setQuote(null); });
    }, 250);
    return () => clearTimeout(t);
  }, [items, coupon]);
  return { quote, error };
}

export function Summary({ quote }) {
  if (!quote) return null;
  return (
    <>
      <div className="sum-row"><span>Subtotal</span><span>{inr(quote.itemsTotal)}</span></div>
      {quote.discount > 0 && <div className="sum-row" style={{ color: 'var(--ok)' }}><span>Coupon discount</span><span>−{inr(quote.discount)}</span></div>}
      <div className="sum-row"><span>GST (3%)</span><span>{inr(quote.tax)}</span></div>
      <div className="sum-row"><span>Delivery</span><span>{quote.shippingCharge ? inr(quote.shippingCharge) : 'FREE'}</span></div>
      <div className="sum-row total"><span>Total</span><span>{inr(quote.total)}</span></div>
    </>
  );
}

export default function Cart() {
  const { items, coupon, setCoupon, setQty, remove } = useCart();
  const [code, setCode] = useState(coupon);
  const { quote, error } = useQuote(items, coupon);
  const toast = useToast();
  const nav = useNavigate();

  if (!items.length) return (
    <div className="container section center"><h1 style={{ fontSize: '2.4rem' }}>Your cart is empty</h1>
      <Link className="btn" to="/shop" style={{ marginTop: 18 }}>Continue shopping</Link></div>
  );

  const apply = async () => {
    if (!code.trim()) return setCoupon('');
    try {
      const subtotal = items.reduce((s, i) => s + i.price * i.qty, 0);
      await api.post('/coupons/validate', { code, itemsTotal: subtotal });
      setCoupon(code.trim().toUpperCase()); toast('Coupon applied');
    } catch (e) { toast(errMsg(e), 'err'); }
  };

  return (
    <div className="container section">
      <h1 style={{ fontSize: '2.4rem', marginBottom: 20 }}>Shopping Cart</h1>
      <div className="two">
        <div className="card">
          {items.map((i) => (
            <div className="line" key={i.product + (i.size || '')}>
              <img src={i.image} alt="" />
              <div>
                <Link to={`/product/${i.slug}`}><b>{i.name}</b></Link>
                {i.size && <div className="muted">Size: {i.size}</div>}
                <div className="price">{inr(i.price)}</div>
                <button className="btn sm outline" style={{ marginTop: 6 }} onClick={() => remove(i.product, i.size)}>Remove</button>
              </div>
              <div className="qty">
                <button onClick={() => setQty(i.product, i.size, i.qty - 1)}>−</button><span>{i.qty}</span>
                <button onClick={() => setQty(i.product, i.size, i.qty + 1)}>+</button>
              </div>
            </div>
          ))}
        </div>
        <div className="card">
          <h3 style={{ fontSize: '1.5rem', marginBottom: 12 }}>Order Summary</h3>
          <div style={{ display: 'flex', gap: 8, marginBottom: 12 }}>
            <input className="input" placeholder="Coupon code" value={code} onChange={(e) => setCode(e.target.value)} />
            <button className="btn sm" onClick={apply}>Apply</button>
          </div>
          {coupon && <p className="muted" style={{ marginBottom: 8 }}>Applied: <b>{coupon}</b> <button className="btn sm outline" onClick={() => { setCoupon(''); setCode(''); }}>Remove</button></p>}
          {error && <p className="error">{error}</p>}
          <Summary quote={quote} />
          <button className="btn block" style={{ marginTop: 16 }} disabled={!quote} onClick={() => nav('/checkout')}>Proceed to Checkout</button>
        </div>
      </div>
    </div>
  );
}
