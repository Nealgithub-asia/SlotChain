const express = require('express');
const mongoose = require('mongoose');
const jwt = require('jsonwebtoken');
const bcrypt = require('bcryptjs');
const dotenv = require('dotenv');
const cors = require('cors'); // Import cors

dotenv.config();
const app = express();

// --- Middleware Setup ---
app.use(cors()); // Use CORS to allow requests
app.use(express.json()); // Use express.json() to parse request bodies

// --- Database Connection ---
// This connection should be handled carefully in a serverless environment.
// This approach is okay for now but might be optimized later.
mongoose.connect(process.env.MONGO_URI, { useNewUrlParser: true, useUnifiedTopology: true });

const UserSchema = new mongoose.Schema({
  email: { type: String, required: true, unique: true },
  password: { type: String, required: true },
  role: { type: String, enum: ['user', 'admin'], default: 'user' }
});

// Avoid redefining the model, which can cause errors in serverless functions
const User = mongoose.models.User || mongoose.model('User', UserSchema);

// --- Route Handlers ---

// Register route (accessible at /api/auth/register)
app.post('/register', async (req, res) => {
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
    // Check for duplicate key error
    if (error.code === 11000) {
        return res.status(409).json({ error: 'An account with this email already exists.' });
    }
    res.status(500).json({ error: 'An error occurred during registration.' });
  }
});

// Login route (accessible at /api/auth/login)
app.post('/login', async (req, res) => {
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

module.exports = app;
