import { useEffect, useState } from 'react';
import api, { errMsg } from '../../api/axios';
import { useToast } from '../../context/ToastContext';

export default function Categories() {
  const [cats, setCats] = useState([]);
  const [f, setF] = useState(null);
  const toast = useToast();
  const load = () => api.get('/categories/all').then((r) => setCats(r.data));
  useEffect(() => { load(); }, []);

  const parents = cats.filter((c) => !c.parent);
  const kids = (id) => cats.filter((c) => String(c.parent) === String(id));

  const save = async (e) => {
    e.preventDefault();
    try {
      const body = { name: f.name, parent: f.parent || null, description: f.description, isActive: f.isActive, order: f.order };
      if (f._id) await api.put(`/categories/${f._id}`, body); else await api.post('/categories', { ...body, order: cats.length });
      setF(null); load(); toast('Saved');
    } catch (er) { toast(errMsg(er), 'err'); }
  };
  const del = async (c) => {
    if (!confirm(`Delete "${c.name}"?`)) return;
    try { await api.delete(`/categories/${c._id}`); load(); toast('Deleted'); } catch (er) { toast(errMsg(er), 'err'); }
  };
  const toggle = async (c) => { await api.put(`/categories/${c._id}`, { isActive: !c.isActive }); load(); };

  // swap order with neighbour inside the same sibling group
  const move = async (list, idx, dir) => {
    const j = idx + dir;
    if (j < 0 || j >= list.length) return;
    const arr = [...list];
    [arr[idx], arr[j]] = [arr[j], arr[idx]];
    try { await api.put('/categories/reorder', { items: arr.map((c, n) => ({ id: c._id, order: n })) }); load(); } catch (er) { toast(errMsg(er), 'err'); }
  };

  const Row = ({ c, list, idx, indent }) => (
    <tr>
      <td style={{ paddingLeft: indent ? 36 : 12, fontWeight: indent ? 400 : 600 }}>{indent ? '↳ ' : ''}{c.name}</td>
      <td><span className={`badge ${c.isActive ? 'paid' : 'cancelled'}`}>{c.isActive ? 'visible' : 'hidden'}</span></td>
      <td><div className="row-actions">
        <button className="btn sm outline" onClick={() => move(list, idx, -1)} disabled={idx === 0}>↑</button>
        <button className="btn sm outline" onClick={() => move(list, idx, 1)} disabled={idx === list.length - 1}>↓</button>
        <button className="btn sm outline" onClick={() => setF({ ...c })}>Edit</button>
        <button className="btn sm outline" onClick={() => toggle(c)}>{c.isActive ? 'Hide' : 'Show'}</button>
        {!indent && <button className="btn sm outline" onClick={() => setF({ name: '', parent: c._id, isActive: true, description: '' })}>+ Sub</button>}
        <button className="btn sm danger" onClick={() => del(c)}>Delete</button>
      </div></td>
    </tr>
  );

  return (
    <>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 10 }}>
        <h1 className="serif">Categories</h1>
        <button className="btn" onClick={() => setF({ name: '', parent: '', isActive: true, description: '' })}>+ Add category</button>
      </div>
      <table className="table">
        <thead><tr><th>Name</th><th>Status</th><th>Actions</th></tr></thead>
        <tbody>
          {parents.map((p, i) => (
            <FragmentRows key={p._id}>
              <Row c={p} list={parents} idx={i} />
              {kids(p._id).map((k, n, arr) => <Row key={k._id} c={k} list={arr} idx={n} indent />)}
            </FragmentRows>
          ))}
        </tbody>
      </table>

      {f && (
        <div className="modal-bg"><form className="modal" style={{ maxWidth: 480 }} onSubmit={save}>
          <h2 style={{ fontSize: '1.6rem', marginBottom: 12 }}>{f._id ? 'Edit' : 'New'} category</h2>
          <div className="field"><label>Name</label><input required value={f.name} onChange={(e) => setF({ ...f, name: e.target.value })} /></div>
          <div className="field"><label>Parent</label>
            <select value={f.parent || ''} onChange={(e) => setF({ ...f, parent: e.target.value })}>
              <option value="">None (top-level)</option>
              {parents.filter((p) => p._id !== f._id).map((p) => <option key={p._id} value={p._id}>{p.name}</option>)}
            </select></div>
          <div className="field"><label>Description</label><textarea rows="2" value={f.description || ''} onChange={(e) => setF({ ...f, description: e.target.value })} /></div>
          <label className="check"><input type="checkbox" checked={f.isActive} onChange={(e) => setF({ ...f, isActive: e.target.checked })} /> Visible on store</label>
          <div className="row-actions" style={{ marginTop: 14 }}><button className="btn">Save</button><button type="button" className="btn outline" onClick={() => setF(null)}>Cancel</button></div>
        </form></div>
      )}
    </>
  );
}

// tbody children grouping helper
function FragmentRows({ children }) { return <>{children}</>; }
