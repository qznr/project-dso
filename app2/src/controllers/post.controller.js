import { prisma } from '../config/prisma.js';

// *** TARGET KERENTANAN A03:2021-Injection (XSS) pada 'content' ***
export const createPost = async (req, res) => {
    const currentUserId = req.user.user_id;
    const threadId = parseInt(req.params.threadId);
    const { content } = req.body;

    if (isNaN(threadId) || !content) {
        return res.status(400).json({ message: "ID Thread tidak valid atau konten balasan kosong." });
    }

    try {
        const threadExists = await prisma.thread.findUnique({
            where: { thread_id: threadId }
        });

        if (!threadExists) {
            return res.status(404).json({ message: "Thread yang dituju tidak ditemukan." });
        }

        // ** IMPLEMENTASI RENTAN: Tidak ada sanitasi pada 'content' **
        const newPost = await prisma.post.create({
            data: {
                user_id: currentUserId,
                thread_id: threadId,
                content,
            }
        });

        res.status(201).json({ 
            message: "Balasan berhasil dibuat (VULNERABLE XSS)", 
            post: newPost 
        });

    } catch (error) {
        console.error("Error creating post:", error);
        res.status(500).json({ message: "Gagal membuat balasan.", error: error.message });
    }
};

// *** TARGET KERENTANAN A01:2021-Broken Access Control (BAC) ***
export const updatePost = async (req, res) => {
    const postId = parseInt(req.params.postId);
    const { content } = req.body;

    if (isNaN(postId)) {
        return res.status(400).json({ message: "ID Post tidak valid." });
    }
    if (!content) {
        return res.status(400).json({ message: "Konten tidak boleh kosong." });
    }

    try {
        // --- IMPLEMENTASI RENTAN (BAC): Tidak ada pengecekan kepemilikan ---
        // Seharusnya ada 'user_id: req.user.user_id' di dalam 'where' clause.
        // Tanpa itu, setiap pengguna terotentikasi dapat mengedit post milik siapa pun.
        const updatedPost = await prisma.post.update({
            where: {
                post_id: postId,
            },
            data: {
                content,
            },
        });

        res.status(200).json({
            message: "Balasan berhasil diperbarui (VULNERABLE BAC)",
            post: updatedPost,
        });

    } catch (error) {
        if (error.code === 'P2025') {
            return res.status(404).json({ message: "Balasan tidak ditemukan." });
        }
        console.error("Error updating post:", error);
        res.status(500).json({ message: "Gagal memperbarui balasan.", error: error.message });
    }
};

// *** TARGET KERENTANAN A01:2021-Broken Access Control (BAC) ***
export const deletePost = async (req, res) => {
    const postId = parseInt(req.params.postId);

    if (isNaN(postId)) {
        return res.status(400).json({ message: "ID Post tidak valid." });
    }

    try {
        // --- IMPLEMENTASI RENTAN (BAC): Tidak ada pengecekan kepemilikan ---
        // Sama seperti update, endpoint ini memungkinkan pengguna mana pun
        // untuk menghapus post milik pengguna lain.
        await prisma.post.delete({
            where: {
                post_id: postId,
            },
        });

        res.status(200).json({ message: "Balasan berhasil dihapus (VULNERABLE BAC)." });

    } catch (error) {
        if (error.code === 'P2025') {
            return res.status(404).json({ message: "Balasan tidak ditemukan." });
        }
        console.error("Error deleting post:", error);
        res.status(500).json({ message: "Gagal menghapus balasan.", error: error.message });
    }
};

export const toggleLikePost = async (req, res) => {
    const currentUserId = req.user.user_id;
    const postId = parseInt(req.params.postId);

    if (isNaN(postId)) {
        return res.status(400).json({ message: "ID Post tidak valid." });
    }
    const uniqueKey = { post_id: postId, user_id: currentUserId };

    try {
        const existingLike = await prisma.postLike.findUnique({
            where: {
                post_id_user_id: uniqueKey,
            }
        });

        if (existingLike) {
            await prisma.postLike.delete({
                where: {
                    post_id_user_id: uniqueKey,
                },
            });
            return res.status(200).json({ message: "Unlike berhasil." });

        } else {
            await prisma.postLike.create({
                data: uniqueKey,
            });
            return res.status(201).json({ message: "Like berhasil." });
        }

    } catch (error) {
        console.error("Error toggling like:", error);
        res.status(500).json({ message: "Gagal memproses operasi like.", error: error.message });
    }
};
