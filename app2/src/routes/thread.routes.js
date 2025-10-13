import { Router } from 'express';
import { getThreads, createThread } from '../controllers/thread.controller.js';

const router = Router();

// Guest
router.get('/', getThreads); 

// User
router.post('/', createThread);

export default router;