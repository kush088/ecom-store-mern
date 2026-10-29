import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import api, { inr } from '../../api/axios';

export default function Dashboard() {
  const [s, setS] = useState(null);
  useEffect(() => { api.get('/admin/stats').then((r) => setS(r.data)); }, []);
  if (!s) return <p className="muted">Loading…</p>;
  const max = Math.max(1, ...s.daily.map((d) => d.revenue));
  return (
    <>
      <h1 className="serif">Dashboard</h1>
      <div className="stats">
        <div className="stat"><span className="muted">Total revenue (paid)</span><b>{inr(s.revenue)}</b></div>
        <div className="stat"><span className="muted">Total orders</span><b>{s.totalOrders}</b></div>
        <div className="stat"><span className="muted">Pending orders</span><b>{s.pendingOrders}</b></div>
        <div className="stat"><span className="muted">Customers</span><b>{s.totalUsers}</b></div>
        <div className="stat"><span className="muted">Products</span><b>{s.totalProducts}</b></div>
        <div className="stat"><span className="muted">Unread messages</span><b>{s.unreadMessages}</b></div>
      </div>

      <div className="card" style={{ marginBottom: 20 }}>
        <b>Revenue · last 30 days</b>
        {s.daily.length === 0 ? <p className="muted" style={{ marginTop: 8 }}>No paid orders in this period.</p> : (
          <div className="bars">{s.daily.map((d) => <div key={d._id} style={{ height: `${(d.revenue / max) * 100}%` }} title={`${d._id}: ${inr(d.revenue)} (${d.orders} orders)`} />)}</div>
        )}
      </div>

      <div className="grid2" style={{ alignItems: 'start' }}>
        <div className="card">
          <b>Recent orders</b>
          <table className="table" style={{ marginTop: 10 }}>
            <tbody>{s.recentOrders.map((o) => (
              <tr key={o._id}><td>{o.orderNumber}</td><td>{o.user?.name}</td><td>{inr(o.total)}</td><td><span className={`badge ${o.status}`}>{o.status}</span></td></tr>
            ))}</tbody>
          </table>
          <Link to="/admin/orders" className="btn sm outline" style={{ marginTop: 10 }}>All orders</Link>
        </div>
        <div>
          <div className="card" style={{ marginBottom: 16 }}>
            <b>Top selling</b>
            {s.topProducts.length === 0 && <p className="muted">No sales yet.</p>}
            {s.topProducts.map((p) => <div key={p._id} className="sum-row"><span>{p.name}</span><b>{p.sold} sold</b></div>)}
          </div>
          <div className="card">
            <b>Low stock (≤ 5)</b>
            {s.lowStock.length === 0 && <p className="muted">All good.</p>}
            {s.lowStock.map((p) => <div key={p._id} className="sum-row"><span>{p.name}</span><b style={{ color: 'var(--danger)' }}>{p.stock} left</b></div>)}
          </div>
        </div>
      </div>
    </>
  );
}
