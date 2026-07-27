const nodemailer = require('nodemailer');

// This utility uses Ethereal Email to create a fake SMTP service for development.
// Any emails sent with this will not be delivered to a real inbox, but you will
// get a URL in the console to preview the sent email.
//
// For production, you should replace this with a real email transport
// service like SendGrid, Mailgun, or your own SMTP server.
const sendEmail = async (options) => {
  // 1. Create a transporter
  const transporter = nodemailer.createTransport({
    host: process.env.EMAIL_HOST || 'smtp.ethereal.email',
    port: process.env.EMAIL_PORT || 587,
    auth: {
      user: process.env.EMAIL_USERNAME || 'maddison53@ethereal.email', // Example from Ethereal
      pass: process.env.EMAIL_PASSWORD || 'jn7jnAPss4f63QBp6D', // Example from Ethereal
    },
  });

  // 2. Define the email options
  const mailOptions = {
    from: 'Mersko Support <support@mersko.com>',
    to: options.email,
    subject: options.subject,
    html: options.html,
  };

  // 3. Actually send the email
  const info = await transporter.sendMail(mailOptions);

  console.log('Message sent: %s', info.messageId);
  // Preview only available when sending through an Ethereal account
  console.log('Preview URL: %s', nodemailer.getTestMessageUrl(info));
};

module.exports = sendEmail;
