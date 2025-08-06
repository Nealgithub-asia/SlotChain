const mongoose = require('mongoose');
const jwt = require('jsonwebtoken');
const dotenv = require('dotenv');
const cors = require('cors');

dotenv.config();

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

// --- Mongoose Schemas ---
const StationSchema = new mongoose.Schema({
  name: String,
  ownerName: String,
  address: String,
  phone: String,
  email: String,
  walletAddress: String,
  services: [String],
  features: [String],
  rating: Number,
  user_ratings_total: Number,
  price_level: Number,
  photos: [String],
  reviews: [{ text: String, author_name: String }],
  opening_hours: { open_now: Boolean },
  submittedAt: Date,
  status: String
});

const BookingSchema = new mongoose.Schema({
  stationId: { type: mongoose.Schema.Types.ObjectId, ref: 'Station' },
  userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  stationName: String,
  stationAddress: String,
  service: String,
  date: String,
  time: String,
  amount: String,
  paymentMethod: String,
  status: { type: String, enum: ['confirmed', 'cancelled'], default: 'confirmed' },
  createdAt: { type: Date, default: Date.now }
});

const Station = mongoose.models.Station || mongoose.model('Station', StationSchema);
const Booking = mongoose.models.Booking || mongoose.model('Booking', BookingSchema);

// --- Auth Middleware ---
// This function checks for a valid JWT in the request headers.
const auth = (handler) => async (req, res) => {
  const token = req.headers.authorization?.split(' ')[1];
  if (!token) {
    return res.status(401).json({ error: 'Unauthorized: No token provided' });
  }
  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    req.user = { id: decoded.id }; // Attach user ID to the request
    return handler(req, res);
  } catch (error) {
    return res.status(401).json({ error: 'Invalid or expired token' });
  }
};

// --- Main Serverless Function ---
module.exports = async (req, res) => {
  const corsMiddleware = cors();
  await new Promise((resolve, reject) => {
    corsMiddleware(req, res, (result) => {
      if (result instanceof Error) return reject(result);
      return resolve(result);
    });
  });

  try {
    await connectDB();

    if (req.method === 'POST' && req.url === '/api/bookings/create') {
        // This is a protected route, so we wrap it with our auth middleware
        return auth(async (req, res) => {
            const { stationId, stationName, stationAddress, service, date, time, amount, paymentMethod } = req.body;
            const booking = new Booking({
                stationId,
                userId: req.user.id,
                stationName,
                stationAddress,
                service,
                date,
                time,
                amount,
                paymentMethod,
                status: 'confirmed'
            });
            await booking.save();
            res.status(201).json(booking);
        })(req, res);
    }

    if (req.method === 'GET' && req.url.startsWith('/api/bookings')) {
        // This is a protected route
        return auth(async (req, res) => {
            const bookings = await Booking.find({ userId: req.user.id }).sort({ createdAt: -1 });
            res.status(200).json(bookings);
        })(req, res);
    }
    
    // If no route matches
    res.status(404).json({ error: 'Route not found.' });

  } catch (error) {
    console.error('[API_BOOKINGS_ERROR]', error);
    res.status(500).json({ error: 'An internal server error occurred.' });
  }
};
