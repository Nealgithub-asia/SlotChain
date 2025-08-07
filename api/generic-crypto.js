const cors = require('cors');

/**
 * This is a serverless function designed to run on platforms like Vercel.
 * It simulates a call to a crypto payment gateway.
 * @param {object} req - The request object from the client.
 * @param {object} res - The response object to send back to the client.
 */
module.exports = async (req, res) => {
  // Initialize CORS middleware to allow requests from your frontend.
  const corsMiddleware = cors();
  await new Promise((resolve, reject) => {
    corsMiddleware(req, res, (result) => {
      if (result instanceof Error) {
        return reject(result);
      }
      return resolve(result);
    });
  });

  // This endpoint only accepts POST requests.
  if (req.method !== 'POST') {
    res.setHeader('Allow', 'POST');
    return res.status(405).json({ error: 'Method Not Allowed' });
  }

  try {
    // Extract the amount and currency from the request body.
    const { amount, currency } = req.body;

    // Validate that the required data was sent.
    if (!amount || !currency) {
      return res.status(400).json({ error: 'Amount and currency are required.' });
    }

    let address = '';

    // --- MOCK PAYMENT GATEWAY LOGIC ---
    // In a real-world application, you would make an API call here to a service
    // like Coinbase Commerce, BitPay, or NOWPayments to generate a real deposit address.
    // For this demo, we are generating a plausible-looking fake address.
    switch (currency.toUpperCase()) {
      case 'ETH':
        address = '0x' + [...Array(40)].map(() => Math.floor(Math.random() * 16).toString(16)).join('');
        break;
      case 'SOL':
        address = 'SoL' + [...Array(41)].map(() => '123456789ABCDEFGHJKLMNPQRSTUVWXYZabcdefghijkmnopqrstuvwxyz'[Math.floor(Math.random() * 58)]).join('');
        break;
      case 'TON':
        address = 'UQ' + [...Array(46)].map(() => '123456789ABCDEFGHJKLMNPQRSTUVWXYZabcdefghijkmnopqrstuvwxyz'[Math.floor(Math.random() * 58)]).join('');
        break;
      default:
        return res.status(400).json({ error: 'Unsupported currency.' });
    }

    // The QR code URL would also typically come from the payment gateway.
    const qrCodeUrl = `https://api.qrserver.com/v1/create-qr-code/?size=150x150&data=${address}`;

    // Send the simulated payment details back to the frontend as a JSON response.
    return res.status(200).json({
      address,
      qrCodeUrl,
      amount,
      currency,
    });

  } catch (error) {
    // Log any unexpected errors to the server console for debugging.
    console.error('[CRYPTO_PAYMENT_ERROR]', error);
    return res.status(500).json({ error: 'An internal server error occurred.' });
  }
};
