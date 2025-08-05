const express = require('express');
const { Client, AccountBalanceQuery, TransferTransaction, Hbar } = require('@hashgraph/sdk');
const axios = require('axios');
const cors = require('cors'); // 1. Import the cors package

const app = express();

// --- Middleware Setup ---
// 2. Use CORS to allow requests from your frontend. This is crucial.
app.use(cors());
// Use express.json() to parse JSON bodies in requests.
app.use(express.json());


// --- Route Handlers ---

// Hedera payment route
// 3. The route is now just '/crypto'. The full path will be /api/payments/crypto
app.post('/crypto', async (req, res) => {
  const { amount, toAccountId } = req.body;
  try {
    // It's good practice to check for required environment variables.
    if (!process.env.HEDERA_ACCOUNT_ID || !process.env.HEDERA_PRIVATE_KEY) {
        throw new Error("Hedera API credentials are not configured on the server.");
    }

    // Initialize the client inside the handler for serverless environments.
    const client = Client.forTestnet();
    client.setOperator(process.env.HEDERA_ACCOUNT_ID, process.env.HEDERA_PRIVATE_KEY);

    const tx = await new TransferTransaction()
      .addHbarTransfer(process.env.HEDERA_ACCOUNT_ID, Hbar.from(-amount))
      .addHbarTransfer(toAccountId, Hbar.from(amount))
      .execute(client);
    const receipt = await tx.getReceipt(client);
    res.json({ status: receipt.status.toString() });
  } catch (error) {
    // Log the error on the server for debugging.
    console.error("Crypto Payment Error:", error);
    // Send a structured JSON error response to the frontend.
    res.status(500).json({ error: error.message });
  }
});

// Dummy credit/debit card payment route
// 4. The route is now just '/card'. The full path will be /api/payments/card
app.post('/card', async (req, res) => {
  const { amount, cardNumber } = req.body;
  // Simulate card payment (replace with real gateway like Stripe in production)
  if (cardNumber && cardNumber.length === 16) {
    res.json({ status: 'success', transactionId: 'dummy-' + Date.now() });
  } else {
    res.status(400).json({ error: 'Invalid card number' });
  }
});

// Export the Express app for the serverless environment to use.
module.exports = app;
