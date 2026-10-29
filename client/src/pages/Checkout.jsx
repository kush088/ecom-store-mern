import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import api, { errMsg } from '../api/axios';
import { useCart } from '../context/CartContext';
import { useAuth } from '../context/AuthContext';
import { useToast } from '../context/ToastContext';
import { useQuote, Summary } from './Cart';

const EMPTY = { fullName: '', phone: '', line1: '', line2: '', city: '', state: '', pincode: '' };

const loadRazorpay = () => new Promise((resolve) => {
  if (window.Razorpay) return resolve(true);
  const s = document.createElement('script');
  s.src = 'https://checkout.razorpay.com/v1/checkout.js';
  s.onload = () => resolve(true); s.onerror = () => resolve(false);
  document.body.appendChild(s);
});

export default function Checkout() {
  const { items, coupon, clear } = useCart();
  const { user } = useAuth();
  const { quote, error } = useQuote(items, coupon);
  const [addresses, setAddresses] = useState([]);
  const [sel, setSel] = useState('new');
  const [form, setForm] = useState({ ...EMPTY, fullName: user?.name || '', phone: user?.phone || '' });
  const [save, setSave] = useState(false);
  const [method, setMethod] = useState('razorpay');
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState('');
  const toast = useToast();
  const nav = useNavigate();

  useEffect(() => { if (!items.length) nav('/cart'); }, [items.length, nav]);
  useEffect(() => {
    api.get('/users/addresses').then((r) => {
      setAddresses(r.data);
      const d = r.data.find((a) => a.isDefault) || r.data[0];
      if (d) setSel(d._id);
    });
  }, []);

  const set = (k) => (e) => setForm({ ...form, [k]: e.target.value });
  const address = sel === 'new' ? form : addresses.find((a) => a._id === sel);

  const validate = () => {
    for (const [k, l] of [['fullName', 'Full name'], ['phone', 'Phone'], ['line1', 'Address line 1'], ['city', 'City'], ['state', 'State']])
      if (!address?.[k]?.trim()) return `${l} is required`;
    if (!/^\d{10}$/.test(address.phone.replace(/\D/g, '').slice(-10))) return 'Enter a valid 10-digit phone number';
    if (!/^\d{6}$/.test(address.pincode || '')) return 'Enter a valid 6-digit pincode';
    return '';
  };

  const place = async () => {
    const v = validate();
    if (v) return setErr(v);
    setErr(''); setBusy(true);
    try {
      const shippingAddress = ['fullName', 'phone', 'line1', 'line2', 'city', 'state', 'pincode'].reduce((o, k) => ({ ...o, [k]: address[k] }), {});
      if (sel === 'new' && save) await api.post('/users/addresses', { ...shippingAddress, isDefault: addresses.length === 0 });

      const { data: order } = await api.post('/orders', {
        items: items.map(({ product, qty, size }) => ({ product, qty, size })),
        couponCode: coupon || undefined, shippingAddress, paymentMethod: method,
      });

      if (method === 'cod') { clear(); return nav(`/order/success/${order._id}`); }

      if (!(await loadRazorpay())) throw new Error('Could not load Razorpay. Check your connection.');
      const { data: rz } = await api.post('/payments/razorpay/create', { orderId: order._id });
      const rzp = new window.Razorpay({
        key: rz.keyId, amount: rz.amount, currency: rz.currency, order_id: rz.razorpayOrderId,
        name: 'Aurelia Jewellers', description: `Order ${order.orderNumber}`,
        prefill: { name: shippingAddress.fullName, email: user.email, contact: shippingAddress.phone },
        theme: { color: '#b08a3e' },
        handler: async (resp) => {
          try {
            await api.post('/payments/razorpay/verify', { orderId: order._id, ...resp });
            clear(); nav(`/order/success/${order._id}`);
          } catch { nav(`/order/failed/${order._id}`); }
        },
        modal: { ondismiss: () => { setBusy(false); api.post('/payments/razorpay/failed', { orderId: order._id }).catch(() => {}); toast('Payment cancelled', 'err'); } },
      });
      rzp.on('payment.failed', () => { api.post('/payments/razorpay/failed', { orderId: order._id }).catch(() => {}); nav(`/order/failed/${order._id}`); });
      rzp.open();
    } catch (e) { setErr(errMsg(e)); setBusy(false); }
  };

  return (
    <div className="container section">
      <h1 style={{ fontSize: '2.4rem', marginBottom: 20 }}>Checkout</h1>
      <div className="two">
        <div>
          <div className="card" style={{ marginBottom: 20 }}>
            <h3 style={{ fontSize: '1.5rem', marginBottom: 12 }}>Shipping address</h3>
            {addresses.map((a) => (
              <label key={a._id} className={`radio ${sel === a._id ? 'on' : ''}`}>
                <input type="radio" checked={sel === a._id} onChange={() => setSel(a._id)} />
                <span><b>{a.fullName}</b> · {a.phone}<br />{a.line1}{a.line2 && `, ${a.line2}`}, {a.city}, {a.state} – {a.pincode}</span>
              </label>
            ))}
            <label className={`radio ${sel === 'new' ? 'on' : ''}`}><input type="radio" checked={sel === 'new'} onChange={() => setSel('new')} /> <b>Use a new address</b></label>
            {sel === 'new' && (
              <div style={{ marginTop: 12 }}>
                <div className="grid2">
                  <div className="field"><label>Full name</label><input value={form.fullName} onChange={set('fullName')} /></div>
                  <div className="field"><label>Phone</label><input inputMode="numeric" value={form.phone} onChange={set('phone')} /></div>
                </div>
                <div className="field"><label>Address line 1</label><input value={form.line1} onChange={set('line1')} /></div>
                <div className="field"><label>Address line 2 (optional)</label><input value={form.line2} onChange={set('line2')} /></div>
                <div className="grid3">
                  <div className="field"><label>City</label><input value={form.city} onChange={set('city')} /></div>
                  <div className="field"><label>State</label><input value={form.state} onChange={set('state')} /></div>
                  <div className="field"><label>Pincode</label><input inputMode="numeric" maxLength={6} value={form.pincode} onChange={set('pincode')} /></div>
                </div>
                <label className="check"><input type="checkbox" checked={save} onChange={(e) => setSave(e.target.checked)} /> Save this address</label>
              </div>
            )}
          </div>
          <div className="card">
            <h3 style={{ fontSize: '1.5rem', marginBottom: 12 }}>Payment</h3>
            <label className={`radio ${method === 'razorpay' ? 'on' : ''}`}>
              <input type="radio" checked={method === 'razorpay'} onChange={() => setMethod('razorpay')} />
              <span><b>Pay online</b><br /><span className="muted">UPI, cards, netbanking & wallets via Razorpay</span></span>
            </label>
            <label className={`radio ${method === 'cod' ? 'on' : ''}`}>
              <input type="radio" checked={method === 'cod'} onChange={() => setMethod('cod')} />
              <span><b>Cash on delivery</b><br /><span className="muted">Pay when your order arrives</span></span>
            </label>
          </div>
        </div>
        <div className="card">
          <h3 style={{ fontSize: '1.5rem', marginBottom: 12 }}>Order summary</h3>
          {items.map((i) => <div key={i.product + (i.size || '')} className="sum-row"><span>{i.name}{i.size && ` (${i.size})`} × {i.qty}</span></div>)}
          <hr style={{ margin: '10px 0', border: 0, borderTop: '1px solid var(--line)' }} />
          {error && <p className="error">{error}</p>}
          <Summary quote={quote} />
          {err && <p className="error" style={{ marginTop: 10 }}>{err}</p>}
          <button className="btn block" style={{ marginTop: 16 }} disabled={busy || !quote} onClick={place}>
            {busy ? 'Processing…' : method === 'cod' ? 'Place Order' : 'Pay Securely'}
          </button>
        </div>
      </div>
    </div>
  );
}
