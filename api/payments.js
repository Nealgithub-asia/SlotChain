const express = require('express');
const { Client, AccountBalanceQuery, TransferTransaction, Hbar } = require('@hashgraph/sdk'); // Corrected package name
const axios = require('axios');

const app = express();
app.use(express.json());

const client = Client.forTestnet();
client.setOperator(process.env.HEDERA_ACCOUNT_ID, process.env.HEDERA_PRIVATE_KEY);

// Hedera payment
app.post('/pay/crypto', async (req, res) => {
  const { amount, toAccountId } = req.body;
  try {
    const tx = await new TransferTransaction()
      .addHbarTransfer(process.env.HEDERA_ACCOUNT_ID, Hbar.from(-amount))
      .addHbarTransfer(toAccountId, Hbar.from(amount))
      .execute(client);
    const receipt = await tx.getReceipt(client);
    res.json({ status: receipt.status.toString() });
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
});

// Dummy credit/debit card payment
app.post('/pay/card', async (req, res) => {
  const { amount, cardNumber } = req.body;
  // Simulate card payment (replace with real gateway like Stripe in production)
  if (cardNumber.length === 16) {
    res.json({ status: 'success', transactionId: 'dummy-' + Date.now() });
  } else {
    res.status(400).json({ error: 'Invalid card number' });
  }
});

module.exports = app;
