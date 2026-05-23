import React from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { Package, MapPin, User as UserIcon, LogOut, LayoutDashboard } from 'lucide-react';

export default function AccountPage() {
  const { user, logout, isAdmin } = useAuth();
  const navigate = useNavigate();

  if (!user) return null;

  const onLogout = () => { logout(); navigate('/'); };

  return (
    <main className="account-page" data-testid="account-page">
      <div className="breadcrumb">
        <Link to="/">Home</Link>
        <span className="breadcrumb-sep">/</span>
        <span>My Account</span>
      </div>

      <div className="account-header">
        <h1 className="account-title">Hi, {user.name}</h1>
        <p className="account-email">{user.email}</p>
      </div>

      <div className="account-grid">
        <Link to="/account/orders" className="account-card" data-testid="link-orders">
          <Package size={28} />
          <div>
            <h3>My Orders</h3>
            <p>Track and view your past orders</p>
          </div>
        </Link>

        <div className="account-card account-card-static">
          <UserIcon size={28} />
          <div>
            <h3>Profile</h3>
            <p>{user.name} · {user.phone || 'Add phone'}</p>
          </div>
        </div>

        <div className="account-card account-card-static">
          <MapPin size={28} />
          <div>
            <h3>Addresses</h3>
            <p>{user.addresses?.length || 0} saved address{user.addresses?.length === 1 ? '' : 'es'}</p>
          </div>
        </div>

        {isAdmin && (
          <Link to="/admin" className="account-card account-card-admin" data-testid="account-admin-link">
            <LayoutDashboard size={28} />
            <div>
              <h3>Admin Dashboard</h3>
              <p>Manage products, orders & customers</p>
            </div>
          </Link>
        )}

        <button onClick={onLogout} className="account-card account-card-logout" data-testid="account-logout-btn">
          <LogOut size={28} />
          <div>
            <h3>Sign Out</h3>
            <p>End your session</p>
          </div>
        </button>
      </div>
    </main>
  );
}
