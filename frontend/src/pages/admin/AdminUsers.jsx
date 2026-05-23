import React, { useEffect, useState } from 'react';
import { adminApi } from '../../api';
import { toast } from 'sonner';
import { Search } from 'lucide-react';

export default function AdminUsers() {
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [page, setPage] = useState(1);
  const [pages, setPages] = useState(1);

  const load = async () => {
    setLoading(true);
    try {
      const r = await adminApi.listUsers({ search: search || undefined, page, per_page: 20 });
      setUsers(r.data.items || []);
      setPages(r.data.pages || 1);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { load(); /* eslint-disable-next-line */ }, [page]);

  const onSearch = (e) => { e.preventDefault(); setPage(1); load(); };

  const onToggle = async (user) => {
    try {
      await adminApi.toggleUserActive(user.id);
      toast.success('User updated');
      load();
    } catch (err) {
      toast.error('Update failed');
    }
  };

  return (
    <div data-testid="admin-users">
      <div className="admin-section-head"><h2>Users</h2></div>

      <form onSubmit={onSearch} className="admin-toolbar">
        <div className="admin-search">
          <Search size={16} />
          <input placeholder="Search by email or name…" value={search} onChange={e => setSearch(e.target.value)} data-testid="user-search" />
        </div>
        <button type="submit" className="btn-outline">Search</button>
      </form>

      {loading ? <div className="admin-loading">Loading…</div> : (
        <>
          <table className="admin-table">
            <thead><tr><th>Name</th><th>Email</th><th>Phone</th><th>Role</th><th>Joined</th><th>Status</th><th></th></tr></thead>
            <tbody>
              {users.map(u => (
                <tr key={u.id} data-testid={`admin-user-${u.email}`}>
                  <td>{u.name}</td>
                  <td>{u.email}</td>
                  <td>{u.phone || '—'}</td>
                  <td><span className={`status-pill ${u.role === 'admin' ? 'status-processing' : 'status-confirmed'}`}>{u.role}</span></td>
                  <td>{new Date(u.created_at).toLocaleDateString('en-GB')}</td>
                  <td>
                    <span className={`status-pill ${u.is_active ? 'status-confirmed' : 'status-cancelled'}`}>{u.is_active ? 'Active' : 'Disabled'}</span>
                  </td>
                  <td>
                    {u.role !== 'admin' && (
                      <button onClick={() => onToggle(u)} className="btn-outline">
                        {u.is_active ? 'Disable' : 'Enable'}
                      </button>
                    )}
                  </td>
                </tr>
              ))}
              {users.length === 0 && (
                <tr><td colSpan={7} style={{ textAlign: 'center', color: '#999', padding: 32 }}>No users.</td></tr>
              )}
            </tbody>
          </table>

          {pages > 1 && (
            <div className="pagination">
              <button disabled={page <= 1} onClick={() => setPage(p => p - 1)} className="btn-outline">Prev</button>
              <span>Page {page} of {pages}</span>
              <button disabled={page >= pages} onClick={() => setPage(p => p + 1)} className="btn-outline">Next</button>
            </div>
          )}
        </>
      )}
    </div>
  );
}
