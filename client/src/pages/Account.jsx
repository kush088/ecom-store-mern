import { useEffect, useState } from 'react';
import { Link, NavLink, Route, Routes, useNavigate, useParams } from 'react-router-dom';
import api, { errMsg, inr } from '../api/axios';
import { useAuth } from '../context/AuthContext';
import { useToast } from '../context/ToastContext';

function Profile() {
  const { user, setUser } = useAuth();
  const [f, setF] = useState({ name: user.name, phone: user.phone || '' });
  const [pw, setPw] = useState({ currentPassword: '', newPassword: '', confirm: '' });
  const toast = useToast();

  const saveProfile = async (e) => {
    e.preventDefault();
    try { const { data } = await api.put('/users/profile', f); setUser(data); localStorage.setItem('user', JSON.stringify(data)); toast('Profile updated'); }
    catch (er) { toast(errMsg(er), 'err'); }
  };
  const savePw = async (e) => {
    e.preventDefault();
    if (pw.newPassword !== pw.confirm) return toast('Passwords do not match', 'err');
    try { await api.put('/users/password', { currentPassword: pw.currentPassword, newPassword: pw.newPassword }); toast('Password changed'); setPw({ currentPassword: '', newPassword: '', confirm: '' }); }
    catch (er) { toast(errMsg(er), 'err'); }
  };
  return (
    <div className="grid2" style={{ alignItems: 'start' }}>
      <form className="card" onSubmit={saveProfile}>
        <h3 style={{ fontSize: '1.5rem', marginBottom: 12 }}>Profile</h3>
        <div className="field"><label>Email</label><input value={user.email} disabled /></div>
        <div className="field"><label>Name</label><input required value={f.name} onChange={(e) => setF({ ...f, name: e.target.value })} /></div>
        <div className="field"><label>Phone</label><input value={f.phone} onChange={(e) => setF({ ...f, phone: e.target.value })} /></div>
        <button className="btn">Save changes</button>
      </form>
      <form className="card" onSubmit={savePw}>
        <h3 style={{ fontSize: '1.5rem', marginBottom: 12 }}>Change password</h3>
        <div className="field"><label>Current password</label><input type="password" required value={pw.currentPassword} onChange={(e) => setPw({ ...pw, currentPassword: e.target.value })} /></div>
        <div className="field"><label>New password</label><input type="password" required minLength={8} value={pw.newPassword} onChange={(e) => setPw({ ...pw, newPassword: e.target.value })} /></div>
        <div className="field"><label>Confirm new password</label><input type="password" required value={pw.confirm} onChange={(e) => setPw({ ...pw, confirm: e.target.value })} /></div>
        <button className="btn">Update password</button>
      </form>
    </div>
  );
}

const EMPTY = { label: 'Home', fullName: '', phone: '', line1: '', line2: '', city: '', state: '', pincode: '', isDefault: false };
function Addresses() {
  const [list, setList] = useState([]);
  const [f, setF] = useState(null);
  const toast = useToast();
  const load = () => api.get('/users/addresses').then((r) => setList(r.data));
  useEffect(() => { load(); }, []);
  const set = (k) => (e) => setF({ ...f, [k]: e.target.type === 'checkbox' ? e.target.checked : e.target.value });

  const save = async (e) => {
    e.preventDefault();
    if (!/^\d{6}$/.test(f.pincode)) return toast('Enter a valid 6-digit pincode', 'err');
    try {
      if (f._id) await api.put(`/users/addresses/${f._id}`, f); else await api.post('/users/addresses', f);
      setF(null); load(); toast('Address saved');
    } catch (er) { toast(errMsg(er), 'err'); }
  };
  const del = async (id) => { if (confirm('Delete this address?')) { await api.delete(`/users/addresses/${id}`); load(); } };

  return (
    <>
      <div className="pgrid" style={{ gridTemplateColumns: 'repeat(auto-fill,minmax(280px,1fr))' }}>
        {list.map((a) => (
          <div className="card" key={a._id}>
            <b>{a.label}</b> {a.isDefault && <span className="badge">Default</span>}
            <p>{a.fullName} · {a.phone}</p>
            <p className="muted">{a.line1}{a.line2 && `, ${a.line2}`}, {a.city}, {a.state} – {a.pincode}</p>
            <div className="row-actions" style={{ marginTop: 10 }}>
              <button className="btn sm outline" onClick={() => setF(a)}>Edit</button>
              <button className="btn sm danger" onClick={() => del(a._id)}>Delete</button>
            </div>
          </div>
        ))}
      </div>
      {!f && <button className="btn" style={{ marginTop: 16 }} onClick={() => setF({ ...EMPTY })}>+ Add address</button>}
      {f && (
        <form className="card" style={{ marginTop: 16, maxWidth: 640 }} onSubmit={save}>
          <div className="grid2">
            <div className="field"><label>Label</label><input value={f.label} onChange={set('label')} /></div>
            <div className="field"><label>Full name</label><input required value={f.fullName} onChange={set('fullName')} /></div>
            <div className="field"><label>Phone</label><input required value={f.phone} onChange={set('phone')} /></div>
            <div className="field"><label>Pincode</label><input required maxLength={6} value={f.pincode} onChange={set('pincode')} /></div>
          </div>
          <div className="field"><label>Address line 1</label><input required value={f.line1} onChange={set('line1')} /></div>
          <div className="field"><label>Address line 2</label><input value={f.line2 || ''} onChange={set('line2')} /></div>
          <div className="grid2">
            <div className="field"><label>City</label><input required value={f.city} onChange={set('city')} /></div>
            <div className="field"><label>State</label><input required value={f.state} onChange={set('state')} /></div>
          </div>
          <label className="check"><input type="checkbox" checked={!!f.isDefault} onChange={set('isDefault')} /> Make default</label>
          <div className="row-actions" style={{ marginTop: 12 }}><button className="btn">Save</button><button type="button" className="btn outline" onClick={() => setF(null)}>Cancel</button></div>
        </form>
      )}
    </>
  );
}

