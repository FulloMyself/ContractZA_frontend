import { useEffect, useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import { ArrowLeft, CheckCircle2, FileCheck2, ShieldCheck } from 'lucide-react';
import api, { errorMessage } from '../api/client';
import SignaturePad from '../components/SignaturePad';

export default function PublicSignPage() {
  const { token } = useParams();
  const [contract, setContract] = useState(null);
  const [signature, setSignature] = useState('');
  const [name, setName] = useState('');
  const [error, setError] = useState('');
  const [done, setDone] = useState('');
  const [busy, setBusy] = useState(false);
  useEffect(() => { api.get(`/sign/${encodeURIComponent(token)}`).then(({ data }) => { setContract(data.contract); setName(data.contract.signerName); }).catch((failure) => setError(errorMessage(failure))); }, [token]);
  async function respond(action) {
    setError(''); setBusy(true);
    try { const { data } = await api.post(`/sign/${encodeURIComponent(token)}`, { action, name, signature }); setDone(data.message); }
    catch (failure) { setError(errorMessage(failure)); }
    finally { setBusy(false); }
  }
  if (done) return <div className="sign-page"><div className="sign-success"><div className="success-icon"><CheckCircle2 size={30} /></div><div className="eyebrow">CONTRACTS ZAR</div><h1>{done}</h1><p className="muted">Your response has been recorded. You can now close this page.</p></div></div>;
  if (!contract) return <div className="sign-page"><div className="sign-error"><FileCheck2 size={30} /><h1>Signing link unavailable</h1><p>{error || 'Loading agreement…'}</p><Link to="/" className="button secondary"><ArrowLeft size={16} /> Go to Contracts ZAR</Link></div></div>;
  return <main className="sign-page"><header className="sign-header"><Link to="/" className="brand"><span className="brand-mark">C</span><span>Contracts <b>ZAR</b></span></Link><div><ShieldCheck size={17} /> Secure signature request</div></header><div className="sign-container"><div className="sign-eyebrow">AGREEMENT FOR REVIEW</div><h1>{contract.title}</h1><p className="muted">Prepared for {contract.signerName} ({contract.signerEmail}). Please review the agreement before responding.</p><section className="document-card"><div className="document-label"><FileCheck2 size={17} /> CONTRACT DOCUMENT</div><article>{contract.body}</article></section><div className="legal-note">Electronic signatures can be legally binding in South Africa, but some documents require additional formalities. If unsure, seek independent legal advice.</div><section className="signature-section"><h2>Your signature</h2><label className="field-label">Full legal name<input value={name} onChange={(e) => setName(e.target.value)} maxLength="160" /></label><SignaturePad onChange={setSignature} /></section>{error && <div className="alert error">{error}</div>}<div className="sign-actions"><button className="button danger-outline" disabled={busy} onClick={() => respond('decline')}>Decline</button><button className="button primary" disabled={busy || !signature || !name.trim()} onClick={() => respond('sign')}>{busy ? 'Submitting…' : 'Sign agreement'} <CheckCircle2 size={17} /></button></div><p className="sign-footnote">Your signing time, IP address and document fingerprint are recorded as evidence.</p></div></main>;
}
