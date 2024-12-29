const express = require('express');
const bodyParser = require('body-parser');
const crypto = require('crypto');
const AWS = require('aws-sdk');

const app = express();
app.use(bodyParser.json());

// Configure AWS SES
const ses = new AWS.SES({
  region: 'us-east-1', // Change this to your SES region
  accessKeyId: process.env.AWS_ACCESS_KEY_ID,
  secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY,
});

// Razorpay Webhook Endpoint
app.post('/webhook', (req, res) => {
  const secret = process.env.RAZORPAY_SECRET;
  const signature = req.headers['x-razorpay-signature'];
  const body = JSON.stringify(req.body);

  // Verify Razorpay webhook signature
  const generatedSignature = crypto
    .createHmac('sha256', secret)
    .update(body)
    .digest('hex');

  if (generatedSignature !== signature) {
    return res.status(400).send('Invalid signature');
  }

  // Handle payment success
  if (req.body.event === 'payment.success') {
    const payment = req.body.payload.payment.entity;
    const userName = payment.notes.name; // Assuming user name is passed in Razorpay notes
    const userEmail = payment.notes.email;

    // Send email using SES
    const emailParams = {
      Source: 'yourname@yourdomain.org', // Replace with your verified .org email
      Destination: {
        ToAddresses: [userEmail],
      },
      Message: {
        Subject: {
          Data: 'Payment Receipt',
        },
        Body: {
          Text: {
            Data: `Dear ${userName},\n\nThank you for your payment!\n\nBest regards,\nYour Company`,
          },
        },
      },
    };

    ses.sendEmail(emailParams, (err, data) => {
      if (err) {
        console.error('Email error:', err);
        return res.status(500).send('Email failed');
      }
      console.log('Email sent:', data);
      res.status(200).send('Webhook handled');
    });
  } else {
    res.status(200).send('Unhandled event');
  }
});

// Start the server
const PORT = process.env.PORT || 3000;
app.listen(PORT, () => console.log(`Server running on port ${PORT}`));