function Orders() {
  const [list, setList] = useState(null);
  useEffect(() => { api.get('/orders/mine').then((r) => setList(r.data)); }, []);
  if (!list) return <p className="muted">Loading…</p>;
  if (!list.length) return <p className="muted">No orders yet. <Link to="/shop" style={{ color: 'var(--gold-d)' }}>Start shopping</Link></p>;
  return (
    <table className="table">
      <thead><tr><th>Order</th><th>Date</th><th>Total</th><th>Payment</th><th>Status</th><th /></tr></thead>
      <tbody>
        {list.map((o) => (
          <tr key={o._id}>
            <td>{o.orderNumber}</td><td>{new Date(o.createdAt).toLocaleDateString('en-IN')}</td><td>{inr(o.total)}</td>
            <td><span className={`badge ${o.paymentStatus}`}>{o.paymentStatus}</span></td>
            <td><span className={`badge ${o.status}`}>{o.status}</span></td>
            <td><Link className="btn sm outline" to={`/account/orders/${o._id}`}>View</Link></td>
          </tr>
        ))}
      </tbody>
    </table>
  );
}

function OrderDetail() {
  const { id } = useParams();
  const [o, setO] = useState(null);
  const toast = useToast();
  const load = () => api.get(`/orders/${id}`).then((r) => setO(r.data));
  useEffect(() => { load(); }, [id]);
  if (!o) return <p className="muted">Loading…</p>;
  const cancel = async () => {
    if (!confirm('Cancel this order?')) return;
    try { await api.put(`/orders/${id}/cancel`); toast('Order cancelled'); load(); } catch (e) { toast(errMsg(e), 'err'); }
  };
  const a = o.shippingAddress;
  return (
    <div className="card">
      <div style={{ display: 'flex', justifyContent: 'space-between', flexWrap: 'wrap', gap: 8 }}>
        <h3 style={{ fontSize: '1.6rem' }}>Order {o.orderNumber}</h3>
        <div><span className={`badge ${o.status}`}>{o.status}</span> <span className={`badge ${o.paymentStatus}`}>{o.paymentStatus}</span></div>
      </div>
      <p className="muted">Placed {new Date(o.createdAt).toLocaleString('en-IN')}{o.trackingNumber && ` · Tracking: ${o.trackingNumber}`}</p>
      {o.items.map((i, n) => (
        <div className="line" key={n}>
          <img src={i.image} alt="" /><div><b>{i.name}</b>{i.size && <div className="muted">Size: {i.size}</div>}<div className="muted">Qty {i.qty}</div></div><b>{inr(i.price * i.qty)}</b>
        </div>
      ))}
      <div className="grid2" style={{ marginTop: 16 }}>
        <div><b>Shipping to</b><p className="muted">{a.fullName} · {a.phone}<br />{a.line1}{a.line2 && `, ${a.line2}`}<br />{a.city}, {a.state} – {a.pincode}</p></div>
        <div>
          <div className="sum-row"><span>Subtotal</span><span>{inr(o.itemsTotal)}</span></div>
          {o.discount > 0 && <div className="sum-row"><span>Discount {o.couponCode && `(${o.couponCode})`}</span><span>−{inr(o.discount)}</span></div>}
          <div className="sum-row"><span>GST</span><span>{inr(o.tax)}</span></div>
          <div className="sum-row"><span>Delivery</span><span>{o.shippingCharge ? inr(o.shippingCharge) : 'FREE'}</span></div>
          <div className="sum-row total"><span>Total</span><span>{inr(o.total)}</span></div>
        </div>
      </div>
      {['placed', 'confirmed'].includes(o.status) && <button className="btn danger sm" style={{ marginTop: 14 }} onClick={cancel}>Cancel order</button>}
    </div>
  );
}

export default function Account() {
  return (
    <div className="container section">
      <h1 style={{ fontSize: '2.4rem', marginBottom: 16 }}>My Account</h1>
      <div className="tabs">
        <NavLink end to="/account" className={({ isActive }) => (isActive ? 'on' : '')}>Profile</NavLink>
        <NavLink to="/account/addresses" className={({ isActive }) => (isActive ? 'on' : '')}>Addresses</NavLink>
        <NavLink to="/account/orders" className={({ isActive }) => (isActive ? 'on' : '')}>Orders</NavLink>
      </div>
      <Routes>
        <Route index element={<Profile />} />
        <Route path="addresses" element={<Addresses />} />
        <Route path="orders" element={<Orders />} />
        <Route path="orders/:id" element={<OrderDetail />} />
      </Routes>
    </div>
  );
}
