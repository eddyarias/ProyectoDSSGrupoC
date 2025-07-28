const nodemailer = require('nodemailer');
require('dotenv').config();

// Create a reusable transporter object using the SMTP transport for Gmail
const transporter = nodemailer.createTransport({
  service: 'gmail',
  auth: {
    user: process.env.GMAIL_USER,
    pass: process.env.GMAIL_APP_PASSWORD,
  },
});

/**
 * Sends an alert email.
 * @param {string} subject - The subject of the email.
 * @param {string} textBody - The plain text body of the email.
 */
async function sendAlertEmail(subject, textBody) {
  // For now, we'll send the email to a hardcoded recipient (e.g., the sender)
  // In a real app, this would be based on user roles (e.g., Jefe de SOC).
  const mailOptions = {
    from: process.env.GMAIL_USER,
    to: process.env.GMAIL_USER, // Sending to self for testing
    subject: subject,
    text: textBody,
  };

  try {
    let info = await transporter.sendMail(mailOptions);
    console.log('Email sent: ' + info.response);
  } catch (error) {
    console.error('Error sending email:', error);
  }
}

module.exports = sendAlertEmail;