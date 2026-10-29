import { useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import api, { errMsg } from '../api/axios';
import { useToast } from '../context/ToastContext';

export function About() {
  return (
    <div className="container section">
      <div className="prose">
        <h1 className="center" style={{ fontSize: '3rem' }}>Our Story</h1>
        <p className="center muted">Three generations of goldsmiths. One promise: jewellery that outlives trends.</p>
        <h2>Craftsmanship</h2>
        <p>Every Aurelia piece begins as a sketch and ends in the hands of a master artisan. We work in 14K, 18K and 22K gold, certified diamonds and ethically sourced gemstones, and we finish by hand: setting, polishing and quality checking each piece before it is insured and shipped.</p>
        <h2>Purity you can trust</h2>
        <p>All gold jewellery is BIS hallmarked and every diamond ships with its grading details. Prices are transparent: you always see the final amount, GST and delivery before you pay.</p>
        <h2>Made for moments</h2>
        <p>From daily-wear studs to bridal Kundan and Polki sets, our collections are designed to be worn, gifted and passed down.</p>
        <div className="center" style={{ marginTop: 24 }}><Link className="btn" to="/shop">Explore collections</Link></div>
      </div>
    </div>
  );
}

export function Contact() {
  const [f, setF] = useState({ name: '', email: '', phone: '', message: '' });
  const [busy, setBusy] = useState(false);
  const toast = useToast();
  const set = (k) => (e) => setF({ ...f, [k]: e.target.value });
  const submit = async (e) => {
    e.preventDefault(); setBusy(true);
    try { const { data } = await api.post('/contact', f); toast(data.message); setF({ name: '', email: '', phone: '', message: '' }); }
    catch (er) { toast(errMsg(er), 'err'); } finally { setBusy(false); }
  };
  return (
    <div className="container section">
      <h1 className="center" style={{ fontSize: '2.8rem', marginBottom: 24 }}>Contact Us</h1>
      <div className="grid2" style={{ alignItems: 'start', maxWidth: 960, margin: '0 auto' }}>
        <div className="card">
          <h3 style={{ fontSize: '1.5rem', marginBottom: 10 }}>Visit or call</h3>
          <p><b>Aurelia Jewellers</b><br />Replace with your store address<br />Ahmedabad, Gujarat, India</p>
          <p style={{ marginTop: 10 }}>📞 +91 00000 00000<br />✉️ support@example.com<br />🕘 Mon–Sat, 10:00 – 19:00 IST</p>
        </div>
        <form className="card" onSubmit={submit}>
          <div className="field"><label>Name</label><input required value={f.name} onChange={set('name')} /></div>
          <div className="field"><label>Email</label><input type="email" required value={f.email} onChange={set('email')} /></div>
          <div className="field"><label>Phone (optional)</label><input value={f.phone} onChange={set('phone')} /></div>
          <div className="field"><label>Message</label><textarea rows="4" required minLength={10} value={f.message} onChange={set('message')} /></div>
          <button className="btn" disabled={busy}>{busy ? 'Sending…' : 'Send message'}</button>
        </form>
      </div>
    </div>
  );
}

const POLICIES = {
  privacy: ['Privacy Policy', [
    ['Information we collect', 'We collect the details you give us (name, email, phone, addresses) and order history needed to fulfil purchases and support you.'],
    ['How we use it', 'To process orders, deliver products, send order updates and, if you opt in, share offers. We never sell your personal data.'],
    ['Payments', 'Payments are processed by Razorpay. We do not store card, UPI or netbanking details on our servers.'],
    ['Your rights', 'You can update your profile and addresses from My Account, or contact us to delete your account.'],
  ]],
  terms: ['Terms & Conditions', [
    ['Use of the site', 'By using this site you agree to provide accurate information and to use it only for lawful purposes.'],
    ['Pricing', 'Prices are in INR. GST at the prevailing rate and delivery charges are shown before payment. We may correct pricing errors and cancel affected orders with a full refund.'],
    ['Product information', 'Weights and dimensions are approximate; small variations are natural in handcrafted jewellery.'],
    ['Governing law', 'These terms are governed by the laws of India.'],
  ]],
  shipping: ['Shipping Policy', [
    ['Delivery time', 'Orders are dispatched within 2–3 business days and typically delivered in 5–7 business days.'],
    ['Charges', 'Delivery is free on orders of ₹10,000 and above; otherwise ₹199 applies.'],
    ['Insurance', 'All shipments are fully insured. Signature may be required on delivery.'],
  ]],
  returns: ['Return Policy', [
    ['7-day returns', 'Unused items in original packaging with certificates and tags can be returned within 7 days of delivery.'],
    ['Non-returnable', 'Customised, engraved or resized pieces cannot be returned.'],
    ['How to return', 'Contact support with your order number. We will arrange a pickup.'],
  ]],
  refunds: ['Refund Policy', [
    ['Timeline', 'Approved refunds are issued to the original payment method within 5–7 business days of the returned item passing inspection.'],
    ['Cash on delivery', 'Refunds for COD orders are made by bank transfer after you share your account details.'],
    ['Cancellations', 'Orders can be cancelled before they ship from My Account → Orders.'],
  ]],
};

export function Policy() {
  const { type } = useParams();
  const p = POLICIES[type];
  if (!p) return <NotFound />;
  return (
    <div className="container section">
      <div className="prose">
        <h1 style={{ fontSize: '2.8rem', marginBottom: 8 }}>{p[0]}</h1>
        <p className="muted">Sample policy text. Have it reviewed against your business and local law before launch.</p>
        {p[1].map(([h, t]) => <div key={h}><h2>{h}</h2><p>{t}</p></div>)}
      </div>
    </div>
  );
}

export function NotFound() {
  return (
    <div className="container nf">
      <div>
        <h1 className="serif">404</h1>
        <h2 style={{ marginBottom: 8 }}>This piece seems to be missing</h2>
        <p className="muted" style={{ marginBottom: 18 }}>The page you are looking for doesn’t exist or has moved.</p>
        <Link className="btn" to="/">Back to home</Link>
      </div>
    </div>
  );
}
