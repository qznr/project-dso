import { Router } from 'express';
import { authenticateToken } from '../middleware/auth.js';
import { deleteAccount, getPublicProfile, updateProfile, getOwnProfile, getUserThreads } from '../controllers/user.controller.js';
import { uploadProfilePicture } from '../middleware/upload.js';

const router = Router();

// Guest Access
router.get('/:username', getPublicProfile); 
router.get('/:username/threads', getUserThreads);

// User Access
router.get('/profile', authenticateToken, getOwnProfile);
router.delete('/profile', authenticateToken, deleteAccount);
router.put('/profile', authenticateToken, uploadProfilePicture, updateProfile); 

export default router;