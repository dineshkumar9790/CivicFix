import { Router } from 'express';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import User from '../models/User.js';
const router = Router();
const tokenFor = user => jwt.sign({ id: user._id }, process.env.JWT_SECRET || 'dev_only_change_me', { expiresIn: '7d' });
router.post('/register', async (req, res) => {
  try {
    const { name, email, password, role = 'resident' } = req.body;
    if (!name?.trim() || !email || !password || password.length < 8) return res.status(400).json({ message: 'Name, email, and password (8+ characters) are required.' });
    const requestedRole = role === 'authority' && process.env.ALLOW_AUTHORITY_REGISTRATION === 'true' ? 'authority' : 'resident';
    const user = await User.create({ name: name.trim(), email, password: await bcrypt.hash(password, 12), role: requestedRole });
    res.status(201).json({ token: tokenFor(user), user: { id: user._id, name: user.name, email: user.email, role: user.role } });
  } catch (e) { res.status(400).json({ message: e.code === 11000 ? 'Email is already registered.' : 'Could not create account.' }); }
});
router.post('/login', async (req, res) => {
  const user = await User.findOne({ email: req.body.email?.toLowerCase() });
  if (!user || !(await bcrypt.compare(req.body.password || '', user.password))) return res.status(401).json({ message: 'Email or password is incorrect.' });
  res.json({ token: tokenFor(user), user: { id: user._id, name: user.name, email: user.email, role: user.role } });
});
export default router;
