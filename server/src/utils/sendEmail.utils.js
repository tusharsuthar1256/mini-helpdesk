const nodemailer = require('nodemailer');

const sendEmail = async (to, subject, text) => {
  if (!process.env.SMTP_HOST) {
    console.log('Email (SMTP not set): ' + to + ' - ' + subject);
    return;
  }

  const port = Number(process.env.SMTP_PORT) || 587;

  const transporter = nodemailer.createTransport({
    host: process.env.SMTP_HOST,
    port: port,
    secure: port === 465,
    auth: process.env.SMTP_USER
      ? { user: process.env.SMTP_USER, pass: process.env.SMTP_PASS }
      : undefined,
  });

  await transporter.sendMail({
    from: process.env.SMTP_FROM || 'Helpdesk <no-reply@helpdesk.local>',
    to,
    subject,
    text,
  });
};

module.exports = sendEmail;
