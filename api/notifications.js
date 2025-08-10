const express = require('express');
const cors = require('cors');
const mongoose = require('mongoose');
const dotenv = require('dotenv');
const jwt = require('jsonwebtoken');

dotenv.config();

const app = express();

// --- Middleware Setup ---
app.use(cors());
app.use(express.json());

// --- Database Connection ---
const connectDB = async () => {
  if (mongoose.connection.readyState >= 1) {
    return;
  }
  return mongoose.connect(process.env.MONGO_URI, {
    useNewUrlParser: true,
    useUnifiedTopology: true,
  });
};

// --- Mongoose Schema ---
const NotificationSchema = new mongoose.Schema({
  message: { type: String, required: true },
  userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  read: { type: Boolean, default: false },
  createdAt: { type: Date, default: Date.now }
});

const Notification = mongoose.models.Notification || mongoose.model('Notification', NotificationSchema);

// --- Auth Middleware ---
const auth = (handler) => async (req, res) => {
  const token = req.headers.authorization?.split(' ')[1];
  if (!token) {
    return res.status(401).json({ error: 'Unauthorized: No token provided' });
  }
  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    req.user = { id: decoded.id };
    return handler(req, res);
  } catch (error) {
    return res.status(401).json({ error: 'Invalid or expired token' });
  }
};


// --- Main Handler ---
const handler = async (req, res) => {
    await connectDB();

    if (req.method === 'POST' && req.url.endsWith('/notify')) {
        const { message, userId } = req.body;

        if (!message) {
            return res.status(400).json({ error: 'Message is required.' });
        }

        const notification = new Notification({
            message,
            userId
        });

        await notification.save();
        return res.status(201).json({ status: 'Notification created successfully.', notification });

    } else if (req.method === 'GET') {
        return auth(async (req, res) => {
            const notifications = await Notification.find({ userId: req.user.id }).sort({ createdAt: -1 });
            res.status(200).json(notifications);
        })(req, res);
    }
    
    res.status(404).json({ error: 'Route not found.' });
};

// Vercel exports the handler
module.exports = async (req, res) => {
    const corsMiddleware = cors();
    await new Promise((resolve, reject) => {
        corsMiddleware(req, res, (result) => {
            if (result instanceof Error) return reject(result);
            return resolve(result);
        });
    });
    
    try {
        await handler(req, res);
    } catch (error) {
        console.error('[API_NOTIFICATIONS_ERROR]', error);
        res.status(500).json({ error: 'An internal server error occurred.' });
    }
};
