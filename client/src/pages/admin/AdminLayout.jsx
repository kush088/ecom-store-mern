import { NavLink, Outlet, Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';

const LINKS = [
  ['/admin', 'Dashboard', true], ['/admin/products', 'Products'], ['/admin/categories', 'Categories'],
  ['/admin/orders', 'Orders'], ['/admin/users', 'Customers'], ['/admin/coupons', 'Coupons'],
  ['/admin/content', 'Banners & Reviews'], ['/admin/messages', 'Messages'],
];

export default function AdminLayout() {
  const { logout } = useAuth();
  const nav = useNavigate();
  return (
    <div className="adm">
      <aside>
        <span className="logo">AURELIA · Admin</span>
        {LINKS.map(([to, label, end]) => <NavLink key={to} to={to} end={end} className={({ isActive }) => (isActive ? 'on' : '')}>{label}</NavLink>)}
        <Link to="/" style={{ marginTop: 18 }}>← View store</Link>
        <a href="#logout" onClick={(e) => { e.preventDefault(); logout(); nav('/admin/login'); }}>Logout</a>
      </aside>
      <main><Outlet /></main>
    </div>
  );
}
