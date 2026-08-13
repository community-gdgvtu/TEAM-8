const express = require('express');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const User = require('../models/User');
const config = require('../config');
const router = express.Router();

const JWT_SECRET = config.jwt.secret;
const normalizeEmail = (email = '') => String(email).trim().toLowerCase();

// Register
router.post('/register', async (req, res) => {
  try {
    console.log('Register request body:', req.body);
    let { name, email, password, role, phone, assignedArea } = req.body;
    if (!email || !password) return res.status(400).json({ error: 'Email and password are required' });

    email = normalizeEmail(email);
    const existingUser = await User.findOne({ email });
    if (existingUser) return res.status(400).json({ error: 'Email already in use' });
    const hashedPassword = await bcrypt.hash(password, 10);
    const user = new User({ name, email, password: hashedPassword, role, phone, assignedArea });
    await user.save();
    res.status(201).json({ message: 'User registered successfully' });
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
});

// Login
router.post('/login', async (req, res) => {
  try {
    console.log('Login request body:', req.body);
    let { email, password } = req.body;
    if (!email || !password) return res.status(400).json({ error: 'Email and password are required' });

    email = normalizeEmail(email);
    const user = await User.findOne({ email });
    if (!user) {
      console.log(`Login attempt: user not found for email=${email}`);
      return res.status(400).json({ error: 'Invalid credentials' });
    }
    console.log(`Login attempt: user found id=${user._id}`);
    const isMatch = await bcrypt.compare(password, user.password);
    console.log(`Password match for ${email}: ${isMatch}`);
    if (!isMatch) return res.status(400).json({ error: 'Invalid credentials' });
    const token = jwt.sign({ userId: user._id, role: user.role }, JWT_SECRET, { expiresIn: '1d' });
    res.json({ token, user: { id: user._id, name: user.name, email: user.email, role: user.role } });
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
});

// Middleware to protect routes
function authMiddleware(req, res, next) {
  const authHeader = req.headers.authorization;
  if (!authHeader) return res.status(401).json({ error: 'No token provided' });
  const token = authHeader.split(' ')[1];
  try {
    const decoded = jwt.verify(token, JWT_SECRET);
    req.user = decoded;
    next();
  } catch (err) {
    res.status(401).json({ error: 'Invalid token' });
  }
}

module.exports = { router, authMiddleware };
