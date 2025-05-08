import {verifyToken}  from "../utils/jwtutility.js";

export const authenticateJWT = (req, res, next) => {
  const token = req.cookies.token;  // Read token from cookies

  if (!token) {
    return res.status(403).json({ message: 'Access denied, no token provided' });
  }

  try {
    // Decode the token
    const decoded = verifyToken(token);
    if (!decoded) {
      return res.status(401).json({ message: 'Invalid token' });
    }
    req.user = decoded;
    next();
  } catch (error) {
    res.status(500).json({ message: 'Error verifying token' });
  }
};
