import express from 'express';
import {
  createProject,
  updateProject,
  getProjectById,
  checkGitHubRepo,
} from '../controllers/projectController.js';

const router = express.Router();

router.post('/', createProject);
router.put('/:projectId', updateProject);
router.get('/:projectId', getProjectById);
router.get('/github/:owner/:repo', checkGitHubRepo);

export default router;
