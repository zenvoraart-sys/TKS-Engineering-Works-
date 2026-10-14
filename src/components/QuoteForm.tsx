import { useRef, useState } from 'react';
import { ArrowLeft, ArrowRight, ArrowUpRight, Check, Download, MessageCircle } from 'lucide-react';
import { business, projectCategories, services } from '../data/site';

type QuoteData = {
  name: string; company: string; phone: string; email: string; customerType: string; preferredContact: string;
  projectCategory: string; service: string; title: string; description: string; location: string; workType: string;
  dimensions: string; quantity: string; startDate: string; timeline: string; budget: string; consent: boolean; website: string;
};
type Attachment = { name: string; type: string; content: string };

const stepNames = ['Your details', 'Project brief', 'Attachments', 'Review & send'];
const categoryServices: Record<string, string[]> = {
  'Structural & roofing': ['Structural Roofing & Truss Work', 'Gazebos'],
  'Steel fabrication': ['Steel Fabrication Service', 'SS Fabrication Service', 'Metal Angle'],
  'Gates & access': ['Stainless Steel & MS Gates', 'Rolling Shutter', 'Metal Grills'],
  'Railings & grills': ['Stainless Steel Railing', 'Metal Grills'],
  'Custom metalwork': ['Steel Fabrication Service', 'SS Fabrication Service', 'Metal Angle', 'Gazebos'],
  Other: services.map((service) => service.title),
};
const projectCategoryMap: Record<string, string> = {
  'Structural Roofing': 'Structural & roofing', 'Truss Work': 'Structural & roofing', 'Structural Work': 'Structural & roofing',
  'Steel Fabrication': 'Steel fabrication', 'Custom Fabrication': 'Custom metalwork',
  'Architectural Metalwork': 'Railings & grills', 'Stainless Steel Railing': 'Railings & grills', 'Railing & Gate': 'Gates & access',
};
const serviceCategoryMap: Record<string, string> = Object.fromEntries(
  Object.entries(categoryServices).flatMap(([category, names]) => names.map((name) => [name, category])),
);

function encodeFile(file: File): Promise<Attachment> {
  return file.arrayBuffer().then((buffer) => {
    const bytes = new Uint8Array(buffer);
    let binary = '';
    for (let offset = 0; offset < bytes.length; offset += 0x8000) binary += String.fromCharCode(...bytes.subarray(offset, offset + 0x8000));
    return { name: file.name, type: file.type, content: btoa(binary) };
  });
}

