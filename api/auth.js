const express = require('express');
const mongoose = require('mongoose');
const jwt =require('jsonwebtoken');
const bcrypt = require('bcryptjs');
const dotenv = require('dotenv');
const cors = require('cors');

dotenv.config();
const app = express();

// --- Middleware Setup ---
app.use(cors());
app.use(express.json());

// --- Database Connection ---
// This connects to the database when the API is first called
// and reuses the connection for subsequent calls.
const connectDB = async () => {
  if (mongoose.connection.readyState >= 1) {
    return;
  }
  return mongoose.connect(process.env.MONGO_URI, {
    useNewUrlParser: true,
    useUnifiedTopology: true,
  });
};

// --- Main Handler Function ---
// This function will run for every request to /api/auth/*
const main = async (req, res) => {
    try {
        await connectDB();
    } catch (e) {
        console.error('Database connection failed!', e);
        return res.status(500).json({ error: "Server error: Could not connect to database." });
    }
    // This passes the request to the express app
    return app(req, res);
};


const UserSchema = new mongoose.Schema({
  email: { type: String, required: true, unique: true },
  password: { type: String, required: true },
  role: { type: String, enum: ['user', 'admin'], default: 'user' }
});

const User = mongoose.models.User || mongoose.model('User', UserSchema);

// --- Route Handlers ---
// These routes are relative to the file path.
// Vercel knows that a request to /api/auth/register should run this.
app.post('/api/auth/register', async (req, res) => {
  const { email, password } = req.body;
  try {
    if (!email || !password) {
      return res.status(400).json({ error: 'Email and password are required.' });
    }
    const hashedPassword = await bcrypt.hash(password, 10);
    const user = new User({ email, password: hashedPassword });
    await user.save();
    res.status(201).json({ message: 'User registered successfully.' });
  } catch (error) {
    console.error("Registration Error:", error);
    if (error.code === 11000) {
      return res.status(409).json({ error: 'An account with this email already exists.' });
    }
    res.status(500).json({ error: 'An error occurred during registration.' });
  }
});

app.post('/api/auth/login', async (req, res) => {
  const { email, password } = req.body;
  try {
    const user = await User.findOne({ email });
    if (!user || !await bcrypt.compare(password, user.password)) {
      return res.status(401).json({ error: 'Invalid email or password.' });
    }
    const token = jwt.sign({ id: user._id, role: user.role }, process.env.JWT_SECRET, { expiresIn: '1h' });
    res.json({ token });
  } catch (error) {
    console.error("Login Error:", error);
    res.status(500).json({ error: 'An error occurred during login.' });
  }
});

// Export the main handler function for Vercel
module.exports = main;
