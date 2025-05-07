import admin from 'firebase-admin';

export const authenticateFirebaseUser = async (req, res, next) => {
    const authHeader = req.headers.authorization;

    if (!authHeader || !authHeader.startsWith('Bearer ')) {
        return res.status(401).json({ message: 'Missing or invalid token' });
    }

    const idToken = authHeader.split('Bearer ')[1];

    try {
        const decodedToken = await admin.auth().verifyIdToken(idToken);
        req.user = { firebaseUID: decodedToken.uid };
        next();
    } catch (error) {
        res.status(401).json({ message: 'Unauthorized' });
    }
};
