import { Router } from 'express';
import { getThreads, createThread } from '../controllers/thread.controller.js';
import { authenticateToken } from '../middleware/auth.js';

const router = Router();

// Guest Access
router.get('/', getThreads); 
router.get('/search', searchThreads); // SQL Injection Target
router.get('/:id', getThreadDetail);

// User Access
router.post('/', authenticateToken, createThread); // XSS Target

export default router;