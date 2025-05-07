import express from 'express';
import { signupUser } from '../controllers/authController.js';

const router = express.Router();

// POST request to signup a new user
router.post('/signup', signupUser);

export default router;
