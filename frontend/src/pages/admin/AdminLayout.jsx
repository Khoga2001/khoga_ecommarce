import React from 'react';
import { Outlet, NavLink, Link, useNavigate } from 'react-router-dom';
import {
  LayoutDashboard, Package, FolderTree, ShoppingCart, Users,
  Ticket, BarChart3, LogOut, ExternalLink,
} from 'lucide-react';
import { useAuth } from '../../context/AuthContext';

const NAV = [
  { to: '/admin', label: 'Dashboard', icon: LayoutDashboard, end: true },
  { to: '/admin/orders', label: 'Orders', icon: ShoppingCart },
  { to: '/admin/products', label: 'Products', icon: Package },
  { to: '/admin/categories', label: 'Categories', icon: FolderTree },
  { to: '/admin/inventory', label: 'Inventory', icon: BarChart3 },
  { to: '/admin/coupons', label: 'Coupons', icon: Ticket },
  { to: '/admin/users', label: 'Users', icon: Users },
];

export default function AdminLayout() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const onLogout = () => { logout(); navigate('/'); };

  return (
    <div className="admin-shell" data-testid="admin-layout">
      <aside className="admin-sidebar">
        <Link to="/admin" className="admin-brand">
          <span className="admin-brand-mark">KH</span>
          <span>KHOGA Admin</span>
        </Link>
        <nav className="admin-nav">
          {NAV.map(({ to, label, icon: Icon, end }) => (
            <NavLink
              key={to}
              to={to}
              end={end}
              className={({ isActive }) => `admin-nav-link ${isActive ? 'active' : ''}`}
              data-testid={`admin-nav-${label.toLowerCase()}`}
            >
              <Icon size={16} />
              <span>{label}</span>
            </NavLink>
          ))}
        </nav>
        <div className="admin-sidebar-footer">
          <Link to="/" className="admin-nav-link" target="_blank" rel="noreferrer">
            <ExternalLink size={16} />
            <span>View Store</span>
          </Link>
          <button onClick={onLogout} className="admin-nav-link" data-testid="admin-logout">
            <LogOut size={16} />
            <span>Logout</span>
          </button>
        </div>
      </aside>
      <main className="admin-main">
        <header className="admin-topbar">
          <div>
            <h1 className="admin-topbar-title">Admin Console</h1>
            <p className="admin-topbar-sub">Welcome back, {user?.name}</p>
          </div>
        </header>
        <div className="admin-content">
          <Outlet />
        </div>
      </main>
    </div>
  );
}
