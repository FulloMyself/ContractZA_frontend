import { useEffect, useState } from 'react';
import { KeyRound, Save, ShieldCheck, UserRound } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import api, { errorMessage } from '../api/client';
import { useAuth } from '../context/AuthContext';

const provinces = ['Eastern Cape', 'Free State', 'Gauteng', 'KwaZulu-Natal', 'Limpopo', 'Mpumalanga', 'Northern Cape', 'North West', 'Western Cape'];
const emptyAddress = { street: '', unit: '', suburb: '', city: '', province: '', postalCode: '' };
function SectionTitle({ icon: Icon, title, caption }) { return <div className="section-title"><span><Icon size={18} /></span><div><h2>{title}</h2><p>{caption}</p></div></div>; }

export default function ProfilePage() {
  const { setUser, logout } = useAuth();
  const navigate = useNavigate();
  const [profile, setProfile] = useState(null);
  const [sessions, setSessions] = useState([]);
  const [error, setError] = useState('');
  const [message, setMessage] = useState('');
  const [password, setPassword] = useState({ currentPassword: '', newPassword: '' });
  const [correction, setCorrection] = useState({ firstName: '', lastName: '', idNumber: '', reason: '' });
  const [busy, setBusy] = useState(false);
  async function load() {
    try {
      const [profileResult, sessionResult] = await Promise.all([api.get('/users/me'), api.get('/users/me/sessions')]);
      setProfile({ ...profileResult.data.user, residentialAddress: { ...emptyAddress, ...profileResult.data.user.residentialAddress }, postalAddress: { ...emptyAddress, ...profileResult.data.user.postalAddress } });
      setSessions(sessionResult.data.sessions);
      setError('');
    } catch (failure) { setError(errorMessage(failure)); }
  }
  useEffect(() => { load(); }, []);
  function update(field, value) { setProfile({ ...profile, [field]: value }); }
  function updateAddress(group, field, value) { setProfile({ ...profile, [group]: { ...profile[group], [field]: value } }); }
  async function saveProfile(event) {
    event.preventDefault(); setBusy(true); setError(''); setMessage('');
    try {
      const { data } = await api.patch('/users/me', {
        email: profile.email, mobile: profile.mobile, alternatePhone: profile.alternatePhone,
        residentialAddress: profile.residentialAddress, postalAddress: profile.postalAddress,
        postalSameAsResidential: profile.postalSameAsResidential, businessName: profile.businessName,
        companyRegistrationNumber: profile.companyRegistrationNumber, vatNumber: profile.vatNumber,
        preferredLanguage: profile.preferredLanguage, timezone: profile.timezone, notifications: profile.notifications
      });
      setProfile({ ...profile, ...data.user });
      setUser((current) => ({ ...current, email: data.user.email }));
      setMessage(data.message);
    } catch (failure) { setError(errorMessage(failure)); }
    finally { setBusy(false); }
  }
  async function changePassword(event) {
    event.preventDefault(); setBusy(true); setError(''); setMessage('');
    try {
      const { data } = await api.patch('/users/me/password', password);
      setPassword({ currentPassword: '', newPassword: '' });
      await logout();
      navigate('/login', { replace: true, state: { message: data.message } });
    }
    catch (failure) { setError(errorMessage(failure)); }
    finally { setBusy(false); }
  }
  async function revokeSession(id) {
    setError(''); try { await api.delete(`/users/me/sessions/${id}`); setSessions(sessions.filter((session) => session.id !== id)); }
    catch (failure) { setError(errorMessage(failure)); }
  }
  async function requestCorrection(event) {
    event.preventDefault(); setBusy(true); setError(''); setMessage('');
    const requestedChanges = {};
    for (const field of ['firstName', 'lastName', 'idNumber']) if (correction[field]) requestedChanges[field] = correction[field];
    try { await api.post('/users/me/correction-requests', { requestedChanges, reason: correction.reason }); setMessage('Correction request submitted for administrator review.'); setCorrection({ firstName: '', lastName: '', idNumber: '', reason: '' }); }
    catch (failure) { setError(errorMessage(failure)); }
    finally { setBusy(false); }
  }
  if (!profile) return <><div className="eyebrow">ACCOUNT</div><div className="page-title"><div><h1>Profile settings</h1></div></div>{error ? <div className="alert error">{error}</div> : <div className="loading-inline"><span className="spinner" /> Loading profile…</div>}<button className="button secondary" onClick={load}>Try again</button></>;
  return <><div className="eyebrow">ACCOUNT</div><div className="page-title"><div><h1>Profile settings</h1><p className="muted">Manage contact information, preferences and account security.</p></div></div>{error && <div className="alert error">{error}</div>}{message && <div className="alert success">{message}</div>}<div className="profile-layout"><div className="profile-main"><form onSubmit={saveProfile} className="panel settings-panel"><SectionTitle icon={UserRound} title="Personal information" caption="Legal identity details are locked to protect signed agreements."/><div className="locked-info"><div><small>LEGAL NAME</small><strong>{profile.firstName} {profile.lastName}</strong></div><div><small>SA ID NUMBER</small><strong>{profile.idNumber}</strong></div><div><small>DATE OF BIRTH</small><strong>{profile.dateOfBirth ? new Date(profile.dateOfBirth).toLocaleDateString('en-ZA') : '—'}</strong></div><span className="locked-badge"><ShieldCheck size={14} /> Verified fields</span></div><div className="form-grid"><label>Email address<input required type="email" value={profile.email || ''} onChange={(e) => update('email', e.target.value)} /><small>A new address is activated after email verification.</small></label><label>Mobile number<input placeholder="+27 82 123 4567" value={profile.mobile || ''} onChange={(e) => update('mobile', e.target.value)} /></label><label>Alternative phone<input placeholder="+27 11 123 4567" value={profile.alternatePhone || ''} onChange={(e) => update('alternatePhone', e.target.value)} /></label></div><div className="settings-divider" /><h3>Residential address</h3><AddressFields value={profile.residentialAddress} update={(key, value) => updateAddress('residentialAddress', key, value)} /><label className="check-label"><input type="checkbox" checked={profile.postalSameAsResidential} onChange={(e) => update('postalSameAsResidential', e.target.checked)} /> Postal address is the same as residential address</label>{!profile.postalSameAsResidential && <><div className="settings-divider" /><h3>Postal address</h3><AddressFields value={profile.postalAddress} update={(key, value) => updateAddress('postalAddress', key, value)} /></>}<div className="settings-divider" /><h3>Business details <span className="optional">Optional</span></h3><div className="form-grid"><label>Company or trading name<input value={profile.businessName || ''} onChange={(e) => update('businessName', e.target.value)} /></label><label>Company registration number<input value={profile.companyRegistrationNumber || ''} onChange={(e) => update('companyRegistrationNumber', e.target.value)} /></label><label>VAT number<input value={profile.vatNumber || ''} onChange={(e) => update('vatNumber', e.target.value)} /></label></div><div className="settings-divider" /><h3>Preferences</h3><div className="form-grid"><label>Preferred language<select value={profile.preferredLanguage || 'en'} onChange={(e) => update('preferredLanguage', e.target.value)}><option value="en">English</option><option value="af">Afrikaans</option><option value="zu">isiZulu</option></select></label><label>Timezone<input value={profile.timezone || 'Africa/Johannesburg'} onChange={(e) => update('timezone', e.target.value)} /></label></div><div className="check-list"><label className="check-label"><input type="checkbox" checked={profile.notifications?.email ?? true} onChange={(e) => update('notifications', { ...profile.notifications, email: e.target.checked })} /> Receive account and security emails</label><label className="check-label"><input type="checkbox" checked={profile.notifications?.contractUpdates ?? true} onChange={(e) => update('notifications', { ...profile.notifications, contractUpdates: e.target.checked })} /> Receive contract update notifications</label></div><div className="editor-actions"><button className="button primary" disabled={busy}><Save size={16} /> {busy ? 'Saving…' : 'Save profile'}</button></div></form><section className="panel settings-panel"><SectionTitle icon={KeyRound} title="Change password" caption="Changing your password revokes other active sessions."/><form className="form-grid" onSubmit={changePassword}><label>Current password<input type="password" autoComplete="current-password" required value={password.currentPassword} onChange={(e) => setPassword({ ...password, currentPassword: e.target.value })} /></label><label>New password<input type="password" autoComplete="new-password" minLength="10" required value={password.newPassword} onChange={(e) => setPassword({ ...password, newPassword: e.target.value })} /><small>At least 10 characters.</small></label><div className="form-span"><button className="button secondary" disabled={busy}>Update password</button></div></form></section><section className="panel settings-panel"><SectionTitle icon={ShieldCheck} title="Active sessions" caption="Sign out devices you no longer use."/><div className="session-list">{sessions.map((session) => <div className="session-row" key={session.id}><div><strong>{session.userAgent || 'Browser session'}</strong><small>{session.ipAddress} · Signed in {new Date(session.createdAt).toLocaleString('en-ZA')}</small></div><button className="text-button danger-text" onClick={() => revokeSession(session.id)}>Revoke</button></div>)}{sessions.length === 0 && <p className="muted">No active sessions found.</p>}</div></section><section className="panel settings-panel"><SectionTitle icon={ShieldCheck} title="Request a correction" caption="Changes to legal names or your ID number require administrator review."/><form className="form-grid" onSubmit={requestCorrection}><label>Correct first name(s)<input maxLength="80" value={correction.firstName} onChange={(e) => setCorrection({ ...correction, firstName: e.target.value })} /></label><label>Correct surname<input maxLength="80" value={correction.lastName} onChange={(e) => setCorrection({ ...correction, lastName: e.target.value })} /></label><label>Correct SA ID number<input inputMode="numeric" maxLength="13" value={correction.idNumber} onChange={(e) => setCorrection({ ...correction, idNumber: e.target.value.replace(/\D/g, '') })} /></label><label className="form-span">Reason<textarea required minLength="5" maxLength="1000" rows="3" value={correction.reason} onChange={(e) => setCorrection({ ...correction, reason: e.target.value })} /></label><div className="form-span"><button className="button secondary" disabled={busy}>Submit for review</button></div></form></section></div><aside className="profile-aside"><div className="profile-tip"><ShieldCheck size={22} /><h3>Your identity matters</h3><p>Your ID number is encrypted and never returned in full. Legal fields can only be updated through a reviewed correction request.</p></div><div className="profile-tip pale"><h3>Email verification</h3><p>{profile.emailVerified ? 'Your current email address is verified.' : 'Verify your email address to access all account features.'}</p>{profile.pendingEmail && <p>Waiting for confirmation: <strong>{profile.pendingEmail}</strong></p>}</div></aside></div></>;
}

function AddressFields({ value, update }) {
  return <div className="address-grid"><label>Street address<input value={value.street} onChange={(e) => update('street', e.target.value)} /></label><label>Unit / complex<input value={value.unit} onChange={(e) => update('unit', e.target.value)} /></label><label>Suburb<input value={value.suburb} onChange={(e) => update('suburb', e.target.value)} /></label><label>City<input value={value.city} onChange={(e) => update('city', e.target.value)} /></label><label>Province<select value={value.province} onChange={(e) => update('province', e.target.value)}><option value="">Select province</option>{provinces.map((province) => <option key={province}>{province}</option>)}</select></label><label>Postal code<input inputMode="numeric" maxLength="4" value={value.postalCode} onChange={(e) => update('postalCode', e.target.value.replace(/\D/g, ''))} /></label></div>;
}
