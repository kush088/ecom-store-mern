
import { useEffect, useState } from 'react';
import api, { errMsg } from '../../api/axios';
import { useToast } from '../../context/ToastContext';

const BLANK = {
  title: '',
  code: '',
  type: 'percent',
  value: '',
  minOrder: 0,
  maxDiscount: '',
  expiresAt: '',
  usageLimit: 0,
  isActive: true,
};

export default function Coupons() {
  const [list, setList] = useState([]);
  const [f, setF] = useState(null);
  const toast = useToast();

  const load = () => api.get('/coupons').then((r) => setList(r.data));

  useEffect(() => {
    load();
  }, []);

  const set = (k) => (e) =>
    setF({
      ...f,
      [k]: e.target.type === 'checkbox'
        ? e.target.checked
        : e.target.value,
    });

  const save = async (e) => {
    e.preventDefault();

    const body = {
      ...f,
      title: f.title.trim(),
      code: f.code.trim().toUpperCase(),
      value: Number(f.value),
      minOrder: Number(f.minOrder || 0),
      usageLimit: Number(f.usageLimit || 0),
      maxDiscount:
        f.maxDiscount === '' ? undefined : Number(f.maxDiscount),
      expiresAt: f.expiresAt || undefined,
    };

    if (!body.title) {
      return toast('Please enter a coupon title', 'err');
    }

    if (body.type === 'percent' && body.value > 100) {
      return toast('Percent cannot exceed 100', 'err');
    }

    try {
      if (f._id) {
        await api.put(`/coupons/${f._id}`, body);
      } else {
        await api.post('/coupons', body);
      }

      setF(null);
      await load();
      toast('Saved');
    } catch (er) {
      toast(errMsg(er), 'err');
    }
  };

  const del = async (c) => {
    if (confirm(`Delete ${c.code}?`)) {
      try {
        await api.delete(`/coupons/${c._id}`);
        await load();
        toast('Coupon deleted');
      } catch (er) {
        toast(errMsg(er), 'err');
      }
    }
  };

  return (
    <>
      <div
        style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
        }}
      >
        <h1 className="serif">Coupons</h1>

        <button className="btn" onClick={() => setF({ ...BLANK })}>
          + New coupon
        </button>
      </div>

      <table className="table">
        <thead>
          <tr>
            <th>Title</th>
            <th>Code</th>
            <th>Discount</th>
            <th>Min order</th>
            <th>Used</th>
            <th>Expires</th>
            <th>Status</th>
            <th />
          </tr>
        </thead>

        <tbody>
          {list.map((c) => (
            <tr key={c._id}>
              <td><b>{c.title || '—'}</b></td>
              <td><b>{c.code}</b></td>

              <td>
                {c.type === 'percent'
                  ? `${c.value}%${c.maxDiscount ? ` (max ₹${c.maxDiscount})` : ''}`
                  : `₹${c.value}`}
              </td>

              <td>₹{c.minOrder}</td>

              <td>
                {c.usedCount}
                {c.usageLimit ? ` / ${c.usageLimit}` : ''}
              </td>

              <td>
                {c.expiresAt
                  ? new Date(c.expiresAt).toLocaleDateString('en-IN')
                  : '—'}
              </td>

              <td>
                <span
                  className={`badge ${c.isActive ? 'paid' : 'cancelled'}`}
                >
                  {c.isActive ? 'active' : 'off'}
                </span>
              </td>

              <td>
                <div className="row-actions">
                  <button
                    className="btn sm outline"
                    onClick={() =>
                      setF({
                        ...BLANK,
                        ...c,
                        title: c.title || '',
                        expiresAt: c.expiresAt
                          ? c.expiresAt.slice(0, 10)
                          : '',
                        maxDiscount: c.maxDiscount ?? '',
                      })
                    }
                  >
                    Edit
                  </button>

                  <button
                    className="btn sm danger"
                    onClick={() => del(c)}
                  >
                    Delete
                  </button>
                </div>
              </td>
            </tr>
          ))}
        </tbody>
      </table>

      {f && (
        <div className="modal-bg">
          <form
            className="modal"
            style={{ maxWidth: 520 }}
            onSubmit={save}
          >
            <h2 style={{ fontSize: '1.6rem', marginBottom: 12 }}>
              {f._id ? 'Edit' : 'New'} coupon
            </h2>

            <div className="field">
              <label>Coupon Title</label>
              <input
                type="text"
                placeholder="e.g. Festive Special Offer"
                maxLength={80}
                required
                value={f.title}
                onChange={set('title')}
              />
            </div>

            <div className="grid2">
              <div className="field">
                <label>Code</label>
                <input
                  required
                  value={f.code}
                  onChange={(e) =>
                    setF({
                      ...f,
                      code: e.target.value.toUpperCase(),
                    })
                  }
                />
              </div>

              <div className="field">
                <label>Type</label>
                <select value={f.type} onChange={set('type')}>
                  <option value="percent">Percent</option>
                  <option value="flat">Flat ₹</option>
                </select>
              </div>

              <div className="field">
                <label>Value</label>
                <input
                  type="number"
                  min="0"
                  required
                  value={f.value}
                  onChange={set('value')}
                />
              </div>

              <div className="field">
                <label>Min order (₹)</label>
                <input
                  type="number"
                  min="0"
                  value={f.minOrder}
                  onChange={set('minOrder')}
                />
              </div>

              <div className="field">
                <label>Max discount (₹)</label>
                <input
                  type="number"
                  min="0"
                  value={f.maxDiscount}
                  onChange={set('maxDiscount')}
                />
              </div>

              <div className="field">
                <label>Usage limit (0 = unlimited)</label>
                <input
                  type="number"
                  min="0"
                  value={f.usageLimit}
                  onChange={set('usageLimit')}
                />
              </div>

              <div className="field">
                <label>Expires on</label>
                <input
                  type="date"
                  value={f.expiresAt}
                  onChange={set('expiresAt')}
                />
              </div>
            </div>

            <label className="check">
              <input
                type="checkbox"
                checked={f.isActive}
                onChange={set('isActive')}
              />
              Active
            </label>

            <div className="row-actions" style={{ marginTop: 14 }}>
              <button className="btn">Save</button>

              <button
                type="button"
                className="btn outline"
                onClick={() => setF(null)}
              >
                Cancel
              </button>
            </div>
          </form>
        </div>
      )}
    </>
  );
}
