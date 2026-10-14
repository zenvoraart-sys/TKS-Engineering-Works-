import { StrictMode, useEffect, useState } from 'react';
import { createRoot } from 'react-dom/client';
import { ArrowDown, ArrowRight, ArrowUpRight, Check, Menu, X, Phone, MapPin, MessageCircle, Clock3, Moon, Sun } from 'lucide-react';
import { business, projects, services } from './data/site';
import QuoteForm from './components/QuoteForm';
import './styles.css';

const paths = { home: '/', about: '/about', services: '/services', projects: '/projects', quote: '/request-a-quote', contact: '/contact', privacy: '/privacy-policy' };
const nav = [{ label: 'About', href: paths.about }, { label: 'Services', href: paths.services }, { label: 'Projects', href: paths.projects }, { label: 'Contact', href: paths.contact }];
const heroImage = '/projects/hero-structural-roofing.jpeg';
const pageDescriptions: Record<string,string> = {
  '/':'Steel fabrication, structural roofing, gates and custom metalwork in Chennai. See the work of TKS Engineering Works.',
  '/about':'Meet TKS Engineering Works, a Chennai-based steel fabrication business established in 2005.',
  '/services':'Explore structural roofing, truss work, steel fabrication, gates, railings, shutters and metal grills by TKS Engineering Works.',
  '/projects':'Browse genuine project photographs of structural, fabrication and architectural metalwork by TKS Engineering Works.',
  '/request-a-quote':'Share your steel fabrication or metalwork requirement with TKS Engineering Works in Chennai.',
  '/contact':'Contact TKS Engineering Works in Padi, Chennai by phone, email or WhatsApp.',
  '/privacy-policy':'Read how TKS Engineering Works handles information submitted through this website.'
};

function Brand({ inverse = false }: { inverse?: boolean }) {
  return <a className={`brand ${inverse ? 'brand-inverse' : ''}`} href="/" aria-label="TKS Engineering Works home"><img src="/brand/tks-logo.jpeg" alt=""/><span><strong>TKS<span className="brand-dot">.</span></strong><small>ENGINEERING WORKS</small></span></a>;
}

function ThemeToggle() {
  const [dark, setDark] = useState(() => document.documentElement.dataset.theme === 'dark');

  useEffect(() => {
    const syncTheme = (event: Event) => setDark((event as CustomEvent<'dark' | 'light'>).detail === 'dark');
    window.addEventListener('tks-theme-change', syncTheme);
    let preference: MediaQueryList | undefined;
    const applyPreference = (event: MediaQueryListEvent) => {
      try { if (window.localStorage.getItem('tks-theme')) return; } catch { /* Keep following the system preference. */ }
      const theme = event.matches ? 'dark' : 'light';
      document.documentElement.dataset.theme = theme;
      document.querySelector('meta[name="theme-color"]')?.setAttribute('content', event.matches ? '#0e151e' : '#f4f6f8');
      window.dispatchEvent(new CustomEvent('tks-theme-change', { detail: theme }));
    };
    try { if (!window.localStorage.getItem('tks-theme')) preference = window.matchMedia('(prefers-color-scheme: dark)'); } catch { preference = window.matchMedia('(prefers-color-scheme: dark)'); }
    preference?.addEventListener('change', applyPreference);
    return () => { preference?.removeEventListener('change', applyPreference); window.removeEventListener('tks-theme-change', syncTheme); };
  }, []);

  function toggle() {
    const next = !dark;
    document.documentElement.dataset.theme = next ? 'dark' : 'light';
    document.querySelector('meta[name="theme-color"]')?.setAttribute('content', next ? '#0e151e' : '#f4f6f8');
    setDark(next);
    try { window.localStorage.setItem('tks-theme', next ? 'dark' : 'light'); } catch { /* Theme still applies for this visit. */ }
    window.dispatchEvent(new CustomEvent('tks-theme-change', { detail: next ? 'dark' : 'light' }));
  }

  return <button className="theme-toggle" type="button" onClick={toggle} aria-label={`Switch to ${dark ? 'light' : 'dark'} mode`} aria-pressed={dark} title={`Switch to ${dark ? 'light' : 'dark'} mode`}>{dark ? <Sun size={17}/> : <Moon size={17}/>}<span>{dark ? 'Light' : 'Dark'} mode</span></button>;
}

