import { useState } from 'react';
import api, { errMsg } from '../api/axios';
import { useToast } from '../context/ToastContext';

export default function Newsletter() {
  const [email, setEmail] = useState('');
  const toast = useToast();
  const submit = async (e) => {
    e.preventDefault();
    try { const { data } = await api.post('/newsletter', { email }); toast(data.message); setEmail(''); }
    catch (err) { toast(errMsg(err), 'err'); }
  };
  return (
    <section className="news">
      <h2 style={{ fontSize: '2rem' }}>Join the Aurelia Circle</h2>
      <p className="muted">Early access to new collections and exclusive offers.</p>
      <form onSubmit={submit}>
        <input type="email" required placeholder="Your email address" value={email} onChange={(e) => setEmail(e.target.value)} />
        <button className="btn">Subscribe</button>
      </form>
    </section>
  );
}
