import { useEffect, useState } from 'react';
import api, { errMsg } from '../../api/axios';
import { useToast } from '../../context/ToastContext';
import Pagination from '../../components/Pagination';

export default function Users() {
  const [data, setData] = useState({ items: [], pages: 1, total: 0 });
  const [page, setPage] = useState(1);
  const toast = useToast();
  const load = () => api.get('/admin/users', { params: { page } }).then((r) => setData(r.data));
  useEffect(() => { load(); }, [page]); // eslint-disable-line

  const toggle = async (u) => {
    try { await api.put(`/admin/users/${u._id}`, { isActive: !u.isActive }); load(); }
    catch (e) { toast(errMsg(e), 'err'); }
  };
  return (
    <>
      <h1 className="serif">Customers ({data.total})</h1>
      <table className="table">
        <thead><tr><th>Name</th><th>Email</th><th>Phone</th><th>Role</th><th>Joined</th><th>Status</th><th /></tr></thead>
        <tbody>{data.items.map((u) => (
          <tr key={u._id}>
            <td>{u.name}</td><td>{u.email}</td><td>{u.phone || '—'}</td><td>{u.role}</td>
            <td>{new Date(u.createdAt).toLocaleDateString('en-IN')}</td>
            <td><span className={`badge ${u.isActive ? 'paid' : 'cancelled'}`}>{u.isActive ? 'active' : 'blocked'}</span></td>
            <td>{u.role !== 'admin' && <button className="btn sm outline" onClick={() => toggle(u)}>{u.isActive ? 'Block' : 'Unblock'}</button>}</td>
          </tr>
        ))}</tbody>
      </table>
      <Pagination page={page} pages={data.pages} onChange={setPage} />
    </>
  );
}
