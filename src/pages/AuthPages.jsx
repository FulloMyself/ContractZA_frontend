import { useEffect, useRef, useState } from 'react';
import { Link, useLocation, useNavigate, useSearchParams } from 'react-router-dom';
import { ArrowLeft, ArrowRight, CheckCircle2 } from 'lucide-react';
import api, { errorMessage } from '../api/client';
import { useAuth } from '../context/AuthContext';
import { validateSAId } from '../utils/saId';

function AuthShell({ eyebrow = 'CONTRACTS ZAR', title, subtitle, children }) {
  return <main className="auth-page"><section className="auth-panel"><Link to="/" className="brand auth-brand"><span className="brand-mark">C</span><span>Contracts <b>ZAR</b></span></Link><div className="auth-content"><div className="eyebrow">{eyebrow}</div><h1>{title}</h1><p className="muted">{subtitle}</p>{children}</div><div className="auth-note">Secure agreements, thoughtfully managed.</div></section><aside className="auth-art"><div className="art-glow" /><div className="art-copy"><div className="eyebrow light">BUILT FOR SOUTH AFRICA</div><h2>Make room for<br />the work that matters.</h2><p>Create clear agreements. Sign with confidence. Keep every detail together.</p><div className="art-stamp"><span>RSA</span><small>Contracts<br />made simple</small></div></div></aside></main>;
}

function Alert({ children, success = false }) {
  if (!children) return null;
  return <div className={`alert ${success ? 'success' : 'error'}`} role="status">{children}</div>;
}

export function LoginPage() {
  const { login } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const [values, setValues] = useState({ email: '', password: '' });
  const [error, setError] = useState('');
  const [notice, setNotice] = useState(location.state?.message || '');
  const [busy, setBusy] = useState(false);
  async function submit(event) {
    event.preventDefault(); setError(''); setNotice(''); setBusy(true);
    try { const user = await login(values.email, values.password); navigate(user.role === 'admin' ? '/admin' : '/dashboard'); }
    catch (failure) { setError(errorMessage(failure)); }
    finally { setBusy(false); }
  }
  async function resendVerification() {
    setError(''); setNotice('');
    try { const { data } = await api.post('/auth/resend-verification', { email: values.email }); setNotice(data.message); }
    catch (failure) { setError(errorMessage(failure)); }
  }
  return <AuthShell eyebrow="WELCOME BACK" title="Sign in to your account" subtitle="Your agreements are right where you left them."><form className="form-stack" onSubmit={submit}><Alert>{error}</Alert><Alert success>{notice}</Alert><label>Email address<input required type="email" autoComplete="email" value={values.email} onChange={(e) => setValues({ ...values, email: e.target.value })} /></label><label>Password<input required type="password" autoComplete="current-password" value={values.password} onChange={(e) => setValues({ ...values, password: e.target.value })} /></label><div className="form-aside"><button type="button" className="text-button" onClick={resendVerification}>Resend verification email</button><Link to="/forgot-password">Forgot password?</Link></div><button className="button primary full" disabled={busy}>{busy ? 'Signing in…' : 'Sign in'} <ArrowRight size={17} /></button></form><p className="auth-switch">New to Contracts ZAR? <Link to="/register">Create an account</Link></p></AuthShell>;
}

