import { NavLink, Outlet, useLocation, useNavigate } from 'react-router-dom';
import { FileText, LayoutDashboard, LogOut, Settings, Shield, Plus, Menu, X, MessageSquareWarning, ShieldCheck, Check } from 'lucide-react';
import { useEffect, useState } from 'react';
import { useAuth } from '../context/AuthContext';
import api, { errorMessage } from '../api/client';
import { getMissingProfileDetails } from '../utils/profileCompletion';

export default function Layout() {
  const { user, logout, setUser } = useAuth();
  const [open, setOpen] = useState(false);
  const [counts, setCounts] = useState(null);
  const [countError, setCountError] = useState('');
  const [profileLoaded, setProfileLoaded] = useState(false);
  const [profileError, setProfileError] = useState('');
  const navigate = useNavigate();
  const location = useLocation();
  const isAdmin = user?.role === 'admin';
  const missingProfileDetails = profileLoaded ? getMissingProfileDetails(user) : null;
  useEffect(() => {
    let active = true;
    const endpoint = isAdmin ? '/admin/stats' : '/contracts/stats';
    async function loadCounts() {
      try {
        const { data } = await api.get(endpoint);
        if (active) {
          setCounts(data);
          setCountError('');
        }
      } catch (failure) {
        if (active) setCountError(errorMessage(failure));
      }
    }
    async function loadProfile() {
      try {
        const { data } = await api.get('/users/me');
        if (active) {
          setUser((current) => current?.id === data.user.id ? { ...current, ...data.user } : current);
          setProfileLoaded(true);
          setProfileError('');
        }
      } catch (failure) {
        if (active) setProfileError(errorMessage(failure));
      }
    }
    setCounts(null);
    const refreshTimeout = window.setTimeout(loadCounts, 500);
    const interval = window.setInterval(loadCounts, 60_000);
    loadProfile();
    const profileInterval = window.setInterval(loadProfile, 60_000);
    return () => {
      active = false;
      window.clearTimeout(refreshTimeout);
      window.clearInterval(interval);
      window.clearInterval(profileInterval);
    };
  }, [isAdmin, location.pathname, setUser, user?.id]);
  async function signOut() {
    await logout();
    navigate('/login');
  }
  const links = isAdmin
    ? [{ to: '/admin', label: 'Overview', icon: LayoutDashboard }, { to: '/admin/complaints', label: 'Complaints', icon: MessageSquareWarning, unread: counts?.unreadComplaints, awaiting: counts?.awaitingResponseComplaints }, { to: '/admin/users', label: 'Users', icon: Shield }, { to: '/admin/audit', label: 'Audit log', icon: FileText }, { to: '/profile', label: 'Profile settings', icon: Settings, missingProfileDetails }]
    : [{ to: '/dashboard', label: 'Overview', icon: LayoutDashboard }, { to: '/contracts', label: 'My contracts', icon: FileText, unread: counts?.unreadContracts }, { to: '/complaints', label: 'Complaints', icon: MessageSquareWarning, unread: counts?.unreadComplaints, awaiting: counts?.awaitingResponseComplaints }, { to: '/contracts/new', label: 'New contract', icon: Plus }, { to: '/profile', label: 'Profile settings', icon: Settings, missingProfileDetails }];
  return (
    <div className="app-shell">
      <aside className={`sidebar ${open ? 'sidebar-open' : ''}`}>
        <NavLink to={user?.role === 'admin' ? '/admin' : '/dashboard'} className="brand">
          <span className="brand-mark">C</span><span>Contracts <b>ZAR</b></span>
        </NavLink>
        <div className="workspace-label">WORKSPACE</div>
        <nav className="side-nav">
          {links.map(({ to, label, icon: Icon, unread, awaiting, missingProfileDetails }) => <NavLink key={to} to={to} end={to === '/dashboard' || to === '/admin'} onClick={() => setOpen(false)} className={({ isActive }) => `nav-link ${isActive ? 'active' : ''}`} aria-label={`${label}${unread ? `, ${unread} unread` : ''}${awaiting ? `, ${awaiting} awaiting your response` : ''}${to === '/profile' && profileError ? ', profile completion status unavailable' : ''}${to === '/profile' && missingProfileDetails > 0 ? `, ${missingProfileDetails} required details missing` : ''}${to === '/profile' && missingProfileDetails === 0 ? ', profile complete' : ''}`}>
            <Icon size={18} /><span>{label}</span>
            {(unread > 0 || awaiting > 0) && <span className="nav-counts">
              {unread > 0 && <span className="nav-count" title={`${unread} unread`}>{unread}</span>}
              {awaiting > 0 && <span className="nav-count nav-count-awaiting" title={`${awaiting} awaiting your response`}>{awaiting}</span>}
            </span>}
            {to === '/profile' && profileError && <span className="profile-count profile-count-error" title="Profile completion status unavailable" aria-hidden="true">!</span>}
            {to === '/profile' && !profileError && missingProfileDetails > 0 && <span className="profile-count" title={`${missingProfileDetails} required details missing`}>{missingProfileDetails}</span>}
            {to === '/profile' && !profileError && missingProfileDetails === 0 && <span className="profile-count profile-count-complete" title="Profile complete"><Check size={14} aria-hidden="true" /></span>}
          </NavLink>)}
        </nav>
        {countError && <p className="nav-count-error" role="status">Workspace counts unavailable: {countError}</p>}
        {profileError && <p className="nav-count-error" role="status">Profile completion status unavailable: {profileError}</p>}
        <div className="sidebar-bottom">
          <div className="user-chip"><div className="avatar">{user?.firstName?.[0]}{user?.lastName?.[0]}</div><div><strong>{user?.firstName} {user?.lastName}</strong><small>{user?.role === 'admin' ? 'Administrator' : user?.email}</small></div></div>
          <button className="nav-link signout" onClick={signOut}><LogOut size={18} /><span>Sign out</span></button>
        </div>
      </aside>
      {open && <button aria-label="Close menu" className="mobile-backdrop" onClick={() => setOpen(false)} />}
      <main className="main-area">
        <header className="topbar"><button className="mobile-menu" aria-label="Toggle menu" onClick={() => setOpen(!open)}>{open ? <X /> : <Menu />}</button><span className="topbar-caption">Agreements, made clear.</span><div className="topbar-user">{user?.firstName} {user?.lastName}<span className="avatar small">{user?.firstName?.[0]}{user?.lastName?.[0]}</span></div></header>
        <div className="page-content">
          {location.pathname === '/profile' && <div className="profile-completion-toast" role="status">
            <ShieldCheck size={19} />
            <p><strong>Keep your profile complete for contract engagement.</strong><br />
              Make sure your full name, verified email, phone numbers and residential or postal address are accurate and up to date. If required information is missing, an administrator may suspend the account after review; this is not automatic. Admins can view these contact details in the user dashboard, while national ID numbers remain masked.</p>
          </div>}
          <Outlet />
        </div>
        <footer className="app-footer">Contracts ZAR <span>Simple electronic signatures. Keep important agreements in one place.</span></footer>
      </main>
    </div>
  );
}
