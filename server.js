import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import mongoose from 'mongoose';
import authRoutes from './routes/authRoutes.js';  // Import the auth routes
import projectRoutes from './routes/projectRoutes.js';  // Import the project routes
import githubRoutes from './routes/githubRoutes.js';  // Import the github routes
import cookieParser from 'cookie-parser';

dotenv.config();
const app = express();
const PORT = process.env.PORT || 3000;

const corsOptions = {
  origin: 'http://localhost:5173', // The URL of your frontend app
  credentials: true,  // Ensure cookies are allowed to be sent with requests
};

app.use(cors(corsOptions));
// Middleware Configuration
app.use(cookieParser()); // Ensure cookie parsing middleware is set
app.use(express.json());  // Parse JSON request bodies

 // Use CORS with the provided options

// Routes
app.use('/api/github', githubRoutes);
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
