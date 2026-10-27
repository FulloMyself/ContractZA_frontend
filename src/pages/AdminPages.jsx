import { useEffect, useState } from 'react';
import { Search, ShieldCheck, Users, FileText, Activity, Check, X } from 'lucide-react';
import api, { errorMessage } from '../api/client';

function Heading({ title, subtitle }) { return <div className="page-title"><div><div className="eyebrow">ADMINISTRATION</div><h1>{title}</h1>{subtitle && <p className="muted">{subtitle}</p>}</div></div>; }

export function AdminDashboardPage() {
  const [stats, setStats] = useState(null);
  const [error, setError] = useState('');
  useEffect(() => { api.get('/admin/stats').then(({ data }) => setStats(data)).catch((failure) => setError(errorMessage(failure))); }, []);
  const userTotal = stats ? Object.values(stats.users).reduce((sum, item) => sum + item, 0) : 0;
  const contractTotal = stats ? Object.values(stats.contracts).reduce((sum, item) => sum + item, 0) : 0;
  return <><Heading title="Platform overview" subtitle="A privacy-first view of platform activity." />{error && <div className="alert error">{error}</div>}<div className="stat-grid"><div className="stat-card"><span className="stat-icon"><Users size={18} /></span><span className="stat-label">Total users</span><strong>{userTotal}</strong><small>{stats?.users?.active || 0} active accounts</small></div><div className="stat-card"><span className="stat-icon"><FileText size={18} /></span><span className="stat-label">Contracts</span><strong>{contractTotal}</strong><small>Metadata only</small></div><div className="stat-card"><span className="stat-icon"><ShieldCheck size={18} /></span><span className="stat-label">Correction requests</span><strong>{stats?.pendingCorrections || 0}</strong><small>Awaiting review</small></div><div className="stat-card"><span className="stat-icon"><Activity size={18} /></span><span className="stat-label">Recent activity</span><strong>{stats?.recentActivity || 0}</strong><small>Audit events in 24 hours</small></div></div><div className="compliance-note"><ShieldCheck size={19} /><p><strong>Privacy by design</strong><br />Administrator dashboards show account and contract metadata only. Contract content is never exposed here.</p></div></>;
}

