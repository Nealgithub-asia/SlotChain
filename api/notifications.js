const express = require('express');
const nodemailer = require('nodemailer');
const cors = require('cors'); // Import cors

const app = express();

// --- Middleware Setup ---
app.use(cors());
app.use(express.json());

app.post('/notify', async (req, res) => {
  const { email, subject, message } = req.body;
  try {
    if (!process.env.EMAIL_USER || !process.env.EMAIL_PASS) {
        throw new Error("Email service is not configured on the server.");
    }
    const transporter = nodemailer.createTransport({
        service: 'gmail',
        auth: {
            user: process.env.EMAIL_USER,
            pass: process.env.EMAIL_PASS
        }
    });

    await transporter.sendMail({
      from: process.env.EMAIL_USER,
      to: email,
      subject,
      text: message
    });
    res.json({ status: 'Email sent successfully.' });
  } catch (error) {
    console.error("Notification Error:", error);
    res.status(500).json({ error: error.message });
  }
});

module.exports = app;
