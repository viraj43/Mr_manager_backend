import Project from '../models/Project.js';
import User from '../models/User.js';
import Task from '../models/Task.js';
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
        createdBy: user1._id,  // reference to User who created it
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
  

  import mongoose from 'mongoose';

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
    console.log(total)
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
