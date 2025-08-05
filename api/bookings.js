const express = require('express');
const mongoose = require('mongoose');
const jwt = require('jsonwebtoken');
const cors = require('cors'); // Import cors

const app = express();

// --- Middleware Setup ---
app.use(cors());
app.use(express.json());

const StationSchema = new mongoose.Schema({
  name: String,
  settings: { type: Object, default: { duration: 60, maxSlots: 10 } }
});
const BookingSchema = new mongoose.Schema({
  stationId: { type: mongoose.Schema.Types.ObjectId, ref: 'Station' },
  userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  slot: Date,
  status: { type: String, enum: ['booked', 'cancelled'], default: 'booked' }
});

const Station = mongoose.models.Station || mongoose.model('Station', StationSchema);
const Booking = mongoose.models.Booking || mongoose.model('Booking', BookingSchema);

// Middleware to verify JWT
const auth = (req, res, next) => {
  const token = req.headers.authorization?.split(' ')[1];
  if (!token) return res.status(401).json({ error: 'Unauthorized: No token provided' });
  try {
    req.user = jwt.verify(token, process.env.JWT_SECRET);
    next();
  } catch (error) {
    res.status(401).json({ error: 'Invalid or expired token' });
  }
};

// Create station (admin only)
app.post('/stations', auth, async (req, res) => {
  if (req.user.role !== 'admin') return res.status(403).json({ error: 'Forbidden: Admins only' });
  try {
    const station = new Station(req.body);
    await station.save();
    res.status(201).json(station);
  } catch(error) {
    res.status(500).json({ error: 'Failed to create station.' });
  }
});

// Book slot
app.post('/book', auth, async (req, res) => {
  try {
    const { stationId, slot } = req.body;
    const booking = new Booking({ stationId, userId: req.user.id, slot });
    await booking.save();
    res.status(201).json(booking);
  } catch(error) {
    res.status(500).json({ error: 'Failed to create booking.' });
  }
});

// Get available slots
app.get('/slots/:stationId', async (req, res) => {
    try {
        const { stationId } = req.params;
        const bookings = await Booking.find({ stationId, status: 'booked' });
        const station = await Station.findById(stationId);
        if (!station) {
            return res.status(404).json({ error: 'Station not found.' });
        }
        const slots = [];
        const now = new Date();
        for (let i = 0; i < station.settings.maxSlots; i++) {
            const slot = new Date(now.getTime() + i * station.settings.duration * 60000);
            if (!bookings.some(b => b.slot.getTime() === slot.getTime())) {
            slots.push(slot);
            }
        }
        res.json(slots);
    } catch(error) {
        res.status(500).json({ error: 'Failed to get available slots.' });
    }
});

module.exports = app;
