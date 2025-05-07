import User from '../models/User.js';  // User model

// Save user details to the database
export const signupUser= async (req, res) => {
  const { email, firebaseUID, name, role } = req.body;  // Expect frontend to send these

  if (!email || !firebaseUID || !name || !role) {
    return res.status(400).json({ message: "All fields are required" });
  }

  try {
    // Check if user already exists in the local database
    let existingUser = await User.findOne({ firebaseUID });

    if (existingUser) {
      return res.status(200).json({
        message: 'User already exists in database',
        user: {
          id: existingUser._id,
          email: existingUser.email,
          name: existingUser.name,
          role: existingUser.role,
        },
      });
    }

    // Save new user info to MongoDB
    const newUser = new User({
      email,
      firebaseUID,
      name,
      role,
    });

    await newUser.save();

    res.status(201).json({
      message: 'User info saved successfully',
      user: {
        id: newUser._id,
        email: newUser.email,
        name: newUser.name,
        role: newUser.role,
      },
    });
  } catch (error) {
    console.error('Error saving user info:', error.message);
    res.status(500).json({ message: error.message });
  }
};
