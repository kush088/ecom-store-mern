import { useEffect, useState } from 'react';
import api from '../../api/axios';

export default function Messages() {
  const [list, setList] = useState([]);
  const [subs, setSubs] = useState([]);
  const load = () => { api.get('/admin/messages').then((r) => setList(r.data)); api.get('/admin/subscribers').then((r) => setSubs(r.data)); };
  useEffect(() => { load(); }, []);
  return (
    <>
      <h1 className="serif">Messages</h1>
      {list.length === 0 && <p className="muted">No messages yet.</p>}
      {list.map((m) => (
        <div className="card" key={m._id} style={{ marginBottom: 10, borderLeft: m.isRead ? undefined : '4px solid var(--gold)' }}>
          <b>{m.name}</b> · <a href={`mailto:${m.email}`} style={{ color: 'var(--gold-d)' }}>{m.email}</a>{m.phone && ` · ${m.phone}`}
          <span className="muted"> · {new Date(m.createdAt).toLocaleString('en-IN')}</span>
          <p style={{ margin: '8px 0' }}>{m.message}</p>
          <div className="row-actions">
            {!m.isRead && <button className="btn sm outline" onClick={async () => { await api.put(`/admin/messages/${m._id}/read`); load(); }}>Mark read</button>}
            <button className="btn sm danger" onClick={async () => { if (confirm('Delete message?')) { await api.delete(`/admin/messages/${m._id}`); load(); } }}>Delete</button>
          </div>
        </div>
      ))}
      <h1 className="serif" style={{ marginTop: 28 }}>Newsletter subscribers ({subs.length})</h1>
      <div className="card">{subs.length ? subs.map((s) => <div key={s._id}>{s.email}</div>) : <span className="muted">None yet.</span>}</div>
    </>
  );
}
