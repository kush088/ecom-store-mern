import { useEffect, useState } from 'react';
import api, { errMsg, inr } from '../../api/axios';
import { useToast } from '../../context/ToastContext';
import Pagination from '../../components/Pagination';

const STATUSES = ['placed', 'confirmed', 'shipped', 'delivered', 'cancelled'];

export default function Orders() {
  const [data, setData] = useState({ items: [], pages: 1 });
  const [page, setPage] = useState(1);
  const [status, setStatus] = useState('');
  const [search, setSearch] = useState('');
  const [sel, setSel] = useState(null);
  const toast = useToast();

  const load = () => api.get('/admin/orders', { params: { page, status: status || undefined, search: search || undefined } }).then((r) => setData(r.data));
  useEffect(() => { load(); }, [page, status]); // eslint-disable-line

  const update = async (id, patch) => {
    try { const { data: o } = await api.put(`/admin/orders/${id}`, patch); toast('Order updated'); load(); setSel((s) => (s && s._id === id ? { ...s, ...o } : s)); }
    catch (e) { toast(errMsg(e), 'err'); }
  };

  return (
    <>
      <h1 className="serif">Orders</h1>
      <form style={{ display: 'flex', gap: 8, marginBottom: 14, flexWrap: 'wrap' }} onSubmit={(e) => { e.preventDefault(); setPage(1); load(); }}>
        <input className="input" style={{ maxWidth: 240 }} placeholder="Order number" value={search} onChange={(e) => setSearch(e.target.value)} />
        <select className="input" style={{ width: 'auto' }} value={status} onChange={(e) => { setStatus(e.target.value); setPage(1); }}>
          <option value="">All statuses</option>{STATUSES.map((s) => <option key={s}>{s}</option>)}
        </select>
        <button className="btn sm">Search</button>
      </form>
      <table className="table">
        <thead><tr><th>Order</th><th>Customer</th><th>Date</th><th>Total</th><th>Payment</th><th>Status</th><th /></tr></thead>
        <tbody>{data.items.map((o) => (
          <tr key={o._id}>
            <td>{o.orderNumber}</td><td>{o.user?.name}<div className="muted">{o.user?.email}</div></td>
            <td>{new Date(o.createdAt).toLocaleDateString('en-IN')}</td><td>{inr(o.total)}</td>
            <td><span className={`badge ${o.paymentStatus}`}>{o.paymentStatus}</span> <span className="muted">{o.paymentMethod}</span></td>
            <td>
              <select className="input" value={o.status} onChange={(e) => update(o._id, { status: e.target.value })}>{STATUSES.map((s) => <option key={s}>{s}</option>)}</select>
            </td>
            <td><button className="btn sm outline" onClick={() => setSel(o)}>Details</button></td>
          </tr>
        ))}</tbody>
      </table>
      <Pagination page={page} pages={data.pages} onChange={setPage} />

      {sel && (
        <div className="modal-bg" onClick={() => setSel(null)}><div className="modal" onClick={(e) => e.stopPropagation()}>
          <h2 style={{ fontSize: '1.6rem' }}>{sel.orderNumber}</h2>
          <p className="muted">{sel.user?.name} · {sel.user?.email}</p>
          {sel.items.map((i, n) => <div key={n} className="sum-row"><span>{i.name}{i.size && ` (${i.size})`} × {i.qty}</span><b>{inr(i.price * i.qty)}</b></div>)}
          <div className="sum-row total"><span>Total</span><span>{inr(sel.total)}</span></div>
          <p style={{ margin: '12px 0' }}><b>Ship to:</b> {sel.shippingAddress.fullName}, {sel.shippingAddress.phone}, {sel.shippingAddress.line1}, {sel.shippingAddress.city}, {sel.shippingAddress.state} – {sel.shippingAddress.pincode}</p>
          {sel.razorpayPaymentId && <p className="muted">Razorpay payment: {sel.razorpayPaymentId}</p>}
          <div className="field"><label>Tracking number</label>
            <input defaultValue={sel.trackingNumber || ''} onBlur={(e) => e.target.value !== (sel.trackingNumber || '') && update(sel._id, { trackingNumber: e.target.value })} /></div>
          <div className="field"><label>Payment status</label>
            <select value={sel.paymentStatus} onChange={(e) => update(sel._id, { paymentStatus: e.target.value })}>{['pending', 'paid', 'failed', 'refunded'].map((s) => <option key={s}>{s}</option>)}</select></div>
          <button className="btn outline" onClick={() => setSel(null)}>Close</button>
        </div></div>
      )}
    </>
  );
}
