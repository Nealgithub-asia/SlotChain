const express = require('express');
const mongoose = require('mongoose');
const jwt = require('jsonwebtoken');
const bcrypt = require('bcryptjs');
const dotenv = require('dotenv');
const cors = require('cors'); // 1. Import the cors package

dotenv.config();
const app = express();

// 2. Use CORS middleware
// This will allow requests from any origin.
// For production, you might want to restrict this to your frontend's domain.
app.use(cors());

app.use(express.json());

// --- Database Connection ---
// It's better to establish the connection once and reuse it.
// A serverless function might reconnect on each invocation if not handled carefully.
// This setup is okay for now.
mongoose.connect(process.env.MONGO_URI, { useNewUrlParser: true, useUnifiedTopology: true });

const UserSchema = new mongoose.Schema({
  email: { type: String, required: true, unique: true },
  password: { type: String, required: true },
  role: { type: String, enum: ['user', 'admin'], default: 'user' }
});

// Avoid redefining the model if it's already been defined, which can happen in serverless environments
const User = mongoose.models.User || mongoose.model('User', UserSchema);


// --- Routes ---

// Register
app.post('/api/auth/register', async (req, res) => {
  const { email, password } = req.body;
  try {
    const hashedPassword = await bcrypt.hash(password, 10);
    const user = new User({ email, password: hashedPassword });
    await user.save();
    res.status(201).json({ message: 'User registered' });
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
});

// Login
app.post('/api/auth/login', async (req, res) => {
  const { email, password } = req.body;
  try {
    const user = await User.findOne({ email });
    if (!user || !await bcrypt.compare(password, user.password)) {
      return res.status(401).json({ error: 'Invalid credentials' });
    }
    const token = jwt.sign({ id: user._id, role: user.role }, process.env.JWT_SECRET, { expiresIn: '1h' });
    res.json({ token });
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
});

// Export the app for the serverless environment
module.exports = app;
