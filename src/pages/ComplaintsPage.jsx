import { useEffect, useState } from 'react';
import { Link, useLocation, useParams } from 'react-router-dom';
import { ArrowLeft, ArrowRight, MessageSquareWarning, Send, ShieldCheck } from 'lucide-react';
import api, { errorMessage } from '../api/client';
import { useAuth } from '../context/AuthContext';
import { complaintCategoryLabel, complaintStatuses, complaintStatusLabel } from '../data/complaints';

function PageHeading({ admin }) {
  return <div className="page-title"><div><div className="eyebrow">{admin ? 'PLATFORM SUPPORT' : 'CONTRACT SUPPORT'}</div><h1>{admin ? 'Complaints & disputes' : 'My complaint cases'}</h1><p className="muted">{admin
    ? 'Help parties communicate and track platform actions. Do not decide legal liability.'
    : 'Review and respond to contract complaint cases involving you.'}</p></div></div>;
}

function Pagination({ page, pages, onChange }) {
  if (pages <= 1) return null;
  return <div className="pagination">
    <span>Page {page} of {pages}</span>
    <div>
      <button className="button secondary" disabled={page <= 1} onClick={() => onChange(page - 1)}><ArrowLeft size={15} /> Previous</button>
      <button className="button secondary" disabled={page >= pages} onClick={() => onChange(page + 1)}>Next <ArrowRight size={15} /></button>
    </div>
  </div>;
}

function CaseSummary({ caseRecord, admin, selected }) {
  return <Link className={`complaint-list-item ${selected ? 'selected' : ''}`} to={`${admin ? '/admin/complaints' : '/complaints'}/${caseRecord._id}`}>
    <span className="complaint-list-top"><strong>{caseRecord.subject}</strong><span className={`status status-${caseRecord.status === 'closed' ? 'cancelled' : caseRecord.status === 'submitted' ? 'pending' : 'active'}`}>{complaintStatusLabel(caseRecord.status)}</span></span>
    <small>{caseRecord.contractTitle} · {complaintCategoryLabel(caseRecord.category)}</small>
    <small>{admin ? `Reported by ${caseRecord.complainantName} · ${caseRecord.respondentName}` : `Reported by ${caseRecord.complainantName}`}</small>
  </Link>;
}

export function UserComplaintsPage() {
  return <ComplaintsWorkspace admin={false} />;
}

export function AdminComplaintsPage() {
  return <ComplaintsWorkspace admin />;
}

