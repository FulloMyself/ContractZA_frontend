import { useEffect, useState } from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import { ArrowLeft, ArrowRight, CalendarDays, CheckCircle2, Copy, Download, FileText, MessageSquareWarning, Plus, Search, Send, ShieldCheck } from 'lucide-react';
import api, { errorMessage } from '../api/client';
import SignaturePad from '../components/SignaturePad';
import { useAuth } from '../context/AuthContext';
import { contractTemplateGroups, contractTemplates } from '../data/contractTemplates';
import { complaintCategories } from '../data/complaints';
const statusClass = (status) => `status status-${status}`;
function PageTitle({ eyebrow, title, action }) {
  return <div className="page-title"><div><div className="eyebrow">{eyebrow}</div><h1>{title}</h1></div>{action}</div>;
}
function ErrorAlert({ error }) { return error ? <div className="alert error">{error}</div> : null; }
const reminderChoices = [{ days: 7, label: '7 days before' }, { days: 3, label: '3 days before' }, { days: 1, label: '1 day before' }];
function dateInputValue(value) { return value ? new Date(value).toISOString().slice(0, 10) : ''; }
function reminderSettingsFor(contract) {
  return {
    signingDeadline: dateInputValue(contract.signingDeadline),
    renewalDate: dateInputValue(contract.renewalDate),
    remindersEnabled: contract.remindersEnabled !== false,
    reminderDaysBefore: contract.reminderDaysBefore || [7, 3, 1],
    overdueSigningReminderEnabled: contract.overdueSigningReminderEnabled !== false
  };
}
function Pagination({ page, pages, onChange }) {
  if (pages <= 1) return null;
  return <div className="pagination">
    <span>Page {page} of {pages}</span>
    <div><button className="button secondary" disabled={page <= 1} onClick={() => onChange(page - 1)}>Previous</button><button className="button secondary" disabled={page >= pages} onClick={() => onChange(page + 1)}>Next</button></div>
  </div>;
}

