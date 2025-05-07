import mongoose from 'mongoose';

const projectSchema = new mongoose.Schema({
  name: {
    type: String,
    required: true,
  },
  description: {
    type: String,
  },
  tasks: [
    {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Task',
    },
  ],
  teamMembers: [
    {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
    },
  ],
  gitRepo: {
    type: String,  // store the GitHub repository URL
    required: true,
  },
}, {
  timestamps: true,  // adds createdAt and updatedAt fields
});

const Project = mongoose.model('Project', projectSchema);

export default Project;
