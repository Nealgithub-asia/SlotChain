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

// --- Auth Middleware (FIXED) ---
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

    // Route to CREATE a new booking
    if (req.method === 'POST') {
        // This is a protected route, so we wrap it with our auth middleware
        return auth(async (req, res) => {
            // --- NEW: Handle status updates ---
            if (req.body.action === 'updateStatus') {
                const { bookingId, status } = req.body;
                const booking = await Booking.findById(bookingId);
                if (!booking) {
                    return res.status(404).json({ error: 'Booking not found.' });
                }
                // Ensure the user owns this booking
                if (booking.userId.toString() !== req.user.id) {
                    return res.status(403).json({ error: 'Forbidden' });
                }
                booking.status = status;
                await booking.save();
                return res.status(200).json(booking);
            }

            // --- Original booking creation logic ---
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
                status: status || 'confirmed' // Default to confirmed if not provided
            });
            await booking.save();
            res.status(201).json(booking);
        })(req, res);
    }


    // Route to GET all bookings for the logged-in user
    if (req.method === 'GET') {
        // This is also a protected route
        return auth(async (req, res) => {
            const bookings = await Booking.find({ userId: req.user.id }).sort({ createdAt: -1 });
            res.status(200).json(bookings);
        })(req, res);
    }

    // If no route matches
    res.setHeader('Allow', ['POST', 'GET']);
    res.status(405).json({ error: `Method ${req.method} Not Allowed` });

  } catch (error) {
    console.error('[API_BOOKINGS_ERROR]', error);
    res.status(500).json({ error: 'An internal server error occurred.' });
  }
};
