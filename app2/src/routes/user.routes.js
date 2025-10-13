import { Router } from 'express';
import { authenticateToken } from '../middleware/auth.js';
import { deleteAccount } from '../controllers/auth.controller.js';
import { getPublicProfile, updateProfile, uploadProfilePic } from '../controllers/user.controller.js';
import { uploadProfilePicture } from '../middleware/upload.js';

const router = Router();

// Guest Access
router.get('/:username', getPublicProfile); 

// User Access
router.delete('/profile', authenticateToken, deleteAccount);
router.put('/profile', authenticateToken, updateProfile); 
router.post('/profile/picture', authenticateToken, uploadProfilePicture, uploadProfilePic); 


export default router;