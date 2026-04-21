const mongoose = require('mongoose');

const userSchema = new mongoose.Schema({
  name: { type: String, required: true },
  email: { type: String, required: true, unique: true },
  password: { type: String, required: true }, // Store hashed password strings securely
  sessionToken: { type: String }, // Used for authenticating active logins against browser cookies
  role: { type: String, enum: ['Administrator', 'Settings Manager', 'Alert Responder', 'Read Only'], default: 'Read Only' },
  status: { type: String, enum: ['Active', 'Pending Invite', 'Offline'], default: 'Active' },
  avatar: { type: String }
});

// Pre-save hook to extract initials for the avatar if not provided explicitly
userSchema.pre('save', function() {
  if (!this.avatar && this.name) {
    const split = this.name.split(' ');
    let init = '';
    if (split.length >= 2) {
      init = (split[0][0] + split[split.length - 1][0]).toUpperCase();
    } else if (split.length === 1) {
      init = split[0].substring(0, 2).toUpperCase();
    }
    this.avatar = init;
  }
});

module.exports = mongoose.model('User', userSchema);
