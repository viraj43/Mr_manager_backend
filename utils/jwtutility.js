import jwt from 'jsonwebtoken';

// Secret key for signing JWT (ensure this is securely stored in environment variables)
const JWT_SECRET = process.env.JWT_SECRET || 'your_jwt_secret_key';
const JWT_EXPIRATION = '6h'; // JWT expiration time (1 hour)

// Function to generate JWT
export const generateToken = (user) => {
  const payload = {
    firebaseUID: user.firebaseUID,
    email: user.email,
    name: user.name,
    role: user.role,
  };

  return jwt.sign(payload, JWT_SECRET, { expiresIn: JWT_EXPIRATION });
};

// Function to verify JWT
export const verifyToken = (token) => {
  try {
    console.log(token);
    // Verify the token and return the decoded payload
    return jwt.verify(token, JWT_SECRET);
  } catch (error) {
    // Log the error for debugging purposes (consider using a logging library in production)
    console.error('JWT Verification failed:', error);
    
    // Return null if verification fails, or you could throw an error or return a custom response
    return null;
  }
};
