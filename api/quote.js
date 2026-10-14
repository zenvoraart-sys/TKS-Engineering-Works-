import { randomUUID } from 'node:crypto';

const allowedTypes = new Set(['image/jpeg', 'image/png', 'image/webp', 'application/pdf']);

function clean(value, max = 3000) {
  return String(value || '').replace(/[<>]/g, '').trim().slice(0, max);
}

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    res.setHeader('Allow', 'POST');
    return res.status(405).json({ message: 'Method not allowed.' });
  }

  const { RESEND_API_KEY, TKS_ENQUIRY_TO, RESEND_FROM_EMAIL } = process.env;
  if (!RESEND_API_KEY || !TKS_ENQUIRY_TO || !RESEND_FROM_EMAIL) {
    return res.status(503).json({ message: 'The online enquiry email has not been configured yet. Please use the direct WhatsApp or email options.' });
  }

  const body = req.body || {};
  if (clean(body.website, 200)) return res.status(200).json({ ok: true });
  const required = ['name', 'phone', 'email', 'location', 'description'];
  if (required.some((key) => !clean(body[key]))) return res.status(400).json({ message: 'Please complete all required fields.' });
  if (body.consent !== true) return res.status(400).json({ message: 'Please confirm the privacy consent before sending.' });
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(clean(body.email, 254))) return res.status(400).json({ message: 'Please enter a valid email address.' });
  if (!/^[+0-9() .-]{8,}$/.test(clean(body.phone, 80))) return res.status(400).json({ message: 'Please enter a valid phone number.' });

  const reference = `TKS-${new Date().toISOString().slice(0, 10).replace(/-/g, '')}-${randomUUID().slice(0, 8).toUpperCase()}`;
  const fields = [
    ['Request reference', reference], ['Name', clean(body.name, 120)], ['Company', clean(body.company, 160)],
    ['Phone', clean(body.phone, 80)], ['Email', clean(body.email, 254)], ['Customer type', clean(body.customerType, 80)],
    ['Preferred contact', clean(body.preferredContact, 80)], ['Project category', clean(body.projectCategory, 120)],
    ['Service', clean(body.service, 180)], ['Project title', clean(body.title, 180)], ['Work type', clean(body.workType || (body.service === 'General enquiry' ? 'General enquiry' : ''), 100)],
    ['Location', clean(body.location, 240)], ['Dimensions / specifications', clean(body.dimensions, 240)],
    ['Quantity / scope', clean(body.quantity, 240)], ['Preferred start date', clean(body.startDate, 40)],
    ['Expected completion timeline', clean(body.timeline, 100)], ['Budget range', clean(body.budget, 120)],
    ['Description', clean(body.description)]
  ];
  const text = fields.map(([label, value]) => `${label}: ${value || 'Not provided'}`).join('\n');
  const suppliedAttachments = Array.isArray(body.attachments) ? body.attachments : body.attachment ? [body.attachment] : [];
  const attachments = [];
  if (suppliedAttachments.length > 3) return res.status(400).json({ message: 'Attach no more than three project files.' });
  let totalBytes = 0;
  for (const attachment of suppliedAttachments) {
    if (!allowedTypes.has(attachment.type) || !/^[A-Za-z0-9+/]+=*$/.test(attachment.content || '') || attachment.content.length > 4_200_000) {
      return res.status(400).json({ message: 'The attachment must be a supported image or PDF smaller than 3 MB.' });
    }
    const bytes = Buffer.from(attachment.content, 'base64');
    const signatures = {
      'image/jpeg': bytes.length > 3 && bytes[0] === 0xff && bytes[1] === 0xd8 && bytes[2] === 0xff,
      'image/png': bytes.subarray(0, 4).toString('hex') === '89504e47',
      'image/webp': bytes.subarray(0, 4).toString('ascii') === 'RIFF' && bytes.subarray(8, 12).toString('ascii') === 'WEBP',
      'application/pdf': bytes.subarray(0, 5).toString('ascii') === '%PDF-'
    };
    totalBytes += bytes.length;
    if (totalBytes > 3 * 1024 * 1024 || !signatures[attachment.type]) {
      return res.status(400).json({ message: 'The attachment could not be verified as a supported image or PDF.' });
    }
    const filename = (clean(attachment.name, 120) || 'project-attachment').replace(/[\\/]/g, '_');
    attachments.push({ filename, content: attachment.content });
  }

  try {
    const response = await fetch('https://api.resend.com/emails', {
      method: 'POST',
      headers: { Authorization: `Bearer ${RESEND_API_KEY}`, 'Content-Type': 'application/json' },
      body: JSON.stringify({
        from: RESEND_FROM_EMAIL,
        to: [TKS_ENQUIRY_TO],
        reply_to: clean(body.email, 254),
        subject: `[${reference}] Website enquiry: ${clean(body.service || 'General enquiry', 100)} — ${clean(body.name, 100)}`,
        text,
        ...(attachments.length ? { attachments } : {})
      })
    });
    if (!response.ok) {
      console.error('Resend rejected enquiry:', response.status);
      return res.status(502).json({ message: 'The email service could not accept your enquiry. Please use WhatsApp or email below.' });
    }
    return res.status(200).json({ ok: true, reference });
  } catch (error) {
    console.error('Enquiry delivery failed:', error instanceof Error ? error.message : 'unknown error');
    return res.status(502).json({ message: 'We could not deliver your enquiry. Please use WhatsApp or email below.' });
  }
}
