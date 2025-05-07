import mongoose from 'mongoose';

const userSchema = new mongoose.Schema({
  email: String,
  firebaseUID: String,
  name: String,
  role: String,
  githubUsername: String,
  githubAccessToken: String,
  createdAt: {
    type: Date,
    default: Date.now,
  },
});

const User = mongoose.model('User', userSchema);

export default User;
