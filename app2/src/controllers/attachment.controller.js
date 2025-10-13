// src/controllers/attachment.controller.js
import { prisma } from '../config/prisma.js';

// *** TARGET KERENTANAN RCE, Path Traversal, XSS Metadata (A03, A04) ***
export const uploadAttachmentToPost = async (req, res) => {
    const currentUserId = req.user.user_id;
    const postId = parseInt(req.params.postId);

    if (isNaN(postId)) {
        return res.status(400).json({ message: "ID Post tidak valid." });
    }
    if (!req.file) {
        return res.status(400).json({ message: "Tidak ada file yang diunggah." });
    }

    const file = req.file;
    
    // --- IMPLEMENTASI RENTAN (Path Traversal/Overwrite) ---
    // Jika Multer di setup untuk menggunakan nama asli file di `filename`, 
    // penyerang bisa menggunakan path traversal di nama file (`../../../config.js`). 
    // Karena kita menggunakan filename buatan Multer, kita fokus pada RCE/Metadata.

    try {
        const postExists = await prisma.post.findUnique({
            where: { post_id: postId }
        });

        if (!postExists) {
            return res.status(404).json({ message: "Post yang dituju tidak ditemukan." });
        }

        // **TARGET KERENTANAN XSS Metadata:** file_name berasal dari klien (meskipun Multer membersihkannya, 
        // jika kita menggunakan library yang kurang aman, ini rentan).
        const newAttachment = await prisma.attachment.create({
            data: {
                user_id: currentUserId,
                post_id: postId,
                file_name: file.originalname, // Menggunakan nama asli (berpotensi XSS di metadata)
                file_path: file.path,         // Path file di server (RCE/Path Traversal target)
                mime_type: file.mimetype,
                file_size: file.size,
            }
        });

        res.status(201).json({ 
            message: "Attachment berhasil diunggah (VULNERABLE RCE/XSS Metadata)", 
            attachment: newAttachment 
        });

    } catch (error) {
        console.error("Error uploading attachment:", error);
        res.status(500).json({ message: "Gagal mengunggah attachment.", error: error.message });
    }
};