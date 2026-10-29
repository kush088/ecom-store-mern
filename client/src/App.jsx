import { Route, Routes } from 'react-router-dom';
import Layout from './components/Layout';
import { RequireAuth, RequireAdmin } from './components/Guards';
import Home from './pages/Home';
import Shop from './pages/Shop';
import ProductDetails from './pages/ProductDetails';
import Wishlist from './pages/Wishlist';
import Cart from './pages/Cart';
import Checkout from './pages/Checkout';
import OrderResult from './pages/OrderResult';
import { Login, Register } from './pages/Auth';
import Account from './pages/Account';
import { About, Contact, Policy, NotFound } from './pages/Static';
import AdminLayout from './pages/admin/AdminLayout';
import Dashboard from './pages/admin/Dashboard';
import AdminProducts from './pages/admin/Products';
import AdminCategories from './pages/admin/Categories';
import AdminOrders from './pages/admin/Orders';
import AdminUsers from './pages/admin/Users';
import AdminCoupons from './pages/admin/Coupons';
import AdminContent from './pages/admin/Content';
import AdminMessages from './pages/admin/Messages';

export default function App() {
  return (
    <Routes>
      <Route path="/admin/login" element={<Login admin />} />
      <Route path="/admin" element={<RequireAdmin><AdminLayout /></RequireAdmin>}>
        <Route index element={<Dashboard />} />
        <Route path="products" element={<AdminProducts />} />
        <Route path="categories" element={<AdminCategories />} />
        <Route path="orders" element={<AdminOrders />} />
        <Route path="users" element={<AdminUsers />} />
        <Route path="coupons" element={<AdminCoupons />} />
        <Route path="content" element={<AdminContent />} />
        <Route path="messages" element={<AdminMessages />} />
      </Route>

      <Route element={<Layout />}>
        <Route path="/" element={<Home />} />
        <Route path="/shop" element={<Shop />} />
        <Route path="/category/:slug" element={<Shop mode="category" />} />
        <Route path="/search" element={<Shop mode="search" />} />
        <Route path="/product/:slug" element={<ProductDetails />} />
        <Route path="/cart" element={<Cart />} />
        <Route path="/login" element={<Login />} />
        <Route path="/register" element={<Register />} />
        <Route path="/about" element={<About />} />
        <Route path="/contact" element={<Contact />} />
        <Route path="/policies/:type" element={<Policy />} />
        <Route path="/wishlist" element={<RequireAuth><Wishlist /></RequireAuth>} />
        <Route path="/checkout" element={<RequireAuth><Checkout /></RequireAuth>} />
        <Route path="/order/success/:id" element={<RequireAuth><OrderResult ok /></RequireAuth>} />
        <Route path="/order/failed/:id" element={<RequireAuth><OrderResult /></RequireAuth>} />
        <Route path="/account/*" element={<RequireAuth><Account /></RequireAuth>} />
        <Route path="*" element={<NotFound />} />
      </Route>
    </Routes>
  );
}