function MotionEffects({ path }: { path: string }) {
  useEffect(() => {
    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches || !('IntersectionObserver' in window)) return;
    const targets = document.querySelectorAll<HTMLElement>('main > section:not(.hero), .service-tile, .work-card, .gallery-card, .why-grid article, .process-grid article');
    if (!targets.length) return;
    document.documentElement.classList.add('motion-ready');
    const observer = new IntersectionObserver((entries) => {
      for (const entry of entries) {
        if (!entry.isIntersecting) continue;
        entry.target.classList.add('is-visible');
        observer.unobserve(entry.target);
      }
    }, { threshold: 0.08, rootMargin: '0px 0px -32px 0px' });
    targets.forEach((target) => { target.dataset.reveal = ''; observer.observe(target); });
    return () => {
      observer.disconnect();
      document.documentElement.classList.remove('motion-ready');
    };
  }, [path]);
  return null;
}

function Header() {
  const [open, setOpen] = useState(false);
  return <header className="header" onKeyDown={e=>{if(e.key==='Escape')setOpen(false)}}><div className="header-inner"><Brand/><nav className="desktop-nav" aria-label="Main navigation"><a href="/">Home</a>{nav.map(n => <a key={n.href} href={n.href}>{n.label}</a>)}</nav><div className="header-cta"><a className="phone-top" href={business.phoneHref}><Phone size={15}/><span>{business.phone}</span></a><ThemeToggle/><a className="button button-red button-header" href={paths.quote}>Start a project <ArrowUpRight size={16}/></a></div><button className="menu-toggle" aria-label={open ? 'Close navigation' : 'Open navigation'} aria-expanded={open} aria-controls="mobile-navigation" onClick={() => setOpen(!open)}>{open ? <X/> : <Menu/>}</button></div>{open && <nav id="mobile-navigation" className="mobile-nav" aria-label="Mobile navigation"><a href="/" onClick={()=>setOpen(false)}>Home</a>{nav.map(n=><a key={n.href} href={n.href} onClick={()=>setOpen(false)}>{n.label}</a>)}<a className="mobile-quote" href={paths.quote} onClick={()=>setOpen(false)}>Request a quote <ArrowUpRight size={16}/></a><ThemeToggle/></nav>}</header>;
}

function Footer() {
  return <footer className="footer"><div className="footer-top wrap"><div className="footer-brand"><Brand inverse/><p>Thoughtful metalwork. Practical engineering.<br/>Built for the way you use a space.</p></div><div><span className="footer-label">Explore</span><a href={paths.about}>About TKS</a><a href={paths.services}>Capabilities</a><a href={paths.projects}>Selected work</a><a href={paths.privacy}>Privacy policy</a></div><div><span className="footer-label">Talk to us</span><a href={business.phoneHref}>{business.phone}</a><a href={`mailto:${business.email}`}>{business.email}</a><a href={business.mapsHref} target="_blank" rel="noreferrer">Padi, Chennai <ArrowUpRight size={13}/></a><span className="footer-hours">Mon–Fri 9–6 · Sat 9–4</span></div><a className="footer-round" href={paths.quote} aria-label="Request a quote"><ArrowUpRight/></a></div><div className="footer-bottom wrap"><span>© {new Date().getFullYear()} TKS Engineering Works</span><span>Chennai, Tamil Nadu, India</span><a href={business.whatsappHref} target="_blank" rel="noreferrer"><MessageCircle size={14}/> WhatsApp</a></div></footer>;
}

function Eyebrow({ children, light = false }: {children: React.ReactNode; light?: boolean}) { return <p className={`eyebrow ${light ? 'eyebrow-light' : ''}`}><span/> {children}</p>; }
function PageIntro({ label, title, text }: {label:string; title:React.ReactNode; text:string}) { return <section className="page-intro wrap"><Eyebrow>{label}</Eyebrow><h1>{title}</h1><p>{text}</p></section>; }