export function AdminUsersPage() {
  const [users, setUsers] = useState([]);
  const [requests, setRequests] = useState([]);
  const [search, setSearch] = useState('');
  const [page, setPage] = useState(1);
  const [pages, setPages] = useState(1);
  const [error, setError] = useState('');
  const [pending, setPending] = useState(null);
  async function load() {
    try {
      const [usersResult, correctionResult] = await Promise.all([
        api.get('/admin/users', { params: { search: search || undefined, page } }),
        api.get('/admin/correction-requests')
      ]);
      setUsers(usersResult.data.users); setPages(usersResult.data.pages || 1); setRequests(correctionResult.data.requests); setError('');
      if (page > usersResult.data.pages && usersResult.data.pages > 0) setPage(usersResult.data.pages);
    } catch (failure) { setError(errorMessage(failure)); }
  }
  useEffect(() => { load(); }, [page]);
  async function setStatus(user, status) {
    setPending(user._id); setError('');
    try { await api.patch(`/admin/users/${user._id}/status`, { status }); await load(); }
    catch (failure) { setError(errorMessage(failure)); }
    finally { setPending(null); }
  }
  async function deleteUser(user) {
    if (!window.confirm(`Permanently delete ${user.firstName} ${user.lastName} and their contracts? This cannot be undone.`)) return;
    setPending(user._id); setError('');
    try { await api.delete(`/admin/users/${user._id}`); await load(); }
    catch (failure) { setError(errorMessage(failure)); }
    finally { setPending(null); }
  }
  async function review(request, decision) {
    setPending(String(request._id)); setError('');
    try { await api.patch(`/admin/correction-requests/${request._id}`, { decision }); await load(); }
    catch (failure) { setError(errorMessage(failure)); }
    finally { setPending(null); }
  }
  function searchUsers(event) {
    event.preventDefault();
    if (page !== 1) setPage(1);
    else load();
  }
  return <>
    <Heading title="Users & corrections" subtitle="Manage accounts and review legal identity correction requests." />
    {error && <div className="alert error">{error}</div>}
    <section className="panel">
      <div className="panel-heading">
        <div><h2>Accounts</h2><p>Search by name or email. Contract content is not visible.</p></div>
        <form className="admin-search" onSubmit={searchUsers}>
          <div className="search-field"><Search size={16} /><input placeholder="Find a user" value={search} onChange={(e) => setSearch(e.target.value)} /></div>
        </form>
      </div>
      <div className="table-scroll"><table>
        <thead><tr><th>User</th><th>Role</th><th>Status</th><th>Joined</th><th>Actions</th></tr></thead>
        <tbody>{users.map((user) => <tr key={user._id}>
          <td><strong className="table-title">{user.firstName} {user.lastName}</strong><small className="table-subtitle">{user.email}</small></td>
          <td>{user.role}</td><td><span className={`status status-${user.status}`}>{user.status}</span></td>
          <td>{new Date(user.createdAt).toLocaleDateString('en-ZA')}</td>
          <td>{user.role !== 'admin' && <div className="user-actions">
            <button className="text-button" disabled={pending === user._id} onClick={() => setStatus(user, user.status === 'active' ? 'suspended' : 'active')}>{user.status === 'active' ? 'Suspend' : 'Reactivate'}</button>
            <button className="text-button danger-text" disabled={pending === user._id} onClick={() => deleteUser(user)}>Delete</button>
          </div>}</td>
        </tr>)}</tbody>
      </table>{!users.length && <div className="empty-mini">No users found.</div>}</div>
      {pages > 1 && <div className="pagination"><span>Page {page} of {pages}</span><div>
        <button className="button secondary" disabled={page <= 1} onClick={() => setPage(page - 1)}>Previous</button>
        <button className="button secondary" disabled={page >= pages} onClick={() => setPage(page + 1)}>Next</button>
      </div></div>}
    </section>
    <section className="panel">
      <div className="panel-heading"><div><h2>Correction requests</h2><p>Review requested name or ID changes.</p></div><span className="status status-pending">{requests.length} pending</span></div>
      {requests.length ? <div className="correction-list">{requests.map((request) => <article className="correction-card" key={request._id}>
        <div className="correction-top"><div><strong>{request.user?.firstName} {request.user?.lastName}</strong><small>{request.user?.email} · {new Date(request.createdAt).toLocaleDateString('en-ZA')}</small></div>
          <div className="correction-actions">
            <button className="button mini secondary" disabled={pending === String(request._id)} onClick={() => review(request, 'rejected')}><X size={15} /> Reject</button>
            <button className="button mini primary" disabled={pending === String(request._id)} onClick={() => review(request, 'approved')}><Check size={15} /> Approve</button>
          </div>
        </div>
        <p>{request.reason}</p>
        <div className="requested-fields">{Object.entries(request.requestedChanges || {}).map(([key, value]) => <div key={key}><small>{key === 'idNumber' ? 'SA ID number' : key}</small><strong>{String(value)}</strong></div>)}</div>
      </article>)}</div> : <div className="empty-mini">No pending correction requests.</div>}
    </section>
  </>;
}

export function AdminAuditPage() {
  const [entries, setEntries] = useState([]);
  const [page, setPage] = useState(1);
  const [pages, setPages] = useState(1);
  const [error, setError] = useState('');
  useEffect(() => {
    api.get('/admin/audit-log', { params: { page } })
      .then(({ data }) => { setEntries(data.entries); setPages(data.pages); setError(''); })
      .catch((failure) => setError(errorMessage(failure)));
  }, [page]);
  return <>
    <Heading title="Audit log" subtitle="A traceable record of authentication, account and contract events." />
    {error && <div className="alert error">{error}</div>}
    <section className="panel"><div className="table-scroll"><table>
      <thead><tr><th>Event</th><th>Actor</th><th>Record</th><th>Fields</th><th>Date</th></tr></thead>
      <tbody>{entries.map((entry) => <tr key={entry._id}>
        <td><span className="audit-action">{entry.action}</span></td>
        <td>{entry.actor ? `${entry.actor.firstName} ${entry.actor.lastName}` : 'Public signer'}</td>
        <td>{entry.targetType || '—'}</td><td>{entry.fields?.join(', ') || '—'}</td>
        <td>{new Date(entry.createdAt).toLocaleString('en-ZA')}</td>
      </tr>)}</tbody>
    </table>{!entries.length && <div className="empty-mini">No audit activity recorded.</div>}</div>
      {pages > 1 && <div className="pagination"><span>Page {page} of {pages}</span><div>
        <button className="button secondary" disabled={page <= 1} onClick={() => setPage(page - 1)}>Previous</button>
        <button className="button secondary" disabled={page >= pages} onClick={() => setPage(page + 1)}>Next</button>
      </div></div>}
    </section>
  </>;
}
