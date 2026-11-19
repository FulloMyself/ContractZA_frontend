import { ArrowDown, ArrowRight, ArrowUpRight, Check, FileCheck2, FileText, LockKeyhole, MessageSquareWarning, PenLine, ShieldCheck, UsersRound } from 'lucide-react';
import { Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { contractTemplateGroups, contractTemplates } from '../data/contractTemplates';

const image = (name) => `${import.meta.env.BASE_URL}images/${name}`;

function scrollToSection(event, id) {
  event.preventDefault();
  document.getElementById(id)?.scrollIntoView({ behavior: 'smooth' });
}

export default function LandingPage() {
  const { user, loading } = useAuth();
  const workspace = user?.role === 'admin' ? '/admin' : '/dashboard';
  const templateCount = Object.keys(contractTemplates).length - 1;

  return <main className="marketing-site">
    <header className="marketing-nav">
      <Link to="/" className="brand marketing-brand"><span className="brand-mark">C</span><span>Contracts <b>ZAR</b></span></Link>
      <nav aria-label="Main navigation">
        <a href="#how-it-works" onClick={(event) => scrollToSection(event, 'how-it-works')}>How it works</a>
        <a href="#templates" onClick={(event) => scrollToSection(event, 'templates')}>Templates</a>
        <a href="#support" onClick={(event) => scrollToSection(event, 'support')}>Dispute support</a>
        <a href="#about" onClick={(event) => scrollToSection(event, 'about')}>About</a>
      </nav>
      <div className="marketing-nav-actions">
        {!loading && user
          ? <Link className="marketing-login" to={workspace}>My workspace <ArrowUpRight size={15} /></Link>
          : <><Link className="marketing-login" to="/login">Sign in</Link><Link className="button primary" to="/register">Get started <ArrowRight size={15} /></Link></>}
      </div>
    </header>

    <section className="marketing-hero">
      <div className="marketing-hero-copy">
        <div className="marketing-kicker"><span /> CONTRACTS, WITH CLARITY</div>
        <h1>Good work starts with a <em>clear agreement.</em></h1>
        <p>Draft, share and sign contracts in one considered workspace. Keep expectations clear, signatures together and the next step moving.</p>
        <div className="marketing-hero-actions">
          <Link className="button primary" to={user ? workspace : '/register'}>{user ? 'Open your workspace' : 'Create your account'} <ArrowRight size={16} /></Link>
          <a className="marketing-quiet-link" href="#how-it-works" onClick={(event) => scrollToSection(event, 'how-it-works')}>See how it works <ArrowDown size={15} /></a>
        </div>
        <ul className="marketing-highlights">
          <li><Check size={15} /> Built for South African workflows</li>
          <li><Check size={15} /> Invite signers by email</li>
          <li><Check size={15} /> Keep a record of every signature</li>
        </ul>
      </div>
      <div className="marketing-hero-visual">
        <img src={image('contracts-hero.jpg')} alt="A professional signing a printed agreement" loading="eager" />
        <div className="hero-image-shade" />
        <div className="hero-note">
          <span className="hero-note-icon"><FileCheck2 size={19} /></span>
          <span><strong>From draft to signed</strong><small>One clearer process for everyone</small></span>
        </div>
        <div className="hero-caption">A better way to move business forward.</div>
      </div>
    </section>

    <div className="marketing-audience">
      <span>For the people and teams who make agreements work</span>
      <strong>Independent professionals</strong><i />
      <strong>Legal practices</strong><i />
      <strong>Growing businesses</strong><i />
      <strong>Institutions and teams</strong>
    </div>

    <section id="how-it-works" className="marketing-section">
      <div className="marketing-section-heading">
        <div><div className="marketing-kicker">A MORE CONFIDENT WORKFLOW</div><h2>Less chasing. More clarity.</h2></div>
        <p>From the first draft to the final signature, the important details stay together and easy to follow.</p>
      </div>
      <div className="marketing-feature-grid">
        <article className="marketing-feature">
          <span className="marketing-feature-icon"><FileText size={21} /></span>
          <h3>Start with structure</h3>
          <p>Use a practical template or bring your own terms. Make the agreement reflect the work, the people and the expectations involved.</p>
        </article>
        <article className="marketing-feature">
          <span className="marketing-feature-icon"><UsersRound size={21} /></span>
          <h3>Bring everyone in</h3>
          <p>Invite the other party by email. They can review the document and create an account to sign using the email address invited.</p>
        </article>
        <article className="marketing-feature">
          <span className="marketing-feature-icon"><PenLine size={21} /></span>
          <h3>Sign with a record</h3>
          <p>Capture signatures and signing details, see agreement progress, and keep completed contracts available to the parties.</p>
        </article>
      </div>
    </section>

    <section className="marketing-photo-band">
      <div className="marketing-photo"><img src={image('legal-teams.jpg')} alt="Colleagues collaborating around a table in a professional meeting" loading="lazy" /></div>
      <div className="marketing-photo-copy">
        <div className="marketing-kicker">MADE FOR REAL-WORLD AGREEMENTS</div>
        <h2>Professional enough for the details. Simple enough to keep moving.</h2>
        <p>Whether you manage client engagements, supplier terms, property arrangements or internal business agreements, Contracts ZAR gives the people involved a shared place to review and sign.</p>
        <div className="marketing-proof-list">
          <span><ShieldCheck size={17} /> Clear status from draft to completion</span>
          <span><LockKeyhole size={17} /> Signed-in access for invited signers</span>
          <span><FileCheck2 size={17} /> A completion record you can download</span>
        </div>
      </div>
    </section>

    <section id="support" className="marketing-section marketing-support">
      <div className="marketing-section-heading">
        <div><div className="marketing-kicker">SUPPORT WHEN A CONCERN COMES UP</div><h2>A place to raise concerns. A platform that stays neutral.</h2></div>
        <p>Keep the agreement and its signatories connected through a clear digital workflow, from sharing and signing to securely retaining the completed contract.</p>
      </div>
      <div className="marketing-feature-grid">
        <article className="marketing-feature">
          <span className="marketing-feature-icon"><MessageSquareWarning size={21} /></span>
          <h3>Raise a contract concern</h3>
          <p>Contract parties can submit a complaint about an agreement, choose an issue category and explain the concern in a dedicated case.</p>
        </article>
        <article className="marketing-feature">
          <span className="marketing-feature-icon"><UsersRound size={21} /></span>
          <h3>Keep communication together</h3>
          <p>The parties and platform administrators can view case submissions and written responses, and follow the case status in the workspace.</p>
        </article>
        <article className="marketing-feature">
          <span className="marketing-feature-icon"><ShieldCheck size={21} /></span>
          <h3>Privacy and neutrality matter</h3>
          <p>Administrators cannot open or read client contract documents or terms. They may review information parties submit to a complaint case, but do not decide whether a breach occurred, take a legal stance or provide legal advice.</p>
        </article>
      </div>
      <p className="marketing-support-disclaimer">Contracts ZAR helps people create, digitally share, sign and retain agreements in an access-controlled workspace. Complaint support is for recording concerns and facilitating communication only; it is not legal representation, mediation or a determination of anyone’s legal rights.</p>
    </section>

    <section id="templates" className="marketing-section marketing-templates">
      <div className="marketing-section-heading">
        <div><div className="marketing-kicker">A PRACTICAL PLACE TO BEGIN</div><h2>Start with the agreement you need.</h2></div>
        <p>{templateCount} editable starter templates for common business, property, employment and company arrangements.</p>
      </div>
      <div className="template-showcase">
        <div className="template-showcase-photo">
          <img src={image('business-workspace.jpg')} alt="A bright, well-organised professional workspace" loading="lazy" />
          <div className="template-photo-caption"><span>{templateCount} STARTER TEMPLATES</span><strong>Made to be adapted to your matter.</strong></div>
        </div>
        <div className="template-categories">
          {contractTemplateGroups.map((group) => <div className="template-category" key={group.label}>
            <h3>{group.label}</h3>
            <ul>{group.values.map((key) => <li key={key}><Check size={14} />{contractTemplates[key].label}</li>)}</ul>
          </div>)}
          <p className="template-disclaimer">Templates are editable starting points, not legal advice or a substitute for review by a qualified legal professional. Check that the terms fit your transaction and current law.</p>
          <Link className="button primary" to={user ? '/contracts/new' : '/register'}>Explore the platform <ArrowRight size={15} /></Link>
        </div>
      </div>
    </section>

    <section className="marketing-audience-panel">
      <div className="audience-panel-image"><img src={image('legal-practice.jpg')} alt="Colleagues working together around a table" loading="lazy" /></div>
      <div className="audience-panel-copy">
        <div className="marketing-kicker">FOR INDIVIDUALS, PRACTICES AND ORGANIZATIONS</div>
        <h2>Built to serve more than one kind of business.</h2>
        <p>Independent professionals can keep client agreements organised. Legal practices can use the platform to prepare and send routine documents for signature. Businesses and contract-based institutions can give counterparties a clear, trackable signing experience.</p>
        <p>Bring your own reviewed wording whenever a matter needs specialist terms. The platform helps manage the agreement workflow; your professional judgment remains essential.</p>
        <Link className="marketing-quiet-link" to={user ? workspace : '/register'}>{user ? 'Go to your workspace' : 'Create an account'} <ArrowRight size={15} /></Link>
      </div>
    </section>

    <section id="about" className="marketing-about">
      <div className="about-mark"><span className="brand-mark">C</span></div>
      <div>
        <div className="marketing-kicker">A PRODUCT BY ESTABLISHED MEDIA AND ENTERPRISES</div>
        <h2>Technology with a practical purpose.</h2>
        <p>Contracts ZAR is an independent product by Established Media and Enterprises. We are focused on making useful digital tools for the way people and organizations work in South Africa. This platform is dedicated to one important part of that work: making agreements clearer to prepare, share and sign.</p>
      </div>
    </section>

    <section className="marketing-cta">
      <div><div className="marketing-kicker light">MAKE THE NEXT AGREEMENT CLEARER</div><h2>Ready to put your next agreement in motion?</h2><p>Create an account and bring your next contract into one secure, straightforward workflow.</p></div>
      <Link className="button marketing-cta-button" to={user ? workspace : '/register'}>{user ? 'Open your workspace' : 'Get started'} <ArrowRight size={16} /></Link>
    </section>

    <footer className="marketing-footer">
      <Link to="/" className="brand marketing-brand"><span className="brand-mark">C</span><span>Contracts <b>ZAR</b></span></Link>
      <p>Clearer agreements. More confident business.</p>
      <div><Link to="/login">Sign in</Link><Link to="/register">Create account</Link></div>
      <small>© {new Date().getFullYear()} Established Media and Enterprises · Contracts ZAR</small>
    </footer>
  </main>;
}