function Home() {
  return <>
    <section className="hero"><img className="hero-img" src={heroImage} alt="Steel canopy frame fabricated and installed by TKS Engineering Works"/><div className="hero-shade"/><div className="hero-content wrap"><div className="hero-kicker"><span className="red-rule"/> ENGINEERING · FABRICATION · STRUCTURAL WORK</div><h1>Made of steel.<br/><em>Made to matter.</em></h1><p>From structural frames to the details you touch every day, we shape practical metalwork for homes, workplaces and industrial sites.</p><div className="hero-actions"><a className="button button-red" href={paths.quote}>Tell us about your project <ArrowUpRight size={17}/></a><a className="text-link light-link" href={paths.projects}>Explore our work <ArrowDown size={15}/></a></div></div><div className="hero-index"><span>01 / 04</span><span className="index-line"/><span>Built in Chennai</span></div><div className="hero-caption">STRUCTURAL ROOFING · TKS PROJECT PHOTOGRAPHY</div></section>
    <section className="intro-strip"><div className="wrap intro-inner"><span className="intro-mark">TKS<span>.</span></span><p>Steel work that brings <b>strength, function</b><br className="desktop-only"/> and a considered finish together.</p><a className="text-link" href={paths.about}>Meet the team <ArrowUpRight size={16}/></a></div></section>
    <section className="section wrap service-home"><div className="section-head"><div><Eyebrow>What we do</Eyebrow><h2>Capability for the<br/>whole <em>metalwork brief.</em></h2></div><p>One workshop of capabilities, spanning essential building elements to custom site-specific fabrication.</p></div><div className="service-showcase">{services.slice(0,4).map((s,i)=><a className={`service-tile service-tile-${i+1}`} href={paths.services} key={s.title}><img src={s.image} alt="" loading="lazy"/><span className="tile-number">0{i+1}</span><div className="tile-text"><h3>{s.title.replace(' Service','')}</h3><span>Explore capability <ArrowUpRight size={16}/></span></div></a>)}</div><a className="text-link section-link" href={paths.services}>See all capabilities <ArrowRight size={16}/></a></section>
    <section className="dark-statement"><div className="wrap statement-grid"><div><Eyebrow light>Our approach</Eyebrow><h2>Good work starts<br/>with <em>good questions.</em></h2></div><div className="statement-copy"><p>Every site and requirement is different. We listen first, understand how the finished work needs to perform, and shape a fabrication plan around the brief.</p><a className="text-link light-link" href={paths.about}>A little about TKS <ArrowUpRight size={16}/></a></div><span className="statement-cross">TKS / 2005</span></div></section>
    <section className="section wrap work-preview"><div className="section-head"><div><Eyebrow>From the workshop and site</Eyebrow><h2>Work with a clear<br/><em>point of view.</em></h2></div><p>Real project photography. Each image shows a type of work undertaken; descriptions stay close to what the photos show.</p></div><div className="work-grid">{projects.filter(p=>p.featured).slice(0,3).map((p,i)=><a className={`work-card work-${i+1}`} href={paths.projects} key={p.id}><div className="work-img"><img src={p.image} alt={p.title} loading="lazy"/><span><ArrowUpRight size={18}/></span></div><span className="work-category">{p.category}</span><h3>{p.title}</h3></a>)}</div><a className="text-link section-link" href={paths.projects}>View project gallery <ArrowRight size={16}/></a></section>
    <section className="why-section"><div className="wrap"><div className="section-head"><div><Eyebrow>Why work with TKS</Eyebrow><h2>Practical thinking.<br/><em>Considered making.</em></h2></div><p>Fabrication begins with understanding what the work needs to do. These are the principles behind the way we approach each enquiry.</p></div><div className="why-grid"><article><span>01</span><h3>Made for your brief</h3><p>Discuss a custom requirement and shape the work around your intended use and preferences.</p></article><article><span>02</span><h3>From home to industry</h3><p>Services span building and domestic metalwork through to industrial fabrication needs.</p></article><article><span>03</span><h3>Talk through the details</h3><p>Share dimensions, site information or a reference image so the requirement can be understood clearly.</p></article></div></div></section>
    <section className="process-section wrap"><div className="section-head"><div><Eyebrow>How an enquiry moves</Eyebrow><h2>A clear start to<br/><em>the conversation.</em></h2></div><p>Every job is different. A useful first discussion helps both sides understand the scope before a quotation is prepared.</p></div><div className="process-grid"><article><span>01 / SHARE</span><h3>Describe the work</h3><p>Tell us what you need, where it is, and what the finished work should do.</p></article><article><span>02 / REVIEW</span><h3>Clarify the scope</h3><p>We review the details you provide and can follow up for information needed to assess the job.</p></article><article><span>03 / QUOTE</span><h3>Discuss next steps</h3><p>TKS reviews the requirement and prepares a project quotation for you to consider.</p></article></div></section>
    <section className="faq-section"><div className="wrap faq-grid"><div><Eyebrow>Common questions</Eyebrow><h2>A few useful<br/><em>things to know.</em></h2><a className="text-link" href={paths.contact}>Ask us directly <ArrowUpRight size={16}/></a></div><div className="faq-list"><details><summary>What kinds of work can I enquire about?</summary><p>Steel and stainless steel fabrication, structural roofing and truss work, gates, railings, rolling shutters, metal grills, gazebos and metal angle work are listed capabilities. Use the quote form to describe a custom requirement.</p></details><details><summary>What should I include in a quote request?</summary><p>A project location, description, approximate dimensions or quantity, and photos or drawings where available help explain the brief. You can still begin with the information you have.</p></details><details><summary>Does the form calculate a project price?</summary><p>No. This is a request for quotation. TKS Engineering Works reviews the project details and prepares the actual quote; no automatic rates or totals are shown here.</p></details><details><summary>Can I enquire about a domestic project?</summary><p>Yes. The form accepts domestic, commercial and industrial project enquiries.</p></details><details><summary>Where is TKS Engineering Works based?</summary><p>The listed address is in Padi, Chennai. Contact TKS to discuss the location and scope of your particular project.</p></details></div></div></section>
    <section className="quote-band"><div className="wrap quote-band-inner"><div><Eyebrow light>Have a requirement?</Eyebrow><h2>Let’s make a plan<br/>for <em>your project.</em></h2></div><a className="button button-red" href={paths.quote}>Request a quote <ArrowUpRight size={17}/></a></div></section>
  </>;
}

