import { prisma } from '../config/prisma.js';

// Controller untuk melihat daftar thread (Guest Access)
export const getThreads = async (req, res) => {
    try {
        // Ambil semua thread, termasuk nama penulis (User)
        const threads = await prisma.thread.findMany({
            select: {
                thread_id: true,
                title: true,
                content: true,
                created_at: true,
                author: {
                    select: {
                        username: true,
                    }
                },
                _count: {
                    select: { posts: true }
                }
            },
            orderBy: {
                created_at: 'desc',
            }
        });

        res.status(200).json({ 
            message: "Daftar thread berhasil diambil (Prisma Test OK)",
            data: threads
        });

    } catch (error) {
        console.error("Error fetching threads:", error);
        res.status(500).json({ message: "Gagal mengambil data thread dari database.", error: error.message });
    }
};


export const createThread = (req, res) => {
    res.status(200).send({ message: "Thread: Endpoint Buat Thread dipanggil. Membutuhkan otentikasi." });
};