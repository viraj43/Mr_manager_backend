import { createUserWithEmailAndPassword } from 'firebase/auth';
import User from '../models/User.js';  // User model
import { auth } from '../services/firebase.js' // Firebase authentication config

// Sign up new user and save additional details to the database
export const signupUser = async (req, res) => {
  const { email, password, name, role } = req.body;  // Extract data from request body

  if (!email || !password || !name || !role) {
    return res.status(400).json({ message: "All fields are required" });
  }

  try {
    // Step 1: Create user in Firebase Auth
    const userCredential = await createUserWithEmailAndPassword(auth, email, password);

    // Step 2: Store user information in MongoDB
    const firebaseUID = userCredential.user.uid;

    // Save the user to the database
    const newUser = new User({
      email,
      firebaseUID,
      name,
      role,  // role can be 'user', 'admin', or others based on your needs
    });

    await newUser.save();

    // Step 3: Respond with the newly created user data
    res.status(201).json({
      message: 'User created successfully',
      user: {
        id: newUser._id,
        email: newUser.email,
        name: newUser.name,
        role: newUser.role,
      },
    });
  } catch (error) {
    console.error('Error creating user:', error.message);
    res.status(500).json({ message: error.message });
  }
};