function About() {
  return <><PageIntro label="About TKS" title={<>A hands-on approach<br/>to <em>making in metal.</em></>} text="TKS Engineering Works is a Chennai-based fabrication business, established in 2005. We work across stainless steel and mild steel, taking on requirements for homes, buildings and industrial sites."/><section className="about-feature wrap"><div className="about-photo"><img src="/projects/equipment-support-clean.jpeg" alt="Fabricated steel support structure at a working site"/><span className="photo-note">STEEL SUPPORT FRAME · SITE PHOTOGRAPHY</span></div><div className="about-copy"><Eyebrow>How we work</Eyebrow><h2>Understand the need.<br/><em>Make it work.</em></h2><p>We begin with the practical details: where the work goes, how it will be used, and what the customer needs it to do. That gives us a foundation for discussing materials, proportions and finish.</p><p>Our work includes structural roofing and truss work, gates, railings, rolling shutters, grills and custom steel fabrication. The right approach depends on the site and the brief.</p><a className="text-link" href={paths.services}>Explore our capabilities <ArrowRight size={16}/></a></div></section><section className="principles"><div className="wrap"><Eyebrow>What guides the work</Eyebrow><div className="principle-grid"><article><span>01</span><h3>Listen to the brief</h3><p>Start by understanding what the space and the customer require.</p></article><article><span>02</span><h3>Plan for the site</h3><p>Consider access, fit and the conditions where fabrication will be used.</p></article><article><span>03</span><h3>Care about the finish</h3><p>Give attention to the details that shape how the completed work feels.</p></article></div></div></section><section className="section wrap about-end"><div><Eyebrow>Discuss a requirement</Eyebrow><h2>Tell us what you<br/><em>have in mind.</em></h2></div><a className="button button-red" href={paths.quote}>Start an enquiry <ArrowUpRight size={17}/></a></section></>;
}

