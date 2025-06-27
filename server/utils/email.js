const { Resend } = require('resend');

const resend = new Resend(process.env.RESEND_API_KEY);

async function sendBookingConfirmation(to, subject, html) {
  return resend.emails.send({
    from: 'FlightApp <noreply@resend.dev>', // You can use a Resend-provided domain
    to,
    subject,
    html,
  });
}

module.exports = { sendBookingConfirmation }; 