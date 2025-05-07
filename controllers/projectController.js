import Project from '../models/Project.js';
import User from '../models/User.js';
import { Octokit } from '@octokit/rest';

/**
 * Create a new project
 */
export const createProject = async (req, res) => {
    const { name, description, gitRepo, teamMembers } = req.body;
    /**
     * gitRepo should be an object:
     * {
     *   owner: 'username-or-org',
     *   name: 'repo-name',
     *   url: 'https://github.com/username-or-org/repo-name'
     * }
     */

    if (!gitRepo || !gitRepo.owner || !gitRepo.name || !gitRepo.url) {
        return res.status(400).json({ message: 'Invalid or missing gitRepo details' });
    }

    try {
        const project = new Project({
            name,
            description,
            gitRepo: {
                owner: gitRepo.owner,
                name: gitRepo.name,
                url: gitRepo.url,
            },
            teamMembers, // expects array of User IDs
        });

        await project.save();

        res.status(201).json({ message: 'Project created successfully', project });
    } catch (error) {
        console.error('Error creating project:', error);
        res.status(500).json({ message: error.message });
    }
};

/**
 * Update project by adding tasks or team members
 */
export const updateProject = async (req, res) => {
    const { projectId } = req.params;
    const { tasks, teamMembers } = req.body;

    try {
        const project = await Project.findById(projectId);
        if (!project) {
            return res.status(404).json({ message: 'Project not found' });
        }

        if (tasks && tasks.length > 0) {
            project.tasks.push(...tasks);
        }

        if (teamMembers && teamMembers.length > 0) {
            project.teamMembers.push(...teamMembers);
        }

        await project.save();

        res.status(200).json({ message: 'Project updated successfully', project });
    } catch (error) {
        console.error('Error updating project:', error);
        res.status(500).json({ message: error.message });
    }
};

/**
 * Get project by ID with populated tasks and team members
 */
export const getProjectById = async (req, res) => {
    const { projectId } = req.params;

    try {
        const project = await Project.findById(projectId)
            .populate('tasks')
            .populate('teamMembers');

        if (!project) {
            return res.status(404).json({ message: 'Project not found' });
        }

        res.status(200).json(project);
    } catch (error) {
        console.error('Error fetching project:', error);
        res.status(500).json({ message: error.message });
    }
};

/**
 * Check GitHub repository status (using user's GitHub token)
 */
export const checkGitHubRepo = async (req, res) => {
    const { owner, repo } = req.params;
    const firebaseUID = req.user?.firebaseUID; // This assumes you're adding user info to req.user via middleware

    try {
        const user = await User.findOne({ firebaseUID });

        if (!user || !user.githubAccessToken) {
            return res.status(401).json({ message: 'GitHub not connected for this user' });
        }

        const userOctokit = new Octokit({ auth: user.githubAccessToken });

        const { data } = await userOctokit.repos.get({
            owner,
            repo,
        });

        res.status(200).json({
            name: data.name,
            description: data.description,
            url: data.html_url,
            updated_at: data.updated_at,
            default_branch: data.default_branch,
            open_issues: data.open_issues_count,
            forks: data.forks_count,
            watchers: data.watchers_count,
        });
    } catch (error) {
        console.error('Error fetching GitHub repo:', error);
        res.status(500).json({ message: error.message });
    }
};