function Services() {
  return <><PageIntro label="Capabilities" title={<>Metalwork for<br/><em>real requirements.</em></>} text="From structural steel work to gates and railings, TKS Engineering Works takes on fabrication requirements for industrial, commercial and domestic settings."/><section className="services-list wrap">{services.map((s,i)=><article className="service-row" key={s.title}><div className="service-row-img"><img src={s.image} alt={`${s.title} example`} loading="lazy"/><span>0{i+1}</span></div><div className="service-row-copy"><Eyebrow>Capability · {String(i+1).padStart(2,'0')}</Eyebrow><h2>{s.title.replace(' Service','')}</h2><p>{s.summary.replace(/\.$/,'')}. We’ll discuss the dimensions, setting and finish with you before preparing a quote.</p><a className="text-link" href={`${paths.quote}?service=${encodeURIComponent(s.title)}`}>Enquire about this service <ArrowUpRight size={16}/></a></div></article>)}</section><section className="service-note"><div className="wrap note-grid"><div><Eyebrow light>Made to fit the brief</Eyebrow><h2>Have something<br/><em>specific in mind?</em></h2></div><div><p>Custom requirements are welcome. Share a sketch, a photo, dimensions or simply an outline of the problem you’re solving.</p><a className="button button-red" href={paths.quote}>Describe your project <ArrowUpRight size={17}/></a></div></div></section></>;
}

function Projects() {
  const [filter,setFilter]=useState('All work');
  const categories=['All work',...Array.from(new Set(projects.map(p=>p.category)))];
  const filtered=filter==='All work'?projects:projects.filter(p=>p.category===filter);
  return <><PageIntro label="Selected work" title={<>Built for the<br/><em>actual setting.</em></>} text="A selection of TKS Engineering Works project photographs. Captions describe visible work without assigning client names, locations or specifications."/><section className="gallery wrap"><div className="filter-bar" role="group" aria-label="Filter project photos">{categories.map(c=><button key={c} className={filter===c?'active':''} onClick={()=>setFilter(c)}>{c}</button>)}</div><div className="gallery-grid">{filtered.map((p,i)=><article className={`gallery-card gallery-card-${i%3+1}`} key={p.id}><img src={p.image} alt={p.title} loading="lazy"/><div className="gallery-caption"><span>{p.category}</span><h3>{p.title}</h3><a href={`${paths.quote}?service=${encodeURIComponent(p.category)}`} aria-label={`Enquire about work like ${p.title}`}><ArrowUpRight size={17}/></a></div></article>)}</div><p className="gallery-note">Images supplied by TKS Engineering Works. Project details are limited to the visible work shown.</p></section><section className="quote-band"><div className="wrap quote-band-inner"><div><Eyebrow light>Inspired by the work?</Eyebrow><h2>Let’s talk about<br/><em>your brief.</em></h2></div><a className="button button-red" href={paths.quote}>Request a quote <ArrowUpRight size={17}/></a></div></section></>;
}

function Quote() { return <><PageIntro label="Request a quote" title={<>Start with the<br/><em>shape of the idea.</em></>} text="Share what you know so far. Dimensions and drawings help, but a clear description is a good place to begin."/><section className="quote-layout wrap"><div className="quote-aside"><div className="aside-sticky"><Eyebrow>Direct contact</Eyebrow><h2>Prefer to<br/><em>talk it through?</em></h2><p>Call or message us if you’d rather discuss the requirement directly.</p><a className="direct-link" href={business.phoneHref}><Phone size={17}/>{business.phone}</a><a className="direct-link" href={business.whatsappHref} target="_blank" rel="noreferrer"><MessageCircle size={17}/>WhatsApp TKS</a><div className="aside-address"><MapPin size={16}/><span>{business.address}</span></div><span className="aside-hours"><Clock3 size={15}/> Mon–Fri 9 AM–6 PM<br/>Sat 9 AM–4 PM</span></div></div><QuoteForm/></section></>; }

