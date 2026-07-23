import jwt from 'jsonwebtoken';
import Driver from '../models/Driver.js';
import Admin from '../models/Admin.js';

export const verifyDriverToken = async (req, res, next) => {
  try {
    const authHeader = req.headers.authorization;
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return res.status(401).json({ message: 'Access denied. No token provided.' });
    }

    const token = authHeader.split(' ')[1];
    const jwtSecret = process.env.JWT_SECRET || 'super_secret_fallback_key';

    const decoded = jwt.verify(token, jwtSecret);
    const driver = await Driver.findById(decoded.id).select('-password');
    
    if (!driver) {
      return res.status(401).json({ message: 'Invalid token or driver not found.' });
    }

    req.driver = driver;
    next();
  } catch (error) {
    console.error('Auth verification error:', error.message);
    return res.status(401).json({ message: 'Invalid or expired token.' });
  }
};

export const verifyAdminToken = async (req, res, next) => {
  try {
    const authHeader = req.headers.authorization;
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return res.status(401).json({ message: 'Access denied. Admin token required.' });
    }

    const token = authHeader.split(' ')[1];
    const jwtSecret = process.env.JWT_SECRET || 'super_secret_fallback_key';

    const decoded = jwt.verify(token, jwtSecret);

    if (decoded.role === 'admin') {
      req.admin = decoded;
      return next();
    }

    const admin = await Admin.findById(decoded.id).select('-password');
    if (!admin) {
      return res.status(403).json({ message: 'Access denied. Admin privileges required.' });
    }

    req.admin = admin;
    next();
  } catch (error) {
    console.error('Admin auth verification error:', error.message);
    return res.status(401).json({ message: 'Invalid or expired admin token.' });
  }
};
