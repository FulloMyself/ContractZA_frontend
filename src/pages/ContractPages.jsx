import { useEffect, useState } from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import { ArrowLeft, ArrowRight, CheckCircle2, Copy, Download, FileText, Plus, Search, Send, ShieldCheck } from 'lucide-react';
import api, { errorMessage } from '../api/client';
import SignaturePad from '../components/SignaturePad';

const templates = {
  custom: '',
  'service-agreement': `SERVICE AGREEMENT\n\n1. PARTIES\nThis agreement is between [Service Provider] and [Client].\n\n2. SERVICES\nThe Service Provider will provide the following services: [Describe services].\n\n3. FEES AND PAYMENT\nThe Client will pay [amount and payment schedule].\n\n4. TERM AND TERMINATION\nThis agreement begins on [date] and may be terminated by either party on [notice period] written notice.\n\n5. GENERAL\nThis agreement is governed by the laws of the Republic of South Africa.`,
  nda: `NON-DISCLOSURE AGREEMENT\n\n1. PARTIES\nThis agreement is between [Disclosing Party] and [Receiving Party].\n\n2. CONFIDENTIAL INFORMATION\nConfidential information includes information disclosed for [purpose], whether written, electronic or oral.\n\n3. OBLIGATIONS\nThe Receiving Party must protect the information, use it only for the stated purpose, and not disclose it without written consent.\n\n4. TERM\nThese obligations continue for [period] from the date of disclosure.\n\n5. GENERAL\nThis agreement is governed by the laws of the Republic of South Africa.`,
  'freelance-agreement': `FREELANCE AGREEMENT\n\n1. PARTIES\nThis agreement is between [Client] and [Freelancer].\n\n2. SCOPE AND DELIVERABLES\nThe Freelancer will deliver: [Describe work and milestones].\n\n3. FEES\nThe Client will pay [amount], due [payment terms].\n\n4. INTELLECTUAL PROPERTY\nOwnership and permitted use of deliverables: [Specify terms].\n\n5. TERM AND TERMINATION\nWork begins [date]. Either party may terminate on [notice period] written notice.\n\n6. GENERAL\nThis agreement is governed by the laws of the Republic of South Africa.`
};
const statusClass = (status) => `status status-${status}`;
function PageTitle({ eyebrow, title, action }) {
  return <div className="page-title"><div><div className="eyebrow">{eyebrow}</div><h1>{title}</h1></div>{action}</div>;
}
function ErrorAlert({ error }) { return error ? <div className="alert error">{error}</div> : null; }
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
  useEffect(() => { api.get('/contracts/stats').then(({ data: result }) => setData(result)).catch((failure) => setError(errorMessage(failure))); }, []);
  const stats = data?.stats || {};
  return <><PageTitle eyebrow="YOUR WORKSPACE" title="Good to see you." action={<Link className="button primary" to="/contracts/new"><Plus size={17} /> New contract</Link>} /><ErrorAlert error={error} /><div className="stat-grid"><div className="stat-card"><span className="stat-label">Total agreements</span><strong>{Object.values(stats).reduce((sum, value) => sum + value, 0)}</strong><small>Across all statuses</small></div><div className="stat-card"><span className="stat-label">Awaiting signatures</span><strong>{stats.pending || 0}</strong><small>Contracts in progress</small></div><div className="stat-card"><span className="stat-label">Completed</span><strong>{stats.signed || 0}</strong><small>Fully signed agreements</small></div><div className="stat-card"><span className="stat-label">Drafts</span><strong>{stats.draft || 0}</strong><small>Ready when you are</small></div></div><section className="panel"><div className="panel-heading"><div><h2>Recent agreements</h2><p>Your latest contract activity</p></div><Link className="text-link" to="/contracts">View all <ArrowRight size={15} /></Link></div>{data?.recent?.length ? <div className="table-scroll"><table><thead><tr><th>Contract</th><th>Status</th><th>Updated</th><th /></tr></thead><tbody>{data.recent.map((item) => <tr key={item._id}><td><Link className="table-title" to={`/contracts/${item._id}`}>{item.title}</Link></td><td><span className={statusClass(item.status)}>{item.status}</span></td><td>{new Date(item.updatedAt).toLocaleDateString('en-ZA')}</td><td><Link className="icon-link" to={`/contracts/${item._id}`} aria-label={`Open ${item.title}`}><ArrowRight size={17} /></Link></td></tr>)}</tbody></table></div> : <div className="empty-state"><div className="empty-icon"><FileText /></div><h3>Your next agreement starts here</h3><p>Create a contract, invite the other party and sign securely online.</p><Link className="button primary" to="/contracts/new">Create a contract <ArrowRight size={16} /></Link></div>}</section><div className="compliance-note"><ShieldCheck size={19} /><p><strong>A note on electronic signatures</strong><br />Some South African documents require additional formalities or an advanced electronic signature. Review your document requirements before signing.</p></div></>;
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
        <div className="table-scroll"><table><thead><tr><th>Contract</th><th>Status</th><th>Template</th><th>Last updated</th><th /></tr></thead>
          <tbody>{items.map((item) => <tr key={item._id}>
            <td><Link className="table-title" to={`/contracts/${item._id}`}>{item.title}</Link></td>
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
  function selectTemplate(template) { setValues({ ...values, template, body: templates[template] || values.body }); }
  return <><Link className="back-link" to={id ? `/contracts/${id}` : '/contracts'}><ArrowLeft size={16} /> {id ? 'Back to contract' : 'Back to contracts'}</Link><PageTitle eyebrow={id ? 'EDIT AGREEMENT' : 'NEW AGREEMENT'} title={id ? 'Edit your draft' : 'Create a contract'} /><ErrorAlert error={error} /><form className="panel contract-editor" onSubmit={submit}><label>Contract title<input required maxLength="160" placeholder="e.g. Website design services" value={values.title} onChange={(e) => setValues({ ...values, title: e.target.value })} /></label><label>Start with a South African template<select value={values.template} onChange={(e) => selectTemplate(e.target.value)}><option value="custom">Start from scratch</option><option value="service-agreement">Service agreement</option><option value="nda">Non-disclosure agreement</option><option value="freelance-agreement">Freelance agreement</option></select></label><label>Agreement text<textarea required rows="18" maxLength="100000" placeholder="Write the terms of your agreement here…" value={values.body} onChange={(e) => setValues({ ...values, body: e.target.value })} /></label><div className="editor-help"><ShieldCheck size={17} /> Use clear language and include each party’s obligations, payment terms and applicable dates.</div><div className="editor-actions"><Link className="button secondary" to={id ? `/contracts/${id}` : '/contracts'}>Cancel</Link><button className="button primary" disabled={busy}>{busy ? 'Saving…' : 'Save draft'} <ArrowRight size={16} /></button></div></form></>;
}

export function ContractDetailPage() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [contract, setContract] = useState(null);
  const [error, setError] = useState('');
  const [invite, setInvite] = useState({ name: '', email: '' });
  const [signature, setSignature] = useState('');
  const [signName, setSignName] = useState('');
  const [notice, setNotice] = useState('');
  const [busy, setBusy] = useState(false);
  async function load() {
    try { const { data } = await api.get(`/contracts/${id}`); setContract(data.contract); }
    catch (failure) { setError(errorMessage(failure)); }
  }
  useEffect(() => { load(); }, [id]);
  async function sendInvite(event) {
    event.preventDefault(); setBusy(true); setError(''); setNotice('');
    try { const { data } = await api.post(`/contracts/${id}/invite`, invite); setContract(data.contract); setNotice(data.message); setInvite({ name: '', email: '' }); }
    catch (failure) { setError(errorMessage(failure)); }
    finally { setBusy(false); }
  }
  async function sign() {
    setBusy(true); setError(''); setNotice('');
    try { const { data } = await api.post(`/contracts/${id}/sign`, { name: signName, signature }); setContract(data.contract); setNotice('Your signature has been recorded.'); setSignature(''); }
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
  if (!contract) return <><PageTitle eyebrow="AGREEMENT" title={error ? 'Contract unavailable' : 'Loading contract…'} /><ErrorAlert error={error} /></>;
  const ownerSigned = contract.signatures.some((item) => item.email === contract.parties.find((party) => party.role === 'owner')?.email);
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
      {contract.status === 'draft' && <Link className="button secondary" to={`/contracts/${id}/edit`}>Edit draft</Link>}
      <button className="button secondary" onClick={duplicate} disabled={busy}><Copy size={16} /> Duplicate</button>
      {contract.status === 'signed' && <button className="button secondary" onClick={downloadPdf}><Download size={16} /> Download PDF</button>}
      {['draft', 'pending', 'expired'].includes(contract.status) && <button className="button danger-outline" onClick={cancel}>Cancel contract</button>}
      {['draft', 'cancelled'].includes(contract.status) && <button className="button danger-outline" onClick={remove}>Delete</button>}
    </div>
    <div className="detail-grid">
      <section className="panel document-panel">
        <div className="panel-heading"><div><h2>Agreement text</h2><p>Review the document before inviting a signer</p></div></div>
        <article className="contract-body">{contract.body}</article>
      </section>
      <aside className="detail-aside">
        <section className="panel">
          <h2>Signatories</h2>
          <div className="party-list">{contract.parties.map((party) => <div className="party-row" key={party.email}>
            <div className="avatar">{party.name.split(' ').map((part) => part[0]).slice(0, 2).join('')}</div>
            <div className="party-info"><strong>{party.name}</strong><small>{party.email}{party.role === 'owner' ? ' · You' : ''}</small></div>
            <span className={`party-state ${party.signedAt ? 'complete' : ''}`}>{party.signedAt ? <CheckCircle2 size={16} /> : 'Pending'}</span>
          </div>)}</div>
          {['draft', 'pending', 'expired'].includes(contract.status) && <form className="invite-form" onSubmit={sendInvite}>
            <h3>Invite a signer</h3>
            <label>Full name<input required value={invite.name} onChange={(e) => setInvite({ ...invite, name: e.target.value })} /></label>
            <label>Email address<input required type="email" value={invite.email} onChange={(e) => setInvite({ ...invite, email: e.target.value })} /></label>
            <button className="button primary full" disabled={busy}><Send size={16} /> Send invitation</button>
          </form>}
        </section>
        {contract.status === 'pending' && !ownerSigned && <section className="panel">
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
