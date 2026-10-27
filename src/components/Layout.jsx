import { NavLink, Outlet, useNavigate } from 'react-router-dom';
import { FileText, LayoutDashboard, LogOut, Settings, Shield, Plus, Menu, X } from 'lucide-react';
import { useState } from 'react';
import { useAuth } from '../context/AuthContext';

export default function Layout() {
  const { user, logout } = useAuth();
  const [open, setOpen] = useState(false);
  const navigate = useNavigate();
  async function signOut() {
    await logout();
    navigate('/login');
  }
  const links = user?.role === 'admin'
    ? [{ to: '/admin', label: 'Overview', icon: LayoutDashboard }, { to: '/admin/users', label: 'Users', icon: Shield }, { to: '/admin/audit', label: 'Audit log', icon: FileText }, { to: '/profile', label: 'Profile settings', icon: Settings }]
    : [{ to: '/dashboard', label: 'Overview', icon: LayoutDashboard }, { to: '/contracts', label: 'My contracts', icon: FileText }, { to: '/contracts/new', label: 'New contract', icon: Plus }, { to: '/profile', label: 'Profile settings', icon: Settings }];
  return (
    <div className="app-shell">
      <aside className={`sidebar ${open ? 'sidebar-open' : ''}`}>
        <NavLink to={user?.role === 'admin' ? '/admin' : '/dashboard'} className="brand">
          <span className="brand-mark">C</span><span>Contracts <b>ZAR</b></span>
        </NavLink>
        <div className="workspace-label">WORKSPACE</div>
        <nav className="side-nav">
          {links.map(({ to, label, icon: Icon }) => <NavLink key={to} to={to} end={to === '/dashboard' || to === '/admin'} onClick={() => setOpen(false)} className={({ isActive }) => `nav-link ${isActive ? 'active' : ''}`}><Icon size={18} /><span>{label}</span></NavLink>)}
        </nav>
        <div className="sidebar-bottom">
          <div className="user-chip"><div className="avatar">{user?.firstName?.[0]}{user?.lastName?.[0]}</div><div><strong>{user?.firstName} {user?.lastName}</strong><small>{user?.role === 'admin' ? 'Administrator' : user?.email}</small></div></div>
          <button className="nav-link signout" onClick={signOut}><LogOut size={18} /><span>Sign out</span></button>
        </div>
      </aside>
      {open && <button aria-label="Close menu" className="mobile-backdrop" onClick={() => setOpen(false)} />}
      <main className="main-area">
        <header className="topbar"><button className="mobile-menu" aria-label="Toggle menu" onClick={() => setOpen(!open)}>{open ? <X /> : <Menu />}</button><span className="topbar-caption">Agreements, made clear.</span><div className="topbar-user">{user?.firstName} {user?.lastName}<span className="avatar small">{user?.firstName?.[0]}{user?.lastName?.[0]}</span></div></header>
        <div className="page-content"><Outlet /></div>
        <footer className="app-footer">Contracts ZAR <span>Simple electronic signatures. Keep important agreements in one place.</span></footer>
      </main>
    </div>
  );
}
