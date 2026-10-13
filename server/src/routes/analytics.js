import { Router } from 'express';
import Issue from '../models/Issue.js';
import { protect, authorityOnly } from '../middleware/auth.js';
const router = Router();
router.get('/', protect, authorityOnly, async (_req, res) => {
  const [total, reported, progress, resolved, categories] = await Promise.all([
    Issue.countDocuments(), Issue.countDocuments({ status: 'Reported' }),
    Issue.countDocuments({ status: 'In Progress' }), Issue.countDocuments({ status: 'Resolved' }),
    Issue.aggregate([{ $group: { _id: '$category', count: { $sum: 1 } } }, { $sort: { count: -1 } }])
  ]);
  res.json({ total, reported, progress, resolved, resolutionRate: total ? Math.round(resolved / total * 100) : 0, categories });
});
export default router;
