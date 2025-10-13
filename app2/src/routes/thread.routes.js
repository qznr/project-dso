import { Router } from 'express';
import { 
    getThreads, 
    createThread, 
    getThreadDetail, 
    searchThreads,
    updateThread,
    deleteThread
} from '../controllers/thread.controller.js';
import { authenticateToken } from '../middleware/auth.js';
import { createPost } from '../controllers/post.controller.js'; 

const router = Router();

// Guest Access
router.get('/', getThreads); 
router.get('/search', searchThreads); // SQL Injection Target
router.get('/:id', getThreadDetail);

// User Access
router.post('/', authenticateToken, createThread); // XSS Target
router.post('/:threadId/posts', authenticateToken, createPost); // XSS Target
router.put('/:id', authenticateToken, updateThread);   // BAC Target
router.delete('/:id', authenticateToken, deleteThread); // BAC Target

export default router;