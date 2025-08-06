const express = require('express');
const cors = require('cors');

const app = express();

// --- Middleware Setup ---
app.use(cors());
app.use(express.json());

// --- Main Handler ---
// This endpoint now does nothing but return a success message.
app.post('/notify', async (req, res) => {
  console.log("Notification endpoint called, but email functionality is disabled.");
  // Immediately return a success status.
  res.json({ status: 'Notification handled (email disabled).' });
});

module.exports = app;
