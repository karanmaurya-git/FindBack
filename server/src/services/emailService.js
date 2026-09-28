const nodemailer = require('nodemailer');

// Addresses on these domains are demo/test accounts (the seed accounts use
// @findback.com). Sending to them can never succeed, and every failed attempt
// sends a "Message not delivered" bounce back to the sender's real inbox.
// So we skip them entirely. Add more with BLOCKED_EMAIL_DOMAINS=a.com,b.com
const BLOCKED_DOMAINS = [
  'findback.com',
  'example.com',
  'example.org',
  'example.net',
  'test.com',
  'fake.com',
  'localhost',
  ...(process.env.BLOCKED_EMAIL_DOMAINS || '')
    .split(',')
    .map((d) => d.trim().toLowerCase())
    .filter(Boolean),
];

const isFakeAddress = (address) => {
  const domain = String(address || '').split('@')[1]?.trim().toLowerCase();
  return !domain || BLOCKED_DOMAINS.includes(domain);
};

const sendEmail = async ({ to, subject, text, html }) => {
  if (isFakeAddress(to)) {
    console.log(`[Email Skipped - test/fake address] To: ${to} | Subject: ${subject}`);
    return true;
  }

  if (!process.env.SMTP_USER || !process.env.SMTP_PASS) {
    console.log(`[Email Mock] To: ${to} | Subject: ${subject}`);
    return true;
  }

  const transporter = nodemailer.createTransport({
    host: process.env.SMTP_HOST || 'smtp.gmail.com',
    port: parseInt(process.env.SMTP_PORT) || 587,
    secure: false,
    auth: {
      user: process.env.SMTP_USER,
      pass: process.env.SMTP_PASS,
    },
  });

  const mailOptions = {
    from: `${process.env.FROM_NAME || 'FindBack Platform'} <${process.env.FROM_EMAIL || 'noreply@findback.com'}>`,
    to,
    subject,
    text,
    html,
  };

  try {
    const info = await transporter.sendMail(mailOptions);
    return info;
  } catch (error) {
    console.error('Email send failed:', error.message);
    return false;
  }
};

module.exports = { sendEmail };
