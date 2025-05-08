import express from 'express';
import {
  redirectToGitHub,
  handleGitHubCallback,
  getUserRepositories,
  unlinkGitHub,
} from '../controllers/githubController.js';
import { authenticateJWT } from '../middlewares/authMiddleware.js';

const router = express.Router();

router.get('/login', redirectToGitHub);
router.get('/callback',authenticateJWT, handleGitHubCallback);

router.get('/repos', authenticateJWT, getUserRepositories);

router.post('/unlink-github', authenticateJWT, unlinkGitHub);

export default router;
