import jwt from 'jsonwebtoken';
import User from '../models/User.js';

export const signToken = (id) =>
  jwt.sign({ id }, process.env.JWT_SECRET, { expiresIn: process.env.JWT_EXPIRES_IN || '7d' });

const load = async (req) => {
  const header = req.headers.authorization || '';
  if (!header.startsWith('Bearer ')) return null;
  try {
    const { id } = jwt.verify(header.slice(7), process.env.JWT_SECRET);
    const user = await User.findById(id);
    return user && user.isActive ? user : null;
  } catch {
    return null;
  }
};

export const protect = async (req, res, next) => {
  const user = await load(req);
  if (!user) return res.status(401).json({ message: 'Not authorised' });
  req.user = user;
  next();
};

export const optionalAuth = async (req, _res, next) => {
  req.user = await load(req);
  next();
};

export const adminOnly = (req, res, next) => {
  if (req.user?.role !== 'admin') return res.status(403).json({ message: 'Admin access required' });
  next();
};
