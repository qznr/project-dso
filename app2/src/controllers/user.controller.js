import { prisma } from '../config/prisma.js';

export const getPublicProfile = async (req, res) => {
    const { username } = req.params;

    try {
        const user = await prisma.user.findUnique({
            where: { username },
            select: {
                username: true,
                bio: true,
                profile_picture_path: true,
                created_at: true,
            }
        });

        if (!user) {
            return res.status(404).json({ message: "Pengguna tidak ditemukan." });
        }

        res.status(200).json({ data: user });

    } catch (error) {
        console.error("Error fetching public profile:", error);
        res.status(500).json({ message: "Gagal mengambil profil publik.", error: error.message });
    }
};

// *** TARGET KERENTANAN A03:2021-Injection (XSS) pada field bio ***
export const updateProfile = async (req, res) => {
    const currentUserId = req.user.user_id;
    const { bio } = req.body;

    if (!bio) {
        return res.status(400).json({ message: "Data yang diubah tidak valid." });
    }

    try {
        // ** IMPLEMENTASI RENTAN: Tidak ada sanitasi pada 'bio' **
        const updatedUser = await prisma.user.update({
            where: { user_id: currentUserId },
            data: { bio },
            select: { user_id: true, username: true, bio: true }
        });

        res.status(200).json({ 
            message: "Profil berhasil diperbarui (VULNERABLE XSS pada bio)", 
            user: updatedUser 
        });

    } catch (error) {
        console.error("Error updating profile:", error);
        res.status(500).json({ message: "Gagal memperbarui profil.", error: error.message });
    }
};

export const uploadProfilePic = async (req, res) => {
    const currentUserId = req.user.user_id;

    if (!req.file) {
        return res.status(400).json({ message: "Tidak ada file yang diunggah." });
    }

    // Path relatif file yang diunggah (contoh: uploads/profiles/user-1-12345.jpg)
    const filePath = req.file.path; 

    // --- IMPLEMENTASI RENTAN (RCE): Hanya mengandalkan ekstensi file dari klien ---
    // Di sini kita TIDAK melakukan validasi tipe MIME atau memeriksa magic bytes.
    // Jika penyerang mengunggah file yang terlihat seperti JPG tapi berisi Shell code,
    // dan ekstensi file diabaikan atau disalahgunakan (misal: "image.sh.jpg"), 
    // sistem rentan dieksekusi jika server web (Nginx) salah konfigurasi.

    try {
        // Update database dengan path baru
        const updatedUser = await prisma.user.update({
            where: { user_id: currentUserId },
            data: { profile_picture_path: filePath },
            select: { username: true, profile_picture_path: true }
        });

        res.status(200).json({ 
            message: "Gambar profil berhasil diunggah (VULNERABLE RCE)", 
            user: updatedUser 
        });

    } catch (error) {
        console.error("Error uploading profile picture:", error);
        res.status(500).json({ message: "Gagal mengunggah gambar profil.", error: error.message });
    }
};