function ContactForm() {
  const [values,setValues]=useState({name:'',email:'',phone:'',message:''});
  const [status,setStatus]=useState(''); const [busy,setBusy]=useState(false);
  async function submit(e:React.FormEvent<HTMLFormElement>){e.preventDefault();setBusy(true);setStatus('');try{const response=await fetch('/api/quote',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({...values,service:'General enquiry',type:'Other',location:'Chennai',description:values.message,consent:true,website:''})});if(!response.ok){const body=await response.json().catch(()=>({}));throw new Error(body.message||'We could not send your message. Please contact us directly.');}setStatus('sent');}catch(error){setStatus(error instanceof Error?error.message:'Please contact us directly by phone, email or WhatsApp.');}finally{setBusy(false);}}
  return <section className="contact-message"><div className="wrap contact-message-grid"><div><Eyebrow>Send a message</Eyebrow><h2>Have a quick<br/><em>question?</em></h2><p>Leave your contact details and a short note. For a detailed fabrication quote, use our project form.</p><a className="text-link" href={paths.quote}>Open project enquiry <ArrowUpRight size={16}/></a></div><form className="message-form" onSubmit={submit}><label>Your name<input required autoComplete="name" value={values.name} onChange={e=>setValues({...values,name:e.target.value})}/></label><div className="message-form-split"><label>Email<input required type="email" autoComplete="email" value={values.email} onChange={e=>setValues({...values,email:e.target.value})}/></label><label>Phone<input required type="tel" autoComplete="tel" value={values.phone} onChange={e=>setValues({...values,phone:e.target.value})}/></label></div><label>Message<textarea required minLength={8} value={values.message} onChange={e=>setValues({...values,message:e.target.value})}/></label><label className="message-consent"><input required type="checkbox"/><span>I agree to the <a href={paths.privacy}>privacy policy</a>.</span></label><button className="button button-red" disabled={busy}>{busy?'Sending…':'Send message'} <ArrowUpRight size={16}/></button>{status==='sent'&&<p className="form-status success" role="status"><Check size={16}/> Your message has been sent.</p>}{status&&status!=='sent'&&<p className="form-status error" role="alert">{status} <a href={`mailto:${business.email}`}>Email us</a> or <a href={business.whatsappHref}>message on WhatsApp</a>.</p>}</form></div></section>;
}

function Contact() { return <><PageIntro label="Contact" title={<>Let’s talk about<br/><em>what you need.</em></>} text="Get in touch with TKS Engineering Works in Padi, Chennai. Tell us about your fabrication requirement and we’ll take it from there."/><section className="contact-page wrap"><div className="contact-details"><Eyebrow>Reach the workshop</Eyebrow><a href={business.phoneHref}><span>PHONE</span>{business.phone}<ArrowUpRight size={16}/></a><a href={`mailto:${business.email}`}><span>EMAIL</span>{business.email}<ArrowUpRight size={16}/></a><a href={business.mapsHref} target="_blank" rel="noreferrer"><span>ADDRESS</span>{business.address}<ArrowUpRight size={16}/></a><div className="contact-hours"><span>WORKING HOURS</span><p>Monday–Friday · 9 AM–6 PM<br/>Saturday · 9 AM–4 PM<br/>Sunday · Closed</p></div><div className="contact-direct"><a className="button button-red" href={paths.quote}>Request a quote <ArrowUpRight size={16}/></a><a className="text-link" href={business.whatsappHref} target="_blank" rel="noreferrer">Message on WhatsApp <ArrowUpRight size={16}/></a></div></div><div className="map-panel"><div className="map-grid"/><div className="map-pin"><MapPin size={22}/><span>TKS ENGINEERING WORKS</span><small>Padi, Chennai</small></div><a className="map-open" href={business.mapsHref} target="_blank" rel="noreferrer">Open in Google Maps <ArrowUpRight size={16}/></a></div></section><ContactForm/></>; }

