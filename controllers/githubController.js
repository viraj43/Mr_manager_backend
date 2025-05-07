import axios from 'axios';
import User from '../models/User.js';
import { Octokit } from '@octokit/rest';

const CLIENT_ID = process.env.GITHUB_CLIENT_ID;
const CLIENT_SECRET = process.env.GITHUB_CLIENT_SECRET;


/**
 * Step 1: Redirect user to GitHub's OAuth consent page
 */
export const redirectToGitHub = (req, res) => {
    const redirectUrl = `https://github.com/login/oauth/authorize?client_id=${CLIENT_ID}&scope=repo read:user`;
    res.redirect(redirectUrl);
};

/**
 * Step 2: GitHub redirects back → exchange code for access token
 */
export const handleGitHubCallback = async (req, res) => {
    const { code } = req.query;

    try {
        // Exchange code for token
        const tokenResponse = await axios.post(
            `https://github.com/login/oauth/access_token`,
            {
                client_id: CLIENT_ID,
                client_secret: CLIENT_SECRET,
                code,
            },
            {
                headers: { Accept: 'application/json' },
            }
        );

        const accessToken = tokenResponse.data.access_token;

        // Fetch user profile
        const userResponse = await axios.get(`https://api.github.com/user`, {
            headers: {
                Authorization: `token ${accessToken}`,
            },
        });

        const { login: githubUsername } = userResponse.data;

        // You should tie this to an existing session or user ID
        // For now, update by firebaseUID or email (adjust to your login logic)
        const firebaseUID = "qNicv893l6fHNyOgfxP3qkOHF4m1"; // Use middleware or token if needed

        const updatedUser = await User.findOneAndUpdate(
            { firebaseUID },
            {
                githubUsername,
                githubAccessToken: accessToken,
            },
            { new: true, upsert: false }
        );

        res.json({
            message: 'GitHub connected successfully',
            user: updatedUser,
        });
    } catch (error) {
        console.error('GitHub OAuth error:', error.message);
        res.status(500).json({ message: 'GitHub OAuth failed' });
    }
};

export const getUserRepositories = async (req, res) => {
    const firebaseUID = 'qNicv893l6fHNyOgfxP3qkOHF4m1';

    try {
        const user = await User.findOne({ firebaseUID });

        if (!user || !user.githubAccessToken) {
            return res.status(401).json({ message: 'GitHub not connected for this user' });
        }

        const userOctokit = new Octokit({ auth: user.githubAccessToken });

        const { data } = await userOctokit.repos.listForAuthenticatedUser({
            visibility: 'all', // get both public + private
            per_page: 100,     // adjust if needed
        });

        const repositories = data.map(repo => ({
            name: repo.name,
            owner: repo.owner.login,
            url: repo.html_url,
            fullName: repo.full_name,
            private: repo.private,
        }));

        res.status(200).json(repositories);
    } catch (error) {
        console.error('Error fetching user repositories:', error);
        res.status(500).json({ message: error.message });
    }
};