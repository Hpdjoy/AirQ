const express = require('express');
const router = express.Router();
const User = require('../models/User');

// Get all active user allocations
router.get('/', async (req, res) => {
  try {
    const users = await User.find().sort({ createdAt: -1 });
    res.json(users);
  } catch (err) {
    console.error('Error fetching users:', err);
    res.status(500).json({ error: 'Server error fetching users' });
  }
});

// Add a new user manually
router.post('/add', async (req, res) => {
  try {
    const { name, email, role, password } = req.body;
    
    // Check constraints
    const existing = await User.findOne({ email });
    if (existing) {
      return res.status(400).json({ error: 'User with this email already exists' });
    }

    // Hash the dynamically provided password
    const crypto = require('crypto');
    const pwdHash = crypto.createHash('sha256').update(password || 'welcome123').digest('hex');

    const newUser = new User({
      name,
      email,
      password: pwdHash,
      role: role || 'Read Only',
      status: 'Active' 
    });

    await newUser.save();
    res.status(201).json(newUser);

  } catch (err) {
    console.error('Error adding user:', err);
    res.status(500).json({ error: 'Server error saving user' });
  }
});

// Update User Role manually
router.put('/:id', async (req, res) => {
  try {
    const { role } = req.body;
    const user = await User.findByIdAndUpdate(req.params.id, { role }, { new: true });
    if (!user) return res.status(404).json({ error: 'User not found' });
    res.json(user);
  } catch (err) {
    console.error('Error updating user:', err);
    res.status(500).json({ error: 'Server error updating user' });
  }
});

// Delete a user manually
router.delete('/:id', async (req, res) => {
  try {
    const user = await User.findByIdAndDelete(req.params.id);
    if (!user) return res.status(404).json({ error: 'User not found' });
    res.json({ message: 'User successfully removed' });
  } catch (err) {
    console.error('Error deleting user:', err);
    res.status(500).json({ error: 'Server error deleting user' });
  }
});

// Seed an initial Admin user if the collection is empty
const seedDefaultUser = async () => {
  try {
    const count = await User.countDocuments();
    if (count === 0) {
      // Create a default SHA-256 hash placeholder for 'admin123' just so the database doesn't crash on required parameters
      const crypto = require('crypto');
      const defaultHash = crypto.createHash('sha256').update('admin123').digest('hex');

      const defaultAdmin = new User({
        name: 'System Administrator',
        email: 'admin@airq.local',
        password: defaultHash,
        role: 'Administrator',
        status: 'Active'
      });
      await defaultAdmin.save();
      console.log("🌱 Default System Administrator seeded. (Password: admin123)");
    }
  } catch (err) {
    console.error("Failed to seed default user:", err);
  }
};
seedDefaultUser();

module.exports = router;