function Privacy() { return <><PageIntro label="Privacy policy" title={<>Your details,<br/><em>handled with care.</em></>} text="This policy explains how TKS Engineering Works uses information submitted through this website."/><article className="privacy wrap"><p className="policy-updated">Last updated: October 2026</p><h2>Information you provide</h2><p>When you submit an enquiry, we collect the contact and project information you enter, including any file you choose to attach. The form asks for your consent before sending.</p><h2>How we use it</h2><p>We use enquiry information to understand your requirements, respond to your request, and follow up about the project. We do not sell enquiry data.</p><h2>How information is sent</h2><p>Quote submissions are sent to TKS Engineering Works through the configured email service. If the submission service is unavailable, you can contact us directly by phone, email or WhatsApp. Attachments are limited to supported image files and PDF documents.</p><h2>Retention and your choices</h2><p>Enquiry information is retained only as needed to respond and maintain business records. To ask about or request deletion of information you submitted, contact <a href={`mailto:${business.email}`}>{business.email}</a>.</p><h2>Contact</h2><p>TKS Engineering Works<br/>{business.address}<br/><a href={business.phoneHref}>{business.phone}</a></p></article></>; }

function NotFound() { return <section className="not-found wrap"><span>404 / PAGE NOT FOUND</span><h1>This page<br/><em>is off the drawing.</em></h1><p>It may have moved, or the address may be incorrect.</p><a className="button button-red" href="/">Back to home <ArrowUpRight size={16}/></a></section>; }

function App() {
  const path=window.location.pathname.replace(/\/$/,'')||'/';
  const page=path===paths.home?<Home/>:path===paths.about?<About/>:path===paths.services?<Services/>:path===paths.projects?<Projects/>:path===paths.quote?<Quote/>:path===paths.contact?<Contact/>:path===paths.privacy?<Privacy/>:<NotFound/>;
  const title=!Object.values(paths).includes(path)?'Page Not Found':path===paths.about?'About':path===paths.services?'Services':path===paths.projects?'Projects':path===paths.quote?'Request a Quote':path===paths.contact?'Contact':path===paths.privacy?'Privacy Policy':'Steel Fabrication & Metalwork';
  document.title=`${title} | TKS Engineering Works`;
  let description=document.querySelector('meta[name="description"]');
  if(!description){description=document.createElement('meta');description.setAttribute('name','description');document.head.appendChild(description);}
  const pageDescription=pageDescriptions[path]||'TKS Engineering Works provides steel fabrication and metalwork services in Chennai.';
  description.setAttribute('content',pageDescription);
  document.querySelector('meta[property="og:title"]')?.setAttribute('content',`${title} | TKS Engineering Works`);
  document.querySelector('meta[property="og:description"]')?.setAttribute('content',pageDescription);
  const configuredSiteUrl = document.querySelector('meta[name="site-url"]')?.getAttribute('content') || 'https://tksengworks.com';
  const canonicalLink = document.querySelector('link[rel="canonical"]');
  if (Object.values(paths).includes(path)) canonicalLink?.setAttribute('href',`${configuredSiteUrl.replace(/\/$/, '')}${path==='/'?'':path}`);
  else {
    canonicalLink?.remove();
    document.querySelector('meta[name="robots"]')?.setAttribute('content','noindex,nofollow');
  }
  return <><MotionEffects path={path}/><Header/><main>{page}</main><Footer/><div className="floating-contact"><a className="call-action" href={business.phoneHref} aria-label={`Call TKS Engineering Works at ${business.phone}`}><Phone/><span>Call TKS</span></a><a className="whatsapp-action" href={business.whatsappHref} target="_blank" rel="noreferrer" aria-label="Message TKS on WhatsApp"><MessageCircle/><span>WhatsApp</span></a></div></>;
}

const appWindow = window as Window & { __tksReactRoot?: ReturnType<typeof createRoot> };
const root = appWindow.__tksReactRoot ?? createRoot(document.getElementById('root')!);
appWindow.__tksReactRoot = root;
root.render(<StrictMode><App/></StrictMode>);
