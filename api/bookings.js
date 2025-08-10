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
const UserSchema = new mongoose.Schema({
  email: { type: String, required: true, unique: true },
  password: { type: String, required: true },
  role: { type: String, enum: ['user', 'admin'], default: 'user' }
});

const BookingSchema = new mongoose.Schema({
  stationId: { type: String, required: true },
  userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  stationName: String,
  stationAddress: String,
  service: String,
  date: String,
  time: String,
  amount: String,
  paymentMethod: String,
  status: { type: String, enum: ['pending', 'confirmed', 'cancelled'], default: 'confirmed' },
  createdAt: { type: Date, default: Date.now }
});

const User = mongoose.models.User || mongoose.model('User', UserSchema);
const Booking = mongoose.models.Booking || mongoose.model('Booking', BookingSchema);

// --- Auth Verification Function (REVISED) ---
// This function directly verifies the token and returns the user ID or throws an error.
const verifyToken = (req) => {
  const token = req.headers.authorization?.split(' ')[1];
  if (!token) {
    const err = new Error('Unauthorized: No token provided');
    err.statusCode = 401;
    throw err;
  }
  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    return decoded.id;
  } catch (error) {
    console.error("Authentication error:", error.message);
    const err = new Error('Invalid or expired token');
    err.statusCode = 401;
    throw err;
  }
};


// --- Route Handlers ---
// These handlers now assume that req.user has already been set.

// Handler for creating a booking or updating its status
const handlePostBooking = async (req, res) => {
    if (req.body.action === 'updateStatus') {
        const { bookingId, status } = req.body;
        const booking = await Booking.findById(bookingId);
        if (!booking) {
            return res.status(404).json({ error: 'Booking not found.' });
        }
        if (booking.userId.toString() !== req.user.id) {
            return res.status(403).json({ error: 'Forbidden' });
        }
        booking.status = status;
        await booking.save();
        return res.status(200).json(booking);
    }

    const { stationId, stationName, stationAddress, service, date, time, amount, paymentMethod, status } = req.body;
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
        status: status || 'confirmed'
    });
    await booking.save();
    res.status(201).json(booking);
};

// Handler for fetching user's bookings
const handleGetBookings = async (req, res) => {
    const bookings = await Booking.find({ userId: req.user.id }).sort({ createdAt: -1 });
    res.status(200).json(bookings);
};


// --- Main Serverless Function (REVISED) ---
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

    // Verify token at the beginning of the request flow
    const userId = verifyToken(req);
    req.user = { id: userId }; // Attach user ID to the request object

    if (req.method === 'POST') {
        return handlePostBooking(req, res);
    }

    if (req.method === 'GET') {
        return handleGetBookings(req, res);
    }

    res.setHeader('Allow', ['POST', 'GET']);
    res.status(405).json({ error: `Method ${req.method} Not Allowed` });

  } catch (error) {
    // Catch authentication errors specifically
    if (error.statusCode === 401) {
        return res.status(401).json({ error: error.message });
    }
    // Catch all other errors
    console.error('[API_BOOKINGS_ERROR]', error);
    res.status(500).json({ error: 'An internal server error occurred.' });
  }
};
