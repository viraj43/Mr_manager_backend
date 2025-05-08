import express from 'express';
import { signupUser,loginUser ,details} from '../controllers/authController.js';
import {authenticateJWT} from "../middlewares/authMiddleware.js"

const router = express.Router();

// POST request to signup a new user
router.post('/signup', signupUser);

router.post('/login',loginUser);

router.get('/details',authenticateJWT, details);

export default router;