function ComplaintsWorkspace({ admin }) {
  const { id } = useParams();
  const location = useLocation();
  const { user } = useAuth();
  const [cases, setCases] = useState([]);
  const [caseRecord, setCaseRecord] = useState(null);
  const [statusFilter, setStatusFilter] = useState('');
  const [page, setPage] = useState(1);
  const [pages, setPages] = useState(1);
  const [total, setTotal] = useState(0);
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');
  const [notificationWarning, setNotificationWarning] = useState('');
  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState(false);

  async function loadCases() {
    setLoading(true);
    try {
      const { data } = await api.get(admin ? '/admin/complaints' : '/complaints', {
        params: { page, limit: 20, ...(admin && statusFilter ? { status: statusFilter } : {}) }
      });
      setCases(data.cases);
      setPage(data.page);
      setPages(data.pages);
      setTotal(data.total);
      setError('');
    } catch (failure) {
      setError(errorMessage(failure));
    } finally {
      setLoading(false);
    }
  }

  async function loadCase() {
    setError('');
    try {
      const { data } = await api.get(`${admin ? '/admin/complaints' : '/complaints'}/${id}`);
      setCaseRecord(data.case);
      setError('');
    } catch (failure) {
      setCaseRecord(null);
      setError(errorMessage(failure));
    }
  }

  useEffect(() => { loadCases(); }, [admin, statusFilter, page]);
  useEffect(() => {
    setCaseRecord(null);
    if (id) loadCase();
  }, [id, admin]);

  async function sendMessage(event) {
    event.preventDefault();
    if (!message.trim()) return;
    setBusy(true);
    setError('');
    setNotificationWarning('');
    try {
      const { data } = await api.post(`${admin ? '/admin/complaints' : '/complaints'}/${id}/messages`, { body: message });
      setCaseRecord(data.case);
      setNotificationWarning(data.notificationWarning || '');
      setMessage('');
      await loadCases();
    } catch (failure) {
      setError(errorMessage(failure));
    } finally {
      setBusy(false);
    }
  }

  async function updateStatus(nextStatus) {
    setBusy(true);
    setError('');
    setNotificationWarning('');
    try {
      const { data } = await api.patch(`/admin/complaints/${id}/status`, { status: nextStatus });
      setCaseRecord(data.case);
      setNotificationWarning(data.notificationWarning || '');
      await loadCases();
    } catch (failure) {
      setError(errorMessage(failure));
    } finally {
      setBusy(false);
    }
  }

  const myEmail = user.email.toLowerCase();
  if (loading && !cases.length) {
    return <><PageHeading admin={admin} /><div className="loading-inline"><span className="spinner" /> Loading complaint cases…</div></>;
  }

  return <>
    <PageHeading admin={admin} />
    <div className="complaint-privacy-note"><ShieldCheck size={18} /><p><strong>Neutral platform support</strong><br />Contracts ZAR records the report and helps the parties communicate. Administrators do not decide whether a contract was breached and cannot provide legal advice. Do not post bank details, ID numbers, passwords or unnecessary sensitive information. Email notifications are sent when a case is opened or a response is added; the response text is not included in notification emails.</p></div>
    {location.state?.notificationWarning && <div className="alert error">{location.state.notificationWarning}</div>}
    {error && <div className="alert error">{error}</div>}
    {notificationWarning && <div className="alert error" role="status">{notificationWarning}</div>}
    <div className="complaint-workspace">
      <section className="panel complaint-inbox">
        <div className="panel-heading"><div><h2>{admin ? 'Case queue' : 'Cases involving you'}</h2><p>{total} case{total === 1 ? '' : 's'}</p></div>
          {admin && <select aria-label="Filter complaint cases" value={statusFilter} onChange={(event) => { setStatusFilter(event.target.value); setPage(1); }}><option value="">All statuses</option>{complaintStatuses.map((status) => <option key={status.value} value={status.value}>{status.label}</option>)}</select>}
        </div>
        {cases.length ? <div className="complaint-list">{cases.map((item) => <CaseSummary key={item._id} caseRecord={item} admin={admin} selected={item._id === id} />)}</div>
          : <div className="empty-mini">{admin ? 'No cases match this filter.' : 'No complaint cases involve your account yet.'}</div>}
        <Pagination page={page} pages={pages} onChange={setPage} />
      </section>

      <section className="panel complaint-detail">
        {!id && <div className="complaint-empty"><span><MessageSquareWarning size={24} /></span><h2>{admin ? 'Select a case to review' : 'Choose a case'}</h2><p>{admin ? 'Review the parties’ reports and responses. Contract text is not available in this case view.' : 'Open a case to read updates and respond.'}</p></div>}
        {id && !caseRecord && !error && <div className="loading-inline"><span className="spinner" /> Loading case…</div>}
        {caseRecord && <>
          <Link className="back-link complaint-back" to={admin ? '/admin/complaints' : '/complaints'}><ArrowLeft size={15} /> All cases</Link>
          <div className="complaint-detail-heading"><div><div className="eyebrow">CASE · {String(caseRecord._id).slice(-8).toUpperCase()}</div><h2>{caseRecord.subject}</h2></div><span className={`status status-${caseRecord.status === 'closed' ? 'cancelled' : caseRecord.status === 'submitted' ? 'pending' : 'active'}`}>{complaintStatusLabel(caseRecord.status)}</span></div>
          <div className="complaint-facts"><span><small>Contract</small><strong>{caseRecord.contractTitle}</strong></span><span><small>Category</small><strong>{complaintCategoryLabel(caseRecord.category)}</strong></span><span><small>Reported by</small><strong>{caseRecord.complainantName}</strong></span><span><small>Other party</small><strong>{caseRecord.respondentName}</strong></span></div>
          <p className="complaint-legal-note">Contract status when reported: <strong>{caseRecord.contractStatusAtReport}</strong>. This is a platform record, not a finding about the contract’s legal merits.</p>
          {admin && caseRecord.status !== 'closed' && <label className="complaint-status-control">Case status<select disabled={busy} value={caseRecord.status} onChange={(event) => updateStatus(event.target.value)}>{complaintStatuses.map((status) => <option key={status.value} value={status.value}>{status.label}</option>)}</select></label>}
          <div className="complaint-messages" aria-label="Case responses">
            {caseRecord.messages.map((item) => <article className={`complaint-message ${item.authorRole === 'admin' ? 'platform-message' : ''}`} key={item._id}>
              <div><strong>{item.authorName}</strong><span>{item.authorRole === 'admin' ? 'Platform support' : item.authorEmail === myEmail ? 'You' : 'Party'} · {new Date(item.createdAt).toLocaleString('en-ZA')}</span></div>
              <p>{item.body}</p>
            </article>)}
          </div>
          {caseRecord.status === 'closed'
            ? <div className="alert success">This case is closed in Contracts ZAR. This does not determine or settle the parties’ legal rights.</div>
            : <form className="complaint-reply" onSubmit={sendMessage}><label>Written response<textarea required rows="4" maxLength="5000" value={message} onChange={(event) => setMessage(event.target.value)} placeholder="Keep responses factual and focused on the reported concern." /></label><div><small>{message.length}/5000 characters</small><button className="button primary" disabled={busy || !message.trim()}><Send size={15} /> {busy ? 'Sending…' : 'Add response'}</button></div></form>}
        </>}
      </section>
    </div>
  </>;
}
