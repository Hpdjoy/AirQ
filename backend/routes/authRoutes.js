const express = require('express');
const router = express.Router();
const User = require('../models/User');
const crypto = require('crypto');

// Utility function to avoid external dependencies (e.g. bcrypt) for simplicity
const hashPassword = (text) => {
  return crypto.createHash('sha256').update(text).digest('hex');
};

const generateToken = () => {
  return crypto.randomBytes(32).toString('hex');
};

// Signup Endpoint
router.post('/signup', async (req, res) => {
  try {
    const { name, email, password } = req.body;
    if (!name || !email || !password) {
      return res.status(400).json({ error: 'All fields are required.' });
    }

    const existingUser = await User.findOne({ email });
    if (existingUser) {
      return res.status(400).json({ error: 'Account already exists for this email.' });
    }

    const sessionToken = generateToken();
    const newUser = new User({
      name,
      email,
      password: hashPassword(password),
      role: 'Administrator', // Assigning default Admin for the Final Year Project prototype owner
      sessionToken
    });

    await newUser.save();
    
    // Pass everything required back to the UI to process the state
    res.status(201).json({
      message: "Signup successful",
      token: sessionToken,
      user: { id: newUser._id, name: newUser.name, email: newUser.email, role: newUser.role }
    });
  } catch (err) {
    console.error("Signup error:", err);
    res.status(500).json({ error: 'Server error during signup' });
  }
});

// Login Endpoint
router.post('/login', async (req, res) => {
  try {
    const { email, password } = req.body;
    if (!email || !password) {
      return res.status(400).json({ error: 'Email and password are required.' });
    }

    const user = await User.findOne({ email });
    if (!user) {
      return res.status(401).json({ error: 'Invalid credentials. User not found.' });
    }

    // Hash the input and compare against database string natively
    const hashedAttempt = hashPassword(password);
    if (user.password !== hashedAttempt) {
      return res.status(401).json({ error: 'Invalid credentials.' });
    }

    // Refresh token
    const newSessionToken = generateToken();
    user.sessionToken = newSessionToken;
    await user.save();

    res.status(200).json({
      message: "Login successful",
      token: newSessionToken,
      user: { id: user._id, name: user.name, email: user.email, role: user.role }
    });
  } catch (err) {
    console.error("Login error:", err);
    res.status(500).json({ error: 'Server error during login' });
  }
});

// Verify Endpoint (React pings this on load checking if token exists in Mongo)
router.post('/verify', async (req, res) => {
  try {
    const { token } = req.body;
    if (!token) {
      return res.status(401).json({ error: 'No token provided' });
    }

    const user = await User.findOne({ sessionToken: token });
    if (!user) {
      return res.status(401).json({ error: 'Session invalid or expired' });
    }

    // Authorized
    res.status(200).json({
      user: { id: user._id, name: user.name, email: user.email, role: user.role }
    });
  } catch (err) {
    res.status(500).json({ error: 'Server error verifying session' });
  }
});

module.exports = router;