export function DashboardPage() {
  const [data, setData] = useState(null);
  const [error, setError] = useState('');
  useEffect(() => {
    let active = true;
    async function loadStats() {
      try {
        const { data: result } = await api.get('/contracts/stats');
        if (active) { setData(result); setError(''); }
      } catch (failure) {
        if (active) setError(errorMessage(failure));
      }
    }
    loadStats();
    const interval = window.setInterval(loadStats, 60_000);
    return () => { active = false; window.clearInterval(interval); };
  }, []);
  const stats = data?.stats || {};
  return <>
    <PageTitle eyebrow="YOUR WORKSPACE" title="Good to see you." action={<Link className="button primary" to="/contracts/new"><Plus size={17} /> New contract</Link>} />
    <ErrorAlert error={error} />
    <div className="stat-grid dashboard-stat-grid">
      <div className="stat-card"><span className="stat-label">Total agreements</span><strong>{Object.values(stats).reduce((sum, value) => sum + value, 0)}</strong><small>Across all statuses</small></div>
      <div className="stat-card"><span className="stat-label">Awaiting signatures</span><strong>{stats.pending || 0}</strong><small>Contracts in progress</small></div>
      <div className="stat-card"><span className="stat-label">Completed</span><strong>{stats.signed || 0}</strong><small>Fully signed agreements</small></div>
      <div className="stat-card"><span className="stat-label">Drafts</span><strong>{stats.draft || 0}</strong><small>Ready when you are</small></div>
      <Link className="stat-card unread-stat-card" to="/contracts"><span className="stat-icon"><FileText size={18} /></span><span className="stat-label">Unread contracts</span><strong>{data?.unreadContracts || 0}</strong><small>Open a contract to mark it read</small></Link>
      <Link className="stat-card unread-stat-card" to="/complaints"><span className="stat-icon"><MessageSquareWarning size={18} /></span><span className="stat-label">Unread complaints</span><strong>{data?.unreadComplaints || 0}</strong><small>New or updated cases</small></Link>
      <Link className="stat-card unread-stat-card" to="/complaints"><span className="stat-icon"><MessageSquareWarning size={18} /></span><span className="stat-label">Awaiting your response</span><strong>{data?.awaitingResponseComplaints || 0}</strong><small>Cases last updated by someone else</small></Link>
    </div>
    <section className="panel upcoming-deadlines-panel">
      <div className="panel-heading"><div><h2>Upcoming deadlines</h2><p>Signing and renewal dates across your agreements</p></div><CalendarDays size={18} /></div>
      {data?.upcomingDeadlines?.length
        ? <div className="deadline-list">{data.upcomingDeadlines.map((deadline) => <Link className="deadline-row" to={`/contracts/${deadline._id}`} key={`${deadline._id}-${deadline.type}`}>
          <span className="deadline-icon"><CalendarDays size={16} /></span>
          <span className="deadline-info"><strong>{deadline.title}</strong><small>{deadline.type === 'signing' ? 'Signing deadline' : 'Renewal date'}</small></span>
          <time dateTime={deadline.date}>{new Date(deadline.date).toLocaleDateString('en-ZA', { day: 'numeric', month: 'short', year: 'numeric' })}</time>
        </Link>)}</div>
        : <div className="empty-mini">No signing or renewal deadlines scheduled. Set one from a contract’s details.</div>}
    </section>
    <section className="panel"><div className="panel-heading"><div><h2>Recent agreements</h2><p>Your latest contract activity</p></div><Link className="text-link" to="/contracts">View all <ArrowRight size={15} /></Link></div>{data?.recent?.length ? <div className="table-scroll"><table><thead><tr><th>Contract</th><th>Status</th><th>Updated</th><th /></tr></thead><tbody>{data.recent.map((item) => <tr key={item._id}><td><Link className="table-title" to={`/contracts/${item._id}`}>{item.title}</Link></td><td><span className={statusClass(item.status)}>{item.status}</span></td><td>{new Date(item.updatedAt).toLocaleDateString('en-ZA')}</td><td><Link className="icon-link" to={`/contracts/${item._id}`} aria-label={`Open ${item.title}`}><ArrowRight size={17} /></Link></td></tr>)}</tbody></table></div> : <div className="empty-state"><div className="empty-icon"><FileText /></div><h3>Your next agreement starts here</h3><p>Create a contract, invite the other party and sign securely online.</p><Link className="button primary" to="/contracts/new">Create a contract <ArrowRight size={16} /></Link></div>}</section>
    <div className="compliance-note"><ShieldCheck size={19} /><p><strong>A note on electronic signatures</strong><br />Some South African documents require additional formalities or an advanced electronic signature. Review your document requirements before signing.</p></div>
  </>;
}

export function ContractsPage() {
  const [items, setItems] = useState([]);
  const [status, setStatus] = useState('');
  const [search, setSearch] = useState('');
  const [page, setPage] = useState(1);
  const [pages, setPages] = useState(1);
  const [error, setError] = useState('');
  async function load() {
    try {
      const { data } = await api.get('/contracts', { params: { status: status || undefined, search: search || undefined, page } });
      setItems(data.contracts); setPages(data.pages); setError('');
    }
    catch (failure) { setError(errorMessage(failure)); }
  }
  useEffect(() => { load(); }, [status, page]);
  function submit(event) {
    event.preventDefault();
    if (page !== 1) setPage(1);
    else load();
  }
  function updateStatus(value) { setStatus(value); setPage(1); }
  return <>
    <PageTitle eyebrow="AGREEMENTS" title="My contracts" action={<Link className="button primary" to="/contracts/new"><Plus size={17} /> New contract</Link>} />
    <form className="filter-bar" onSubmit={submit}>
      <div className="search-field"><Search size={17} /><input placeholder="Search contracts" value={search} onChange={(e) => setSearch(e.target.value)} /></div>
      <select aria-label="Filter by status" value={status} onChange={(e) => updateStatus(e.target.value)}>
        <option value="">All statuses</option>
        {['draft', 'pending', 'signed', 'declined', 'expired', 'cancelled'].map((item) => <option key={item}>{item}</option>)}
      </select>
      <button className="button secondary">Search</button>
    </form>
    <ErrorAlert error={error} />
    <section className="panel">
      {items.length ? <>
        <div className="table-scroll"><table><thead><tr><th>Contract</th><th>Direction</th><th>Status</th><th>Template</th><th>Last updated</th><th /></tr></thead>
          <tbody>{items.map((item) => <tr key={item._id}>
            <td><Link className="table-title" to={`/contracts/${item._id}`}>{item.title}</Link></td>
            <td>{item.isOwner ? 'Sent' : 'Received'}</td>
            <td><span className={statusClass(item.status)}>{item.status}</span></td>
            <td>{item.template?.replaceAll('-', ' ') || 'Custom'}</td>
            <td>{new Date(item.updatedAt).toLocaleDateString('en-ZA')}</td>
            <td><Link className="icon-link" to={`/contracts/${item._id}`}><ArrowRight size={17} /></Link></td>
          </tr>)}</tbody>
        </table></div>
        <Pagination page={page} pages={pages} onChange={setPage} />
      </> : <div className="empty-state"><div className="empty-icon"><FileText /></div><h3>No matching contracts</h3><p>Try a different search, or create your first agreement.</p><Link className="button primary" to="/contracts/new">Create contract</Link></div>}
    </section>
  </>;
}

