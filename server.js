import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import mongoose from 'mongoose';
import authRoutes from './routes/authRoutes.js';  // Import the auth 
import projectRoutes from './routes/projectRoutes.js';  // Import the project
import githubRoutes from './routes/githubRoutes.js';  // Import the github

dotenv.config();
const app = express();
const PORT = process.env.PORT || 3000;

// Middleware
app.use(cors());
app.use(express.json());  // Parse JSON request bodies

// Routes
app.use('/api/github',githubRoutes)
app.use('/api/auth', authRoutes);  // Use auth routes
app.use('/api/projects', projectRoutes);

// Connect to MongoDB
mongoose.connect(process.env.MONGODB_URI, { useNewUrlParser: true, useUnifiedTopology: true })
  .then(() => {
    app.listen(PORT, () => {
      console.log(`Server running on port ${PORT}`);
    });
  })
  .catch((err) => {
    console.error('Database connection error:', err);
  });