function QuoteForm() {
  const params = new URLSearchParams(window.location.search);
  const requested = params.get('service') || '';
  const selectedService = services.find((item) => item.title === requested)?.title
    || ({ 'Structural Roofing': 'Structural Roofing & Truss Work', 'Truss Work': 'Structural Roofing & Truss Work', 'Steel Fabrication': 'Steel Fabrication Service', 'Structural Work': 'Structural Roofing & Truss Work', 'Custom Fabrication': 'Steel Fabrication Service', 'Architectural Metalwork': 'Stainless Steel Railing', 'Railing & Gate': 'Stainless Steel & MS Gates' } as Record<string, string>)[requested]
    || '';
  const [values, setValues] = useState<QuoteData>({
    name: '', company: '', phone: '', email: '', customerType: '', preferredContact: '',
    projectCategory: projectCategoryMap[requested] || serviceCategoryMap[selectedService] || '', service: selectedService,
    title: '', description: '', location: '', workType: '', dimensions: '', quantity: '', startDate: '', timeline: '',
    budget: '', consent: false, website: '',
  });
  const [files, setFiles] = useState<File[]>([]);
  const [step, setStep] = useState(1);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [busy, setBusy] = useState(false);
  const [status, setStatus] = useState('');
  const [reference, setReference] = useState('');
  const inFlight = useRef(false);
  const update = <K extends keyof QuoteData>(key: K, value: QuoteData[K]) => setValues((previous) => ({ ...previous, [key]: value }));

  const allowedServices = values.projectCategory ? categoryServices[values.projectCategory] || [] : services.map((item) => item.title);
  const stepFields: Record<number, (keyof QuoteData)[]> = {
    1: ['name', 'phone', 'email', 'customerType', 'preferredContact'],
    2: ['projectCategory', 'service', 'title', 'description', 'location', 'workType'],
    3: [],
    4: ['consent'],
  };
  function validate(target: number) {
    const nextErrors: Record<string, string> = {};
    for (const field of stepFields[target] || []) {
      const label = field === 'consent' ? 'Privacy consent' : field === 'customerType' ? 'Customer type' : field === 'preferredContact' ? 'Preferred contact method' : field === 'projectCategory' ? 'Project category' : field === 'workType' ? 'Work type' : field;
      if (field === 'consent' ? !values.consent : !String(values[field]).trim()) nextErrors[field] = `${label} is required.`;
    }
    if (target === 1 && values.email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(values.email)) nextErrors.email = 'Enter a valid email address.';
    if (target === 1 && values.phone && !/^[+0-9() .-]{8,}$/.test(values.phone)) nextErrors.phone = 'Enter a valid phone number.';
    if (target === 2 && values.description.trim().length < 12) nextErrors.description = 'Add a little more detail (at least 12 characters).';
    setErrors(nextErrors);
    return Object.keys(nextErrors).length === 0;
  }
  function continueStep(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (validate(step)) { setErrors({}); setStep((current) => Math.min(4, current + 1)); }
  }
  function changeCategory(category: string) {
    const choices = categoryServices[category] || [];
    setValues((previous) => ({ ...previous, projectCategory: category, service: choices.includes(previous.service) ? previous.service : '' }));
    setErrors((previous) => ({ ...previous, projectCategory: '', service: '' }));
  }
  function fieldError(key: keyof QuoteData) { return errors[key] ? <small className="field-error">{errors[key]}</small> : null; }
  function labelClass(key: keyof QuoteData) { return errors[key] ? 'field-invalid' : ''; }

  async function submit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (inFlight.current || !validate(4)) return;
    inFlight.current = true;
    setBusy(true);
    setStatus('');
    try {
      const totalBytes = files.reduce((total, file) => total + file.size, 0);
      if (files.length > 3 || totalBytes > 3 * 1024 * 1024) throw new Error('Attach up to 3 files with a combined size under 3 MB.');
      const attachments = await Promise.all(files.map(encodeFile));
      const response = await fetch('/api/quote', {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ...values, attachments }),
      });
      const result = await response.json().catch(() => ({}));
      if (!response.ok) throw new Error(result.message || 'We could not send your enquiry. Please use WhatsApp or email below.');
      setReference(result.reference || '');
      setStatus('sent');
    } catch (error) {
      setStatus(error instanceof Error ? error.message : 'Something went wrong. Please use WhatsApp or email below.');
    } finally {
      inFlight.current = false;
      setBusy(false);
    }
  }

  const whatsapp = `https://wa.me/919840682818?text=${encodeURIComponent(`Hello TKS Engineering Works, I would like to discuss a project.\nName: ${values.name}\nPhone: ${values.phone}\nService: ${values.service}\nLocation: ${values.location}\nRequirement: ${values.description}`)}`;
  function downloadSummary() {
    const content = [
      'TKS ENGINEERING WORKS — PROJECT ENQUIRY', `Reference: ${reference}`, '',
      `Name: ${values.name}`, `Company: ${values.company || 'Not provided'}`, `Phone: ${values.phone}`, `Email: ${values.email}`,
      `Customer type: ${values.customerType}`, `Preferred contact: ${values.preferredContact}`, '',
      `Project category: ${values.projectCategory}`, `Service: ${values.service}`, `Project title: ${values.title}`,
      `Work type: ${values.workType}`, `Location: ${values.location}`, `Dimensions: ${values.dimensions || 'Not provided'}`,
      `Quantity/scope: ${values.quantity || 'Not provided'}`, `Preferred start: ${values.startDate || 'Not provided'}`,
      `Completion timeline: ${values.timeline || 'Not provided'}`, `Budget range: ${values.budget || 'Not provided'}`,
      '', 'Project description:', values.description, '', `Attachments: ${files.map((file) => file.name).join(', ') || 'None'}`,
    ].join('\n');
    const url = URL.createObjectURL(new Blob([content], { type: 'text/plain;charset=utf-8' }));
    const link = document.createElement('a'); link.href = url; link.download = `${reference || 'tks-project-enquiry'}.txt`; link.click(); URL.revokeObjectURL(url);
  }

  if (status === 'sent') return <section className="quote-success" role="status"><span className="success-mark"><Check/></span><p className="eyebrow">Enquiry received</p><h2>Thank you, {values.name.split(' ')[0]}.</h2><p>Your request has been emailed to TKS Engineering Works. The team can review your details and reply using your preferred contact method.</p>{reference && <div className="request-reference"><span>REQUEST REFERENCE</span><strong>{reference}</strong></div>}<div className="success-actions"><button className="button button-red" type="button" onClick={downloadSummary}><Download size={16}/> Download summary</button><a className="text-link" href="/">Back to home <ArrowUpRight size={16}/></a></div></section>;

  return <form className="quote-form" onSubmit={step === 4 ? submit : continueStep} noValidate>
    <div className="form-heading"><p className="eyebrow">Project enquiry</p><h2>Tell us about<br/><em>your requirement.</em></h2><p>Share a few details so TKS can understand the scope and prepare a quotation. This form does not calculate or promise a project price.</p></div>
    <ol className="quote-steps" aria-label="Quotation request steps">{stepNames.map((name, index) => <li key={name}><button type="button" aria-current={step === index + 1 ? 'step' : undefined} disabled={index + 1 > step} onClick={() => setStep(index + 1)}><span>{index + 1 < step ? <Check size={14}/> : index + 1}</span>{name}</button></li>)}</ol>
    {step === 1 && <section className="step-panel" aria-labelledby="step-customer"><div className="step-title"><span>STEP 01 / 04</span><h3 id="step-customer">Your details</h3><p>How can the TKS team get back to you?</p></div><div className="form-grid">
      <label className={labelClass('name')}>Full name *<input autoComplete="name" value={values.name} onChange={(event) => update('name', event.target.value)} aria-invalid={Boolean(errors.name)} placeholder="Your name"/>{fieldError('name')}</label>
      <label>Company or organisation <span className="optional">Optional</span><input autoComplete="organization" value={values.company} onChange={(event) => update('company', event.target.value)} placeholder="Company name"/></label>
      <label className={labelClass('phone')}>Phone number *<input type="tel" autoComplete="tel" value={values.phone} onChange={(event) => update('phone', event.target.value)} aria-invalid={Boolean(errors.phone)} placeholder="Best number to reach you"/>{fieldError('phone')}</label>
      <label className={labelClass('email')}>Email address *<input type="email" autoComplete="email" value={values.email} onChange={(event) => update('email', event.target.value)} aria-invalid={Boolean(errors.email)} placeholder="you@example.com"/>{fieldError('email')}</label>
      <label className={labelClass('customerType')}>Customer type *<select value={values.customerType} onChange={(event) => update('customerType', event.target.value)} aria-invalid={Boolean(errors.customerType)}><option value="">Choose one</option><option>Domestic</option><option>Commercial</option><option>Industrial</option></select>{fieldError('customerType')}</label>
      <label className={labelClass('preferredContact')}>Preferred contact method *<select value={values.preferredContact} onChange={(event) => update('preferredContact', event.target.value)} aria-invalid={Boolean(errors.preferredContact)}><option value="">Choose one</option><option>Phone call</option><option>WhatsApp</option><option>Email</option></select>{fieldError('preferredContact')}</label>
    </div></section>}
    {step === 2 && <section className="step-panel" aria-labelledby="step-project"><div className="step-title"><span>STEP 02 / 04</span><h3 id="step-project">Project brief</h3><p>The clearer the brief, the easier it is to assess the work.</p></div><div className="form-grid">
      <label className={labelClass('projectCategory')}>Project category *<select value={values.projectCategory} onChange={(event) => changeCategory(event.target.value)} aria-invalid={Boolean(errors.projectCategory)}><option value="">Choose a category</option>{projectCategories.map((category) => <option key={category}>{category}</option>)}</select>{fieldError('projectCategory')}</label>
      <label className={labelClass('service')}>Service required *<select value={values.service} onChange={(event) => update('service', event.target.value)} aria-invalid={Boolean(errors.service)}><option value="">Choose a service</option>{allowedServices.map((title) => <option key={title}>{title}</option>)}{values.projectCategory === 'Other' && <option>Other requirement</option>}</select>{fieldError('service')}</label>
      <label className={labelClass('title')}>Project title *<input value={values.title} onChange={(event) => update('title', event.target.value)} aria-invalid={Boolean(errors.title)} placeholder="A short name for this project"/>{fieldError('title')}</label>
      <label className={labelClass('location')}>Site location *<input value={values.location} onChange={(event) => update('location', event.target.value)} aria-invalid={Boolean(errors.location)} placeholder="Area, city or site address"/>{fieldError('location')}</label>
      <label className={`full-field ${labelClass('description')}`}>Detailed project description *<textarea minLength={12} value={values.description} onChange={(event) => update('description', event.target.value)} aria-invalid={Boolean(errors.description)} placeholder="Describe the work, how it will be used, site conditions, materials or finish if known."/>{fieldError('description')}</label>
      <label className={labelClass('workType')}>Type of work *<select value={values.workType} onChange={(event) => update('workType', event.target.value)} aria-invalid={Boolean(errors.workType)}><option value="">Choose one</option><option>New installation</option><option>Fabrication</option><option>Repair</option><option>Renovation</option><option>Maintenance</option></select>{fieldError('workType')}</label>
      <label>Approx. dimensions or specifications <span className="optional">If known</span><input value={values.dimensions} onChange={(event) => update('dimensions', event.target.value)} placeholder="Length × width × height, material, etc."/></label>
      <label>Quantity or scope <span className="optional">If known</span><input value={values.quantity} onChange={(event) => update('quantity', event.target.value)} placeholder="Number of items or scope of work"/></label>
      <label>Preferred project start <span className="optional">Optional</span><input type="date" min={new Date().toISOString().slice(0, 10)} value={values.startDate} onChange={(event) => update('startDate', event.target.value)}/></label>
      <label>Expected completion timeline <span className="optional">Optional</span><select value={values.timeline} onChange={(event) => update('timeline', event.target.value)}><option value="">Choose if known</option><option>As soon as practical</option><option>Within 1 month</option><option>1–3 months</option><option>3–6 months</option><option>Flexible</option><option>Not sure yet</option></select></label>
      <label>Budget range <span className="optional">Optional</span><input value={values.budget} onChange={(event) => update('budget', event.target.value)} placeholder="Optional range; no price is calculated"/></label>
    </div></section>}
    {step === 3 && <section className="step-panel" aria-labelledby="step-files"><div className="step-title"><span>STEP 03 / 04</span><h3 id="step-files">Add drawings or photos</h3><p>Files are sent with the enquiry email. Choose up to three files with a combined size under 3 MB.</p></div><label className="upload-box"><span className="upload-symbol">+</span><strong>Select project files</strong><small>JPEG, PNG, WebP or PDF · 3 files / 3 MB total</small><input type="file" accept="image/jpeg,image/png,image/webp,application/pdf" multiple onChange={(event) => { setFiles(Array.from(event.target.files || [])); setStatus(''); }}/></label>{files.length > 0 && <ul className="selected-files">{files.map((file) => <li key={`${file.name}-${file.size}`}>{file.name}<span>{(file.size / 1024).toFixed(0)} KB</span></li>)}</ul>}{status && <p className="field-error" role="alert">{status}</p>}<p className="upload-note">Please avoid attaching confidential documents unless they are needed to explain the work.</p></section>}
    {step === 4 && <section className="step-panel" aria-labelledby="step-review"><div className="step-title"><span>STEP 04 / 04</span><h3 id="step-review">Review your request</h3><p>Check the summary, then send it to TKS for review and quotation.</p></div><div className="review-block"><div className="review-head"><h4>Customer details</h4><button type="button" onClick={() => setStep(1)}>Edit details</button></div><dl><dt>Name</dt><dd>{values.name}</dd><dt>Company</dt><dd>{values.company || 'Not provided'}</dd><dt>Phone / email</dt><dd>{values.phone} · {values.email}</dd><dt>Customer type</dt><dd>{values.customerType}</dd><dt>Preferred contact</dt><dd>{values.preferredContact}</dd></dl></div><div className="review-block"><div className="review-head"><h4>Project details</h4><button type="button" onClick={() => setStep(2)}>Edit project</button></div><dl><dt>Category / service</dt><dd>{values.projectCategory} · {values.service}</dd><dt>Project title</dt><dd>{values.title}</dd><dt>Work type</dt><dd>{values.workType}</dd><dt>Location</dt><dd>{values.location}</dd><dt>Description</dt><dd>{values.description}</dd><dt>Dimensions / scope</dt><dd>{[values.dimensions, values.quantity].filter(Boolean).join(' · ') || 'Not provided'}</dd><dt>Timing / budget</dt><dd>{[values.startDate, values.timeline, values.budget].filter(Boolean).join(' · ') || 'Not provided'}</dd><dt>Attachments</dt><dd>{files.map((file) => file.name).join(', ') || 'None'}</dd></dl></div><label className={`consent ${labelClass('consent')}`}><input type="checkbox" checked={values.consent} onChange={(event) => update('consent', event.target.checked)}/><span>I agree that TKS Engineering Works may use these details to respond to my enquiry. See the <a href="/privacy-policy">privacy policy</a>.</span></label>{fieldError('consent')}</section>}
    <label className="honeypot" aria-hidden="true">Leave this field empty<input tabIndex={-1} autoComplete="off" value={values.website} onChange={(event) => update('website', event.target.value)}/></label>
    <div className="quote-nav-actions">{step > 1 ? <button type="button" className="back-step" onClick={() => { setStep((current) => current - 1); setErrors({}); }}><ArrowLeft size={15}/> Back</button> : <span/>}{step < 4 ? <button className="button button-red" type="submit">Continue <ArrowRight size={16}/></button> : <button className="button button-red" type="submit" disabled={busy}>{busy ? 'Sending request…' : 'Send quotation request'} <ArrowUpRight size={17}/></button>}</div>
    {status && step !== 3 && <div className="form-status error" role="alert"><p>{status}</p><a href={whatsapp} target="_blank" rel="noreferrer">Continue on WhatsApp <ArrowUpRight size={15}/></a><a href={`mailto:${business.email}?subject=TKS%20Project%20Enquiry`}>Email us <ArrowUpRight size={15}/></a></div>}
    {step === 4 && <p className="form-alt">Prefer a direct message? <a href={whatsapp} target="_blank" rel="noreferrer"><MessageCircle size={14}/> Start on WhatsApp</a> or <a href={`mailto:${business.email}`}>send an email</a>.</p>}
  </form>;
}

export default QuoteForm;
