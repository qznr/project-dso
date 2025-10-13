import { Router } from 'express';
import { authenticateToken } from '../middleware/auth.js';
import { deleteAccount } from '../controllers/auth.controller.js';

const router = Router();

router.delete('/profile', authenticateToken, deleteAccount);


export default router;