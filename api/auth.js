const mongoose = require('mongoose');
const jwt = require('jsonwebtoken');
const bcrypt = require('bcryptjs');
const dotenv = require('dotenv');
const cors = require('cors');

// Initialize dotenv to load environment variables
dotenv.config();

// --- Database Connection ---
const connectDB = async () => {
  // Reuse existing connection if we're in a serverless environment
  if (mongoose.connection.readyState >= 1) {
    return;
  }
  // Otherwise, create a new connection
  return mongoose.connect(process.env.MONGO_URI, {
    useNewUrlParser: true,
    useUnifiedTopology: true,
  });
};

// --- Mongoose User Schema ---
const UserSchema = new mongoose.Schema({
  email: { type: String, required: true, unique: true },
  password: { type: String, required: true },
  role: { type: String, enum: ['user', 'admin'], default: 'user' }
});

// Avoid redefining the model, which can happen in serverless environments
const User = mongoose.models.User || mongoose.model('User', UserSchema);

// --- Main Serverless Function ---
// This is the single function that Vercel will run for any request to /api/auth
module.exports = async (req, res) => {
  // This is a helper function to make the cors middleware work in this context.
  const corsMiddleware = cors();
  await new Promise((resolve, reject) => {
    corsMiddleware(req, res, (result) => {
      if (result instanceof Error) {
        return reject(result);
      }
      return resolve(result);
    });
  });

  // We only want to process POST requests for login/signup
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method Not Allowed' });
  }

  try {
    // Ensure the database is connected before we do anything
    await connectDB();

    // The frontend will now send an 'action' in the body
    const { action, email, password } = req.body;

    // --- Action Handler ---
    if (action === 'register') {
      // Handle User Registration
      if (!email || !password) {
        return res.status(400).json({ error: 'Email and password are required.' });
      }
      const hashedPassword = await bcrypt.hash(password, 10);
      const user = new User({ email, password: hashedPassword });
      await user.save();
      return res.status(201).json({ message: 'User registered successfully.' });

    } else if (action === 'login') {
      // Handle User Login
      const user = await User.findOne({ email });
      if (!user || !(await bcrypt.compare(password, user.password))) {
        return res.status(401).json({ error: 'Invalid email or password.' });
      }
      const token = jwt.sign({ id: user._id, email: user.email }, process.env.JWT_SECRET, { expiresIn: '1h' });
      return res.json({ token });

    } else {
      // Handle any other unknown actions
      return res.status(400).json({ error: 'Invalid action specified.' });
    }

  } catch (error) {
    // This is our main error handler. It will catch database errors or other crashes.
    console.error('[API_AUTH_ERROR]', error); // Log the full error on the server
    if (error.code === 11000) {
      return res.status(409).json({ error: 'An account with this email already exists.' });
    }
    return res.status(500).json({ error: 'An internal server error occurred.' });
  }
};
