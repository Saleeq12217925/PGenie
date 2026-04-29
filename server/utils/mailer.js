import nodemailer from 'nodemailer';

const configured = !!(process.env.SMTP_HOST && process.env.SMTP_USER && process.env.SMTP_PASS);

const transporter = configured
  ? nodemailer.createTransport({
      host: process.env.SMTP_HOST,
      port: Number(process.env.SMTP_PORT) || 587,
      secure: Number(process.env.SMTP_PORT) === 465,
      auth: { user: process.env.SMTP_USER, pass: process.env.SMTP_PASS },
    })
  : null;

export async function sendMail({ to, subject, text, html }) {
  if (!configured || !transporter) {
    console.log(`[mailer] ${subject} → ${to}\n${text}`);
    return;
  }
  await transporter.sendMail({
    from: `"PGenie" <${process.env.SMTP_USER}>`,
    to,
    subject,
    text,
    html,
  });
}
