import axios from 'axios';
import User from '../models/User.js';
import { Octokit } from '@octokit/rest';
import { generateToken } from '../utils/jwtutility.js';

const CLIENT_ID = process.env.GITHUB_CLIENT_ID;
const CLIENT_SECRET = GITHUB_CLIENT_SECRET;


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
// In the backend handleGitHubCallback function
export const handleGitHubCallback = async (req, res) => {
  const { code } = req.query;

  try {
    // Exchange code for token
    const tokenResponse = await axios.post(
      `https://github.com/login/oauth/access_token`,
      {
        client_id: process.env.GITHUB_CLIENT_ID,
        client_secret: process.env.GITHUB_CLIENT_SECRET,
        code,
      },
      { headers: { Accept: 'application/json' } }
    );

    const accessToken = tokenResponse.data.access_token;

    // Fetch user profile
    const userResponse = await axios.get(`https://api.github.com/user`, {
      headers: { Authorization: `token ${accessToken}` },
    });

    const { login: githubUsername } = userResponse.data;

    // Find the user by firebaseUID (This is the correct field for identifying the user)
    console.log("this is for me ", req.user);
    let user = await User.findOne({ email: req.user.email });

    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    // If the user exists, update the GitHub username and access token
    user.githubUsername = githubUsername;
    user.githubAccessToken = accessToken;

    await user.save(); // Save the updated user data

    // Generate JWT for the user
    const token = generateToken(user);

    res.cookie('token', token, {
      httpOnly: true,          // Prevents client-side access to the cookie
      secure: true, // Ensures the cookie is sent over HTTPS in production
      sameSite: 'none',      // CSRF protection: cookie is only sent for same-site requests
      maxAge: 24 * 60 * 60 * 1000,
      path: '/' // Set cookie expiration (1 day)
    });

    // Send a success response to the frontend
    res.status(200).json({
      message: 'GitHub OAuth process completed!',
      success: true,  // Indicate success
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

export const unlinkGitHub = async (req, res) => {
  try {
    const user = await User.findOne({ email: req.user.email }); // Get the currently logged-in user

    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    // Remove GitHub-specific data from the user
    user.githubUsername = undefined;
    user.githubAccessToken = undefined;

    await user.save(); // Save the updated user data to the database

    res.status(200).json({ message: 'GitHub account unlinked successfully' });
  } catch (error) {
    console.error('Error unlinking GitHub account:', error.message);
    res.status(500).json({ message: 'Failed to unlink GitHub account' });
  }
};