export function ContractFormPage() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [values, setValues] = useState({ title: '', body: '', template: 'custom' });
  const [error, setError] = useState('');
  const [busy, setBusy] = useState(false);
  useEffect(() => {
    if (!id) return;
    api.get(`/contracts/${id}`).then(({ data }) => setValues({ title: data.contract.title, body: data.contract.body, template: data.contract.template }))
      .catch((failure) => setError(errorMessage(failure)));
  }, [id]);
  async function submit(event) {
    event.preventDefault(); setBusy(true); setError('');
    try {
      const { data } = id ? await api.patch(`/contracts/${id}`, values) : await api.post('/contracts', values);
      navigate(`/contracts/${data.contract._id || data.contract.id}`);
    } catch (failure) { setError(errorMessage(failure)); }
    finally { setBusy(false); }
  }
  function selectTemplate(template) {
    const selected = contractTemplates[template];
    setValues({
      ...values,
      template,
      title: values.title || selected.title,
      body: selected.body || values.body
    });
  }
  return <><Link className="back-link" to={id ? `/contracts/${id}` : '/contracts'}><ArrowLeft size={16} /> {id ? 'Back to contract' : 'Back to contracts'}</Link><PageTitle eyebrow={id ? 'EDIT AGREEMENT' : 'NEW AGREEMENT'} title={id ? 'Edit your draft' : 'Create a contract'} /><ErrorAlert error={error} /><form className="panel contract-editor" onSubmit={submit}><label>Contract title<input required maxLength="160" placeholder="e.g. Website design services" value={values.title} onChange={(e) => setValues({ ...values, title: e.target.value })} /></label><label>Start with a South African template<select value={values.template} onChange={(e) => selectTemplate(e.target.value)}><option value="custom">{contractTemplates.custom.label}</option>{contractTemplateGroups.map((group) => <optgroup key={group.label} label={group.label}>{group.values.map((template) => <option key={template} value={template}>{contractTemplates[template].label}</option>)}</optgroup>)}</select></label><label>Agreement text<textarea required rows="18" maxLength="100000" placeholder="Write the terms of your agreement here…" value={values.body} onChange={(e) => setValues({ ...values, body: e.target.value })} /></label><div className="editor-help"><ShieldCheck size={17} /> Templates are starting points, not legal advice. Review and adapt every clause before signing.</div><div className="editor-actions"><Link className="button secondary" to={id ? `/contracts/${id}` : '/contracts'}>Cancel</Link><button className="button primary" disabled={busy}>{busy ? 'Saving…' : 'Save draft'} <ArrowRight size={16} /></button></div></form></>;
}

export function ContractDetailPage() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { user } = useAuth();
  const [contract, setContract] = useState(null);
  const [reminderSettings, setReminderSettings] = useState(null);
  const [error, setError] = useState('');
  const [invite, setInvite] = useState({ name: '', email: '' });
  const [signature, setSignature] = useState('');
  const [signName, setSignName] = useState('');
  const [complaintOpen, setComplaintOpen] = useState(false);
  const [complaint, setComplaint] = useState({ respondentEmail: '', category: 'other', subject: '', description: '' });
  const [notice, setNotice] = useState('');
  const [busy, setBusy] = useState(false);
  async function load() {
    try {
      const { data } = await api.get(`/contracts/${id}`);
      setContract(data.contract);
      setReminderSettings(reminderSettingsFor(data.contract));
      setSignName(data.contract.parties.find((party) => party.email === user.email)?.name || '');
    }
    catch (failure) { setError(errorMessage(failure)); }
  }
  useEffect(() => { load(); }, [id]);
  async function sendInvite(event) {
    event.preventDefault(); setBusy(true); setError(''); setNotice('');
    try { const { data } = await api.post(`/contracts/${id}/invite`, invite); setContract(data.contract); setNotice(data.message); setInvite({ name: '', email: '' }); }
    catch (failure) { setError(errorMessage(failure)); }
    finally { setBusy(false); }
  }
  async function saveReminderSettings(event) {
    event.preventDefault();
    setBusy(true); setError(''); setNotice('');
    try {
      const { data } = await api.patch(`/contracts/${id}/reminders`, {
        ...reminderSettings,
        signingDeadline: reminderSettings.signingDeadline || null,
        renewalDate: reminderSettings.renewalDate || null
      });
      setContract(data.contract);
      setReminderSettings(reminderSettingsFor(data.contract));
      setNotice(data.message);
    } catch (failure) { setError(errorMessage(failure)); }
    finally { setBusy(false); }
  }
  async function sign() {
    setBusy(true); setError(''); setNotice('');
    try {
      const endpoint = contract.isOwner ? `/contracts/${id}/sign` : `/contracts/${id}/sign-as-counterparty`;
      const { data } = await api.post(endpoint, { name: signName, signature });
      setContract(data.contract);
      setNotice('Your signature has been recorded.');
      setSignature('');
    }
    catch (failure) { setError(errorMessage(failure)); }
    finally { setBusy(false); }
  }
  async function duplicate() {
    setBusy(true);
    try { const { data } = await api.post('/contracts', { title: `${contract.title} (copy)`, body: contract.body, template: contract.template }); navigate(`/contracts/${data.contract._id || data.contract.id}`); }
    catch (failure) { setError(errorMessage(failure)); }
    finally { setBusy(false); }
  }
  async function remove() {
    if (!window.confirm('Delete this contract? This cannot be undone.')) return;
    try { await api.delete(`/contracts/${id}`); navigate('/contracts'); }
    catch (failure) { setError(errorMessage(failure)); }
  }
  async function cancel() {
    if (!window.confirm('Cancel this agreement and invalidate outstanding signing links?')) return;
    try { await api.post(`/contracts/${id}/cancel`); await load(); setNotice('Contract cancelled.'); }
    catch (failure) { setError(errorMessage(failure)); }
  }
  async function downloadPdf() {
    try {
      const response = await api.get(`/contracts/${id}/pdf`, { responseType: 'blob' });
      const href = URL.createObjectURL(response.data);
      const anchor = document.createElement('a');
      anchor.href = href;
      anchor.download = `${contract.title}.pdf`;
      anchor.click();
      URL.revokeObjectURL(href);
    } catch (failure) { setError(errorMessage(failure)); }
  }
  async function submitComplaint(event) {
    event.preventDefault();
    setBusy(true);
    setError('');
    try {
      const { data } = await api.post('/complaints', { ...complaint, contractId: id });
      navigate(`/complaints/${data.case._id}`, { state: { notificationWarning: data.notificationWarning } });
    } catch (failure) { setError(errorMessage(failure)); }
    finally { setBusy(false); }
  }
  if (!contract) return <><PageTitle eyebrow="AGREEMENT" title={error ? 'Contract unavailable' : 'Loading contract…'} /><ErrorAlert error={error} /></>;
  const ownerSigned = contract.signatures.some((item) => item.email === contract.parties.find((party) => party.role === 'owner')?.email);
  const currentParty = contract.parties.find((party) => party.email === user.email);
  const canSign = contract.status === 'pending' && !currentParty?.signedAt && !currentParty?.declinedAt
    && (contract.isOwner ? !ownerSigned : currentParty?.role === 'counterparty');
  const canSetSigningDeadline = ['draft', 'pending'].includes(contract.status);
  return <>
    <Link className="back-link" to="/contracts"><ArrowLeft size={16} /> All contracts</Link>
    <div className="detail-heading">
      <div>
        <div className="eyebrow">AGREEMENT DETAILS</div>
        <h1>{contract.title}</h1>
        <p className="muted">Created {new Date(contract.createdAt).toLocaleDateString('en-ZA')}</p>
      </div>
      <span className={statusClass(contract.status)}>{contract.status}</span>
    </div>
    <ErrorAlert error={error} />
    {notice && <div className="alert success">{notice}</div>}
    <div className="detail-actions">
      {contract.isOwner && contract.status === 'draft' && <Link className="button secondary" to={`/contracts/${id}/edit`}>Edit draft</Link>}
      {contract.isOwner && <button className="button secondary" onClick={duplicate} disabled={busy}><Copy size={16} /> Duplicate</button>}
      {contract.status === 'signed' && <button className="button secondary" onClick={downloadPdf}><Download size={16} /> Download PDF</button>}
      {contract.parties.some((party) => party.email !== user.email) && <button className="button secondary" onClick={() => setComplaintOpen(!complaintOpen)}>Report a concern</button>}
      {contract.isOwner && ['draft', 'pending', 'expired'].includes(contract.status) && <button className="button danger-outline" onClick={cancel}>Cancel contract</button>}
      {contract.isOwner && ['draft', 'cancelled'].includes(contract.status) && <button className="button danger-outline" onClick={remove}>Delete</button>}
    </div>
    {complaintOpen && <form className="panel complaint-report-form" onSubmit={submitComplaint}>
      <div><h2>Report a contract concern</h2><p className="muted">Describe the issue factually. The platform records the report and supports communication; it does not determine legal liability. Do not include passwords, ID numbers or unnecessary sensitive information.</p></div>
      <label>Other party<select required value={complaint.respondentEmail} onChange={(event) => setComplaint({ ...complaint, respondentEmail: event.target.value })}><option value="">Select a party</option>{contract.parties.filter((party) => party.email !== user.email).map((party) => <option key={party.email} value={party.email}>{party.name} ({party.email})</option>)}</select></label>
      <label>Issue category<select value={complaint.category} onChange={(event) => setComplaint({ ...complaint, category: event.target.value })}>{complaintCategories.map((category) => <option key={category.value} value={category.value}>{category.label}</option>)}</select></label>
      <label>Short subject<input required minLength="3" maxLength="160" value={complaint.subject} onChange={(event) => setComplaint({ ...complaint, subject: event.target.value })} /></label>
      <label>What happened?<textarea required minLength="20" maxLength="5000" rows="5" value={complaint.description} onChange={(event) => setComplaint({ ...complaint, description: event.target.value })} placeholder="Summarize the concern, relevant dates and what response you are seeking." /></label>
      <div className="complaint-form-actions"><button type="button" className="button secondary" onClick={() => setComplaintOpen(false)}>Cancel</button><button className="button primary" disabled={busy || !complaint.respondentEmail}>{busy ? 'Submitting…' : 'Submit complaint'}</button></div>
    </form>}
    <div className="detail-grid">
      <section className="panel document-panel">
        <div className="panel-heading"><div><h2>Agreement text</h2><p>Review the terms and signing status</p></div></div>
        <article className="contract-body">{contract.body}</article>
      </section>
      <aside className="detail-aside">
        <section className="panel reminder-panel">
          <div className="panel-heading"><div><h2>Deadlines & reminders</h2><p>Keep signing and renewal dates on track</p></div><CalendarDays size={18} /></div>
          {contract.isOwner && reminderSettings ? <form className="reminder-settings-form" onSubmit={saveReminderSettings}>
            {canSetSigningDeadline
              ? <label>Signing deadline <span className="optional">Optional</span><input type="date" min={new Date().toISOString().slice(0, 10)} value={reminderSettings.signingDeadline} onChange={(event) => setReminderSettings({ ...reminderSettings, signingDeadline: event.target.value })} /></label>
              : contract.signingDeadline && <p className="muted">Signing deadline: <strong>{new Date(contract.signingDeadline).toLocaleDateString('en-ZA')}</strong> (no longer active)</p>}
            {contract.status === 'signed'
              ? <label>Renewal date <span className="optional">Optional</span><input type="date" min={new Date().toISOString().slice(0, 10)} value={reminderSettings.renewalDate} onChange={(event) => setReminderSettings({ ...reminderSettings, renewalDate: event.target.value })} /></label>
              : <small className="reminder-recipients">A renewal date can be added after all parties have signed.</small>}
            <label className="check-label"><input type="checkbox" checked={reminderSettings.remindersEnabled} onChange={(event) => setReminderSettings({ ...reminderSettings, remindersEnabled: event.target.checked })} /> Email deadline reminders</label>
            {reminderSettings.remindersEnabled && <>
              <fieldset className="reminder-day-options" disabled={busy}>
                <legend>Send reminders</legend>
                {reminderChoices.map(({ days, label }) => <label className="check-label" key={days}><input type="checkbox" checked={reminderSettings.reminderDaysBefore.includes(days)} onChange={(event) => {
                  const nextDays = event.target.checked
                    ? [...reminderSettings.reminderDaysBefore, days]
                    : reminderSettings.reminderDaysBefore.filter((value) => value !== days);
                  setReminderSettings({ ...reminderSettings, reminderDaysBefore: nextDays.sort((a, b) => b - a) });
                }} /> {label}</label>)}
              </fieldset>
              {contract.status === 'pending' && <label className="check-label"><input type="checkbox" checked={reminderSettings.overdueSigningReminderEnabled} onChange={(event) => setReminderSettings({ ...reminderSettings, overdueSigningReminderEnabled: event.target.checked })} /> Send one follow-up if signatures are still pending</label>}
              <small className="reminder-recipients">Signing reminders go to you and unsigned signers. Renewal reminders go to all contract parties.</small>
            </>}
            <button className="button secondary full" disabled={busy}>{busy ? 'Saving…' : 'Save deadline settings'}</button>
          </form> : <div className="reminder-readonly">
            {contract.signingDeadline && <p><strong>Signing deadline</strong><span>{new Date(contract.signingDeadline).toLocaleDateString('en-ZA')}</span></p>}
            {contract.renewalDate && <p><strong>Renewal date</strong><span>{new Date(contract.renewalDate).toLocaleDateString('en-ZA')}</span></p>}
            {!contract.signingDeadline && !contract.renewalDate && <p className="muted">No deadlines have been set by the contract owner.</p>}
          </div>}
        </section>
        <section className="panel">
          <h2>Signatories</h2>
          <div className="party-list">{contract.parties.map((party) => <div className="party-row" key={party.email}>
            <div className="avatar">{party.name.split(' ').map((part) => part[0]).slice(0, 2).join('')}</div>
            <div className="party-info"><strong>{party.name}</strong><small>{party.email}{party.email === user.email ? ' · You' : ''}</small></div>
            <span className={`party-state ${party.signedAt ? 'complete' : ''}`}>{party.signedAt ? <CheckCircle2 size={16} /> : 'Pending'}</span>
          </div>)}</div>
          {contract.isOwner && ['draft', 'pending', 'expired'].includes(contract.status) && <form className="invite-form" onSubmit={sendInvite}>
            <h3>Invite a signer</h3>
            <label>Full name<input required value={invite.name} onChange={(e) => setInvite({ ...invite, name: e.target.value })} /></label>
            <label>Email address<input required type="email" value={invite.email} onChange={(e) => setInvite({ ...invite, email: e.target.value })} /></label>
            <button className="button primary full" disabled={busy}><Send size={16} /> Send invitation</button>
          </form>}
        </section>
        {canSign && <section className="panel">
          <h2>Your signature</h2><p className="muted">Sign to complete your side of the agreement.</p>
          <label className="field-label">Full legal name<input value={signName} onChange={(e) => setSignName(e.target.value)} /></label>
          <SignaturePad onChange={setSignature} />
          <button className="button primary full top-space" disabled={busy || !signName.trim() || !signature} onClick={sign}>Sign contract <CheckCircle2 size={16} /></button>
        </section>}
        <div className="compliance-note compact"><ShieldCheck size={17} /><p>Signature timestamp and document hash are stored in the completion certificate.</p></div>
      </aside>
    </div>
  </>;
}
