// api/contact.js
// Vercel serverless function — sends contact form submissions via Resend.
// Pattern matches BillXM and Vainture implementations.

const { Resend } = require('resend');

module.exports = async (req, res) => {
  if (req.method === 'OPTIONS') {
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
    return res.status(200).end();
  }

  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const { name, organization, email, topic, message } = req.body || {};

  if (!name || !email || !message) {
    return res.status(400).json({ error: 'Missing required fields' });
  }

  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
    return res.status(400).json({ error: 'Invalid email' });
  }

  const apiKey = process.env.RESEND_API_KEY;
  const notificationEmail = process.env.NOTIFICATION_EMAIL || 'pphan@celesium.com';

  if (!apiKey) {
    console.error('RESEND_API_KEY env var not set');
    return res.status(500).json({ error: 'Email service not configured' });
  }

  const resend = new Resend(apiKey);

  const safe = (s) => String(s || '').replace(/[<>&"']/g, (c) => ({
    '<': '&lt;', '>': '&gt;', '&': '&amp;', '"': '&quot;', "'": '&#39;'
  }[c]));

  const html = `
    <div style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif; max-width: 600px; margin: 0 auto;">
      <h2 style="color: #0A0E1A; border-bottom: 2px solid #00E5FF; padding-bottom: 8px;">
        New CelesiumAI Inquiry
      </h2>
      <table style="width: 100%; border-collapse: collapse; margin-top: 16px;">
        <tr><td style="padding: 8px 12px; background: #f5f7fa; font-weight: 600; width: 140px;">Name</td><td style="padding: 8px 12px;">${safe(name)}</td></tr>
        <tr><td style="padding: 8px 12px; background: #f5f7fa; font-weight: 600;">Organization</td><td style="padding: 8px 12px;">${safe(organization) || '<em style="color:#888;">(not provided)</em>'}</td></tr>
        <tr><td style="padding: 8px 12px; background: #f5f7fa; font-weight: 600;">Email</td><td style="padding: 8px 12px;"><a href="mailto:${safe(email)}">${safe(email)}</a></td></tr>
        <tr><td style="padding: 8px 12px; background: #f5f7fa; font-weight: 600;">Topic</td><td style="padding: 8px 12px;">${safe(topic) || 'other'}</td></tr>
        <tr><td style="padding: 8px 12px; background: #f5f7fa; font-weight: 600; vertical-align: top;">Message</td><td style="padding: 8px 12px; white-space: pre-wrap;">${safe(message)}</td></tr>
      </table>
      <p style="margin-top: 24px; color: #666; font-size: 12px;">
        Sent via the celesium.ai contact form. Reply directly to respond to ${safe(name)}.
      </p>
    </div>
  `;

  try {
    const result = await resend.emails.send({
      from: 'CelesiumAI <noreply@celesium.com>',
      to: [notificationEmail],
      replyTo: email,
      subject: `[CelesiumAI] Inquiry from ${name}${organization ? ` (${organization})` : ''}`,
      html: html
    });

    if (result.error) {
      console.error('Resend error:', result.error);
      return res.status(500).json({ error: 'Failed to send' });
    }

    console.log('Contact email sent:', result.data?.id);
    return res.status(200).json({ success: true });
  } catch (err) {
    console.error('Contact form error:', err);
    return res.status(500).json({ error: 'Failed to send' });
  }
};
