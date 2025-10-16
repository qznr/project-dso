import { Router } from 'express';
import { authenticateToken } from '../middleware/auth.js';
import { uploadAttachmentToPost } from '../controllers/attachment.controller.js';
import { uploadAttachment } from '../middleware/upload.js';
import { toggleLikePost } from '../controllers/post.controller.js';

const router = Router();

router.post('/:postId/attachments', 
    authenticateToken, 
    uploadAttachment, 
    uploadAttachmentToPost
);

router.post('/:postId/like', 
    authenticateToken, 
    toggleLikePost
);


export default router;