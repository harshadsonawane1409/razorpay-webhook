const express = require('express');
const nodemailer = require('nodemailer');
const bodyParser = require('body-parser');

const app = express();
app.use(bodyParser.json());

// Email transporter (Hostinger SMTP)
const transporter = nodemailer.createTransport({
  host: 'smtp.hostinger.com',
  port: 465, // Use 587 for TLS
  secure: true, // true for SSL
  auth: {
    user: 'benefits@returnsfinance.site', // Replace with your Hostinger email
    pass: '9&Fl1ky!d', // Replace with your email password
  },
});

// Endpoint to handle Razorpay webhook
app.post('/razorpay-webhook', async (req, res) => {
  try {
    const { payload } = req.body; // Razorpay sends payment info in payload
    const { email, name } = payload.customer;

    // Send email
    const mailOptions = {
      from: 'benefits@returnsfinance.site',
      to: email,
      subject: `Thank you, ${name}!`,
      html: `<p>Hello ${name},</p><p>Thank you for your payment. Please find the attached invoice.</p>`,
      attachments: [
        {
          filename: 'master_plan.pdf',
          path: 'https://your-app.onrender.com/public/master_plan.pdf', // Adjust Render URL
        },
      ],
    };

    await transporter.sendMail(mailOptions);
    res.status(200).send('Email sent successfully.');
  } catch (error) {
    console.error('Error sending email:', error);
    res.status(500).send('Failed to send email.');
  }
});

// Start the server
const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});
