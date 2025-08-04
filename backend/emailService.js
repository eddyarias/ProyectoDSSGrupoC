const nodemailer = require('nodemailer');
const { supabaseAdmin } = require('./supabaseClient');
require('dotenv').config();

const transporter = nodemailer.createTransport({
  service: 'gmail',
  auth: {
    user: process.env.GMAIL_USER,
    pass: process.env.GMAIL_APP_PASSWORD,
  },
});

async function sendAlertEmail(subject, textBody, user) {
  try {
    let targetEmail;

    if (user?.id) {
      try {
        const { data: userRec, error } = await supabaseAdmin.auth.admin.getUserById(user.id);
        if (error) throw error;
        targetEmail = userRec?.user?.email;
      } catch (e) {
        console.warn('⚠️ No se pudo obtener por UUID, usando email directo');
        targetEmail = user?.email;
      }
    } else {
      targetEmail = user?.email || process.env.GMAIL_USER;
    }

    const mailOptions = {
      from: process.env.GMAIL_USER,
      to: targetEmail,
      subject,
      text: textBody,
    };

    const info = await transporter.sendMail(mailOptions);
    console.log('✅ Email enviado a:', targetEmail);
    return info;
  } catch (error) {
    console.error('❌ Error enviando email:', error);
  }
}

module.exports = sendAlertEmail;
