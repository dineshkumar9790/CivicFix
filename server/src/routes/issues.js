import { Router } from 'express';
import multer from 'multer';
import path from 'path';
import crypto from 'crypto';
import Issue from '../models/Issue.js';
import { protect, authorityOnly } from '../middleware/auth.js';

const router = Router();
const storage = multer.diskStorage({
  destination: (_req, _file, cb) => cb(null, path.resolve('uploads')),
  filename: (_req, file, cb) => cb(null, `${Date.now()}-${crypto.randomBytes(5).toString('hex')}${path.extname(file.originalname).toLowerCase()}`)
});
const upload = multer({ storage, limits: { fileSize: 5 * 1024 * 1024 }, fileFilter: (_req, file, cb) => {
  if (/^image\/(jpeg|png|webp|gif)$/.test(file.mimetype)) cb(null, true);
  else cb(new Error('Only JPG, PNG, WEBP, and GIF images are allowed.'));
}});
router.get('/', async (req, res) => {
  const filter = {};
  if (req.query.status && req.query.status !== 'All') filter.status = req.query.status;
  if (req.query.category && req.query.category !== 'All') filter.category = req.query.category;
  if (req.query.q) filter.$or = [{ title: new RegExp(escapeRegex(req.query.q), 'i') }, { address: new RegExp(escapeRegex(req.query.q), 'i') }, { description: new RegExp(escapeRegex(req.query.q), 'i') }];
  const issues = await Issue.find(filter).populate('createdBy', 'name').sort({ createdAt: -1 }).limit(200);
  res.json(issues);
});
function escapeRegex(s) { return String(s).replace(/[.*+?^${}()|[\]\\]/g, '\\$&'); }

router.post('/', protect, upload.single('photo'), async (req, res) => {
  try {
    const { title, description, category, address, lat, lng } = req.body;
    if (!title?.trim() || !description?.trim()) return res.status(400).json({ message: 'Title and description are required.' });
    const location = {};
    if (lat !== '' && lng !== '' && Number.isFinite(Number(lat)) && Number.isFinite(Number(lng))) { location.lat = Number(lat); location.lng = Number(lng); }
    const issue = await Issue.create({
      title: title.trim(), description: description.trim(), category, address,
      ...(location.lat !== undefined ? { location } : {}),
      photo: req.file ? `/uploads/${req.file.filename}` : '', createdBy: req.user._id
    });
    // Lightweight duplicate suggestion signal: same category within ~150m, unresolved.
    if (issue.location?.lat !== undefined) {
      const nearby = await Issue.find({ _id: { $ne: issue._id }, category: issue.category, status: { $ne: 'Resolved' }, 'location.lat': { $gte: issue.location.lat - 0.0015, $lte: issue.location.lat + 0.0015 }, 'location.lng': { $gte: issue.location.lng - 0.0015, $lte: issue.location.lng + 0.0015 } }).limit(1);
      if (nearby.length) issue.set('duplicateSuggestion', nearby[0]._id.toString(), { strict: false });
    }
    res.status(201).json(issue);
  } catch (e) { res.status(400).json({ message: e.message || 'Could not create issue.' }); }
});
router.post('/:id/upvote', protect, async (req, res) => {
  const issue = await Issue.findById(req.params.id);
  if (!issue) return res.status(404).json({ message: 'Issue not found.' });
  const id = req.user._id;
  const exists = issue.upvotes.some(x => x.equals(id));
  issue.upvotes = exists ? issue.upvotes.filter(x => !x.equals(id)) : [...issue.upvotes, id];
  await issue.save();
  res.json({ upvotes: issue.upvotes.length, upvoted: !exists });
});
router.post('/:id/verify', protect, async (req, res) => {
  const issue = await Issue.findById(req.params.id);
  if (!issue) return res.status(404).json({ message: 'Issue not found.' });
  const id = req.user._id;
  const exists = issue.verifiedBy.some(x => x.equals(id));
  issue.verifiedBy = exists ? issue.verifiedBy.filter(x => !x.equals(id)) : [...issue.verifiedBy, id];
  await issue.save();
  res.json({ verified: !exists, count: issue.verifiedBy.length });
});
router.patch('/:id/status', protect, authorityOnly, async (req, res) => {
  const allowed = ['Reported', 'In Progress', 'Resolved'];
  if (!allowed.includes(req.body.status)) return res.status(400).json({ message: 'Invalid status.' });
  const issue = await Issue.findByIdAndUpdate(req.params.id, { status: req.body.status }, { new: true }).populate('createdBy', 'name');
  if (!issue) return res.status(404).json({ message: 'Issue not found.' });
  res.json(issue);
});
export default router;
