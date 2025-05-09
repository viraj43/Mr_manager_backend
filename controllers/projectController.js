import Project from '../models/Project.js';
import User from '../models/User.js';
import Task from '../models/Task.js';
import Invitation from '../models/Invitation.js'
import mongoose from 'mongoose';


export const createProject = async (req, res) => {
  try {
    const user = req.user;

    if (!user || !user.githubUsername) {
      return res.status(400).json({ message: 'GitHub account is not connected. Please sync GitHub before creating a project.' });
    }

    const { name, description, gitRepo, tasks, teamMembers } = req.body;

    if (!name || !gitRepo) {
      return res.status(400).json({ message: 'Project name and GitHub repository URL (gitRepo) are required.' });
    }
    let user1 = await User.findOne({ email: req.user.email });



    const newProject = new Project({
      name,
      description,
      gitRepo,
      tasks: tasks || [],
      teamMembers: teamMembers || [],
      createdBy: user1._id,
    });

    await newProject.save();

    res.status(201).json({
      message: 'Project created successfully',
      project: newProject,
    });
  } catch (error) {
    console.error('Error creating project:', error);
    res.status(500).json({ message: 'Server error while creating project' });
  }
};


export const listUserProjects = async (req, res) => {
  try {
    let user = await User.findOne({ email: req.user.email });
    const userId = new mongoose.Types.ObjectId(user._id);  // convert string to ObjectId
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 10;
    const search = req.query.search || '';

    const query = {
      $and: [
        {
          $or: [
            { createdBy: userId },
            { teamMembers: userId },
          ],
        },
        {
          name: { $regex: search, $options: 'i' },
        },
      ],
    };



    const total = await Project.countDocuments(query);
    const projects = await Project.find(query)
      .populate('teamMembers', 'username email')
      .populate('tasks')
      .sort({ createdAt: -1 })
      .skip((page - 1) * limit)
      .limit(limit);
    res.status(200).json({
      message: 'User projects fetched successfully',
      total,
      page,
      pages: Math.ceil(total / limit),
      projects,
    });
  } catch (error) {
    console.error('Error fetching user projects:', error);
    res.status(500).json({ message: 'Server error while fetching projects' });
  }
};

export const getProjectById = async (req, res) => {
  const { id } = req.params;
  const userId = req.user.id;


  try {
    const project = await Project.findOne({ _id: id, createdBy: userId });

    if (!project) {
      return res.status(404).json({ message: 'Project not found or not owned by user' });
    }

    res.json({ project });

  } catch (error) {
    console.error('Error fetching project by ID:', error);
    res.status(500).json({ message: 'Server error' });
  }
};



export const inviteUserToProject = async (req, res) => {
  const { id: projectId } = req.params;
  const { email } = req.body; // get the target email from request body
  const user1 = await User.findOne({ email: req.user.email });
  const inviterId = user1._id
  try {
    const project = await Project.findById(projectId);
    if (!project) return res.status(404).json({ message: 'Project not found' });

    // Check if the inviter is the project owner
    if (project.createdBy.toString() !== inviterId.toString()) {
      return res.status(403).json({ message: 'Only project owner can invite users' });
    }

    // Find the invited user by email
    const invitedUser = await User.findOne({ email });
    if (!invitedUser) {
      return res.status(404).json({ message: 'User with this email not found' });
    }

    // Check if the user is already a team member
    if (project.teamMembers.some(memberId => memberId.toString() === invitedUser._id.toString())) {
      return res.status(400).json({ message: 'User is already a team member' });
    }

    // Check if there's already a pending invitation
    const existingInvite = await Invitation.findOne({
      project: projectId,
      invitedUser: invitedUser._id,
      status: 'pending',
    });

    if (existingInvite) {
      return res.status(400).json({ message: 'User already has a pending invitation' });
    }

    // Create and save the invitation
    const invite = new Invitation({
      project: projectId,
      invitedBy: inviterId,
      invitedUser: invitedUser._id,
    });

    await invite.save();

    res.status(201).json({ message: 'Invitation sent successfully', invite });
  } catch (err) {
    console.error('Error sending invitation:', err);
    res.status(500).json({ message: 'Server error' });
  }
};


// Accept invitation
export const acceptInvitation = async (req, res) => {
  const { id: invitationId } = req.params;
  const userId = req.user.id;

  try {
    const invite = await Invitation.findById(invitationId);
    if (!invite) return res.status(404).json({ message: 'Invitation not found' });
    if (String(invite.invitedUser) !== userId) {
      return res.status(403).json({ message: 'Not authorized to accept this invite' });
    }
    if (invite.status !== 'pending') {
      return res.status(400).json({ message: 'Invitation already responded to' });
    }

    const project = await Project.findById(invite.project);
    if (!project) return res.status(404).json({ message: 'Project not found' });

    // Add user to team if not already there
    if (!project.teamMembers.includes(userId)) {
      project.teamMembers.push(userId);
      await project.save();
    }

    invite.status = 'accepted';
    await invite.save();

    res.json({ message: 'Invitation accepted', project });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Server error' });
  }
};

// Decline invitation
export const declineInvitation = async (req, res) => {
  const { id: invitationId } = req.params;
  const userId = req.user.id;

  try {
    const invite = await Invitation.findById(invitationId);
    if (!invite) return res.status(404).json({ message: 'Invitation not found' });
    if (String(invite.invitedUser) !== userId) {
      return res.status(403).json({ message: 'Not authorized to decline this invite' });
    }
    if (invite.status !== 'pending') {
      return res.status(400).json({ message: 'Invitation already responded to' });
    }

    invite.status = 'declined';
    await invite.save();

    res.json({ message: 'Invitation declined' });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Server error' });
  }
};


export const getInvitationsForUser = async (req, res) => {
  const userId = req.user.id;

  try {
    const invitations = await Invitation.find({ invitedUser: userId })
      .populate('project', 'name description')  // populate project details
      .populate('invitedBy', 'name email')     // populate inviter details
      .sort({ createdAt: -1 });                // newest first

    res.json({ invitations });
  } catch (err) {
    console.error('Error fetching invitations:', err);
    res.status(500).json({ message: 'Server error' });
  }
};