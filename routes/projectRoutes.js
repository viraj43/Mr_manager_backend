import express from 'express';
import {
  createProject,
  listUserProjects
} from '../controllers/projectController.js';

import { authenticateJWT } from '../middlewares/authMiddleware.js';

const router = express.Router();

router.post('/', authenticateJWT, createProject);  // apply auth here
router.get('/', authenticateJWT, listUserProjects);

export default router;
