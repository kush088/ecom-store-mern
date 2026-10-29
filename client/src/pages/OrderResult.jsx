import { useEffect, useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import api, { inr } from '../api/axios';

export default function OrderResult({ ok }) {
  const { id } = useParams();
  const [o, setO] = useState(null);
  useEffect(() => { api.get(`/orders/${id}`).then((r) => setO(r.data)).catch(() => {}); }, [id]);

  return (
    <div className="container section center" style={{ maxWidth: 620 }}>
      <div style={{ fontSize: 64 }}>{ok ? '✅' : '❌'}</div>
      <h1 style={{ fontSize: '2.4rem' }}>{ok ? 'Order confirmed!' : 'Payment failed'}</h1>
      <p className="muted" style={{ margin: '8px 0 20px' }}>
        {ok ? 'Thank you for shopping with Aurelia. A confirmation is on its way.' : 'Your payment could not be completed. You have not been charged; if money was debited it is refunded automatically by your bank within 5–7 days.'}
      </p>
      {o && (
        <div className="card" style={{ textAlign: 'left', marginBottom: 20 }}>
          <div className="sum-row"><span>Order number</span><b>{o.orderNumber}</b></div>
          <div className="sum-row"><span>Amount</span><b>{inr(o.total)}</b></div>
          <div className="sum-row"><span>Payment</span><span className={`badge ${o.paymentStatus}`}>{o.paymentMethod === 'cod' ? 'Cash on delivery' : o.paymentStatus}</span></div>
        </div>
      )}
      <div style={{ display: 'flex', gap: 12, justifyContent: 'center', flexWrap: 'wrap' }}>
        {ok ? <Link className="btn" to={`/account/orders/${id}`}>View order</Link> : <Link className="btn" to="/cart">Try again</Link>}
        <Link className="btn outline" to="/shop">Continue shopping</Link>
      </div>
    </div>
  );
}
