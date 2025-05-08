import { generateToken } from '../utils/jwtutility.js';
import User from '../models/User.js';

export const signupUser = async (req, res) => {
  const { email, firebaseUID, name, role } = req.body;

  if (!email || !firebaseUID || !name || !role) {
    return res.status(400).json({ message: "All fields are required" });
  }

  try {
    // Check if user already exists
    let existingUser = await User.findOne({ firebaseUID });

    if (existingUser) {
      console.log("I am the fucker")
      return res.status(200).json({
        message: 'User already exists',
        user: existingUser,
      });
    }

    // Save new user
    const newUser = new User({
      email,
      firebaseUID,
      name,
      role,
    });

    await newUser.save();

    // Generate JWT for the new user
    const token = generateToken(newUser);

    // Send the token as an HTTP-only cookie
    res.cookie('token', token, {
      httpOnly: true,          // Prevents client-side access to the cookie
      secure: process.env.NODE_ENV === 'production', // Set to true in production
      sameSite: 'none',      // CSRF protection: cookie is only sent for same-site requests
      maxAge: 24 * 60 * 60 * 1000, // Set cookie expiration (1 day)
      path: '/' // Set cookie path (root)
    });

    res.status(201).json({
      message: 'User signed up successfully',
      user: {
        id: newUser._id,
        email: newUser.email,
        name: newUser.name,
        role: newUser.role,
      },
    });
  } catch (error) {
    console.error('Error signing up user:', error.message);
    res.status(500).json({ message: error.message });
  }
};



export const loginUser = async (req, res) => {
  console.log("Login triggerd");
  const { email, firebaseUID } = req.body;  // Expect frontend to send these

  if (!email || !firebaseUID) {
    return res.status(400).json({ message: "Email and Firebase UID are required" });
  }

  try {
    // Find the user by Firebase UID or email
    const user = await User.findOne({ firebaseUID });

    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    // Generate JWT for the user
    const token = generateToken(user);

    res.cookie('token', token, {
      httpOnly: true,          // Prevents client-side access to the cookie
      secure: true, // Ensures the cookie is sent over HTTPS in production
      sameSite: 'none',      // CSRF protection: cookie is only sent for same-site requests
      maxAge: 24 * 60 * 60 * 1000,
      path: '/' // Set cookie expiration (1 day)
    });

    res.status(200).json({
      message: 'User logged in successfully',
      user,
    });
  } catch (error) {
    console.error('Error logging in user:', error.message);
    res.status(500).json({ message: error.message });
  }
};


export const details = async (req, res) => {
  console.log("details triggerd");
  try {
    // Access the user from the decoded token (available in `req.user`)
    const user = await User.findOne({ email: req.user.email });

    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    // Send user details in response
    res.status(200).json({
      email: user.email,
      name: user.name,
      role: user.role,
      githubUsername: user.githubUsername, // Add more fields as needed
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};