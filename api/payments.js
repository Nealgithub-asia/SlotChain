const { Client, TransferTransaction, Hbar } = require('@hashgraph/sdk');
const cors = require('cors');

// This function will be the serverless handler
module.exports = async (req, res) => {
  // Apply CORS middleware
  const corsMiddleware = cors();
  await new Promise((resolve, reject) => {
    corsMiddleware(req, res, (result) => {
      if (result instanceof Error) {
        return reject(result);
      }
      return resolve(result);
    });
  });

  // Simple router logic based on the URL path
  if (req.method === 'POST' && req.url.includes('/crypto')) {
    // Handle Hedera payment
    const { amount, toAccountId } = req.body;
    try {
      if (!process.env.HEDERA_ACCOUNT_ID || !process.env.HEDERA_PRIVATE_KEY) {
        throw new Error("Hedera API credentials are not configured on the server.");
      }

      const client = Client.forTestnet();
      client.setOperator(process.env.HEDERA_ACCOUNT_ID, process.env.HEDERA_PRIVATE_KEY);

      const tx = await new TransferTransaction()
        .addHbarTransfer(process.env.HEDERA_ACCOUNT_ID, Hbar.from(-amount))
        .addHbarTransfer(toAccountId, Hbar.from(amount))
        .execute(client);
      const receipt = await tx.getReceipt(client);
      res.json({ status: receipt.status.toString() });
    } catch (error) {
      console.error("Crypto Payment Error:", error);
      res.status(500).json({ error: error.message });
    }
  } else if (req.method === 'POST' && req.url.includes('/card')) {
    // Handle dummy card payment
    const { amount, cardNumber } = req.body;
    if (cardNumber && cardNumber.length === 16) {
      res.json({ status: 'success', transactionId: 'dummy-' + Date.now() });
    } else {
      res.status(400).json({ error: 'Invalid card number' });
    }
  } else {
    // Handle not found routes
    res.status(404).json({ error: 'Route not found' });
  }
};