export function RegisterPage() {
  const [values, setValues] = useState({ firstName: '', lastName: '', email: '', idNumber: '', password: '' });
  const [error, setError] = useState('');
  const [done, setDone] = useState(false);
  const [busy, setBusy] = useState(false);
  const idValidation = values.idNumber.length === 13 ? validateSAId(values.idNumber) : null;
  async function submit(event) {
    event.preventDefault(); setError('');
    if (idValidation && !idValidation.valid) { setError(idValidation.reason); return; }
    setBusy(true);
    try { await api.post('/auth/register', values); setDone(true); }
    catch (failure) { setError(errorMessage(failure)); }
    finally { setBusy(false); }
  }
  return <AuthShell eyebrow="GET STARTED" title={done ? 'Check your inbox' : 'Create your account'} subtitle={done ? 'We sent you a verification link to activate your account.' : 'A secure home for the agreements you care about.'}>{done ? <div className="success-card"><CheckCircle2 size={30} /><p>Your account is registered. Follow the link in your email, then sign in.</p><Link className="button primary full" to="/login">Go to sign in</Link></div> : <form className="form-stack" onSubmit={submit}><Alert>{error}</Alert><div className="form-grid"><label>First name(s)<input required maxLength="80" autoComplete="given-name" value={values.firstName} onChange={(e) => setValues({ ...values, firstName: e.target.value })} /></label><label>Surname<input required maxLength="80" autoComplete="family-name" value={values.lastName} onChange={(e) => setValues({ ...values, lastName: e.target.value })} /></label></div><label>Email address<input required type="email" autoComplete="email" value={values.email} onChange={(e) => setValues({ ...values, email: e.target.value })} /></label><label>South African ID number<input required inputMode="numeric" pattern="[0-9]{13}" maxLength="13" autoComplete="off" value={values.idNumber} onChange={(e) => setValues({ ...values, idNumber: e.target.value.replace(/\D/g, '') })} />{idValidation && <small className={idValidation.valid ? 'field-valid' : 'field-error'}>{idValidation.valid ? 'ID number format looks valid.' : idValidation.reason}</small>}{!idValidation && <small>13 digits. Used to confirm your date of birth and protect account uniqueness.</small>}</label><label>Password<input required type="password" minLength="10" autoComplete="new-password" value={values.password} onChange={(e) => setValues({ ...values, password: e.target.value })} /><small>Use at least 10 characters.</small></label><p className="legal-note">By creating an account, you agree to use electronic signatures responsibly. Some documents require formal in-person or advanced electronic signatures.</p><button className="button primary full" disabled={busy}>{busy ? 'Creating account…' : 'Create account'} <ArrowRight size={17} /></button></form>}<p className="auth-switch">Already have an account? <Link to="/login">Sign in</Link></p></AuthShell>;
}

export function ForgotPasswordPage() {
  const [email, setEmail] = useState('');
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');
  async function submit(event) { event.preventDefault(); setError(''); try { const { data } = await api.post('/auth/forgot-password', { email }); setMessage(data.message); } catch (failure) { setError(errorMessage(failure)); } }
  return <AuthShell eyebrow="ACCOUNT RECOVERY" title="Reset your password" subtitle="Enter your account email and we’ll send a secure reset link."><form className="form-stack" onSubmit={submit}><Alert>{error}</Alert><Alert success>{message}</Alert><label>Email address<input required type="email" value={email} onChange={(e) => setEmail(e.target.value)} /></label><button className="button primary full">Send reset link <ArrowRight size={17} /></button></form><Link className="back-link" to="/login"><ArrowLeft size={16} /> Back to sign in</Link></AuthShell>;
}

export function ResetPasswordPage() {
  const [params] = useSearchParams();
  const [password, setPassword] = useState('');
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');
  async function submit(event) { event.preventDefault(); setError(''); try { const { data } = await api.post('/auth/reset-password', { token: params.get('token'), password }); setMessage(data.message); } catch (failure) { setError(errorMessage(failure)); } }
  return <AuthShell eyebrow="ACCOUNT RECOVERY" title="Choose a new password" subtitle="Use at least 10 characters to keep your account protected."><form className="form-stack" onSubmit={submit}><Alert>{error}</Alert><Alert success>{message}</Alert><label>New password<input required type="password" minLength="10" value={password} onChange={(e) => setPassword(e.target.value)} /></label><button className="button primary full">Update password <ArrowRight size={17} /></button></form><p className="auth-switch"><Link to="/login">Return to sign in</Link></p></AuthShell>;
}

export function VerifyEmailPage() {
  const [params] = useSearchParams();
  const started = useRef(false);
  const [state, setState] = useState({ loading: true, message: '', error: '' });
  useEffect(() => {
    if (started.current) return;
    started.current = true;
    api.get('/auth/verify-email', { params: { token: params.get('token') } }).then(({ data }) => setState({ loading: false, message: data.message })).catch((failure) => setState({ loading: false, error: errorMessage(failure) }));
  }, [params]);
  return <AuthShell eyebrow="EMAIL VERIFICATION" title={state.loading ? 'Verifying your email' : state.message ? 'You’re all set' : 'Verification link unavailable'} subtitle="Activating your Contracts ZAR account."><Alert>{state.error}</Alert><Alert success>{state.message}</Alert>{state.loading ? <div className="loading-inline"><span className="spinner" /> Please wait…</div> : <Link className="button primary full" to="/login">Continue to sign in <ArrowRight size={17} /></Link>}</AuthShell>;
}
