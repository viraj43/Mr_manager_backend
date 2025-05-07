import express from 'express';
import {
  redirectToGitHub,
  handleGitHubCallback,
  getUserRepositories
} from '../controllers/githubController.js';

const router = express.Router();

router.get('/login', redirectToGitHub);
router.get('/callback', handleGitHubCallback);

router.get('/repos', getUserRepositories);

export default router;
