import express from 'express';
import {
  createProject,
  listUserProjects,
  inviteUserToProject,
  acceptInvitation,
  declineInvitation,
  getInvitationsForUser,
  getProjectById,
} from '../controllers/projectController.js';

import { authenticateJWT } from '../middlewares/authMiddleware.js';

const router = express.Router();

router.post('/', authenticateJWT, createProject);  // apply auth here
router.get('/', authenticateJWT, listUserProjects);
router.get('/:id', authenticateJWT, getProjectById);

router.post('/:id/invite', authenticateJWT, inviteUserToProject); // invite user to project
router.post('/invitation/:id/accept', authenticateJWT, acceptInvitation); // accept invite
router.post('/invitation/:id/decline', authenticateJWT, declineInvitation); // decline invite
router.get('/invitations', authenticateJWT, getInvitationsForUser);

export default router;
