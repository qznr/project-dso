## Apps2 Backend Service - DevSecOps Target

Aplikasi backend ini dikembangkan menggunakan **Node.js (Express.js)** dan **Prisma ORM** dengan database **PostgreSQL**. Tujuan utama proyek ini adalah menyediakan platform forum komunitas yang sengaja **mengandung berbagai kerentanan keamanan** untuk diuji dan didemonstrasikan dalam lingkungan DevSecOps (SAST, DAST).

### Daftar Kerentanan Utama yang Disisipkan

Proyek ini menargetkan kerentanan kritis berdasarkan OWASP Top 10 (2021):

| OWASP ID | Kerentanan | Endpoint Terkait | Mekanisme |
| :--- | :--- | :--- | :--- |
| **A01:2021** | **Broken Access Control (BAC)** | `PUT /api/threads/:id`, `DELETE /api/threads/:id`, `PUT/DELETE /api/posts/:id` | User dapat memodifikasi/menghapus resource milik user lain karena tidak ada pengecekan kepemilikan. |
| **A03:2021** | **SQL Injection (SQLi)** | `GET /api/threads/search?q=...` | Input pengguna digabungkan langsung ke query SQL mentah. |
| **A03:2021** | **Cross-Site Scripting (XSS)** | `POST /api/threads`, `POST /api/threads/:id/posts`, `PUT /api/users/profile` | Konten (`title`, `content`, `bio`) disimpan tanpa sanitasi HTML/script yang memadai. |
| **A03:2021** | **Remote Code Execution (RCE)** | `POST /api/users/profile/picture`, `POST /api/posts/:id/attachments` | Validasi tipe file/ekstensi tidak dilakukan secara ketat, memungkinkan upload file berbahaya. |
| **A04:2021** | **Insecure Design (CSRF)** | `DELETE /api/users/profile` | Endpoint DELETE kritis tidak dilindungi oleh token Anti-CSRF. |
| **A04:2021** | **Path Traversal/LFI** | `GET /api/posts/file?filePath=...` | Endpoint pengambilan file tidak memvalidasi path, memungkinkan akses ke file sistem di luar direktori unggahan. |


---

## Dokumentasi API Endpoints

Semua endpoint berawalan `/api/`.

### Akses File Statis (`/uploads`)

Semua file yang diunggah (profil, attachment thread, attachment post) dapat diakses langsung melalui URL statis.

| Metode | Endpoint | Deskripsi | Kebutuhan |
| :--- | :--- | :--- | :--- |
| `GET` | `/uploads/:path/:filename` | Mengambil file statis (gambar profil, attachment). | Guest |

### 1. Otentikasi (`/api/auth`)

| Metode | Endpoint | Deskripsi | Kebutuhan |
| :--- | :--- | :--- | :--- |
| `POST` | `/register` | Registrasi user baru. | Guest |
| `POST` | `/login` | Login, mengembalikan JWT. | Guest |
| `POST` | `/logout` | Logout (klien harus menghapus JWT). | User |

#### Detail Endpoint Otentikasi

| Endpoint | Request Body (Contoh) | Response Body (Sukses 201/200) |
| :--- | :--- | :--- |
| `POST /register` | ```json { "username": "hacker123", "email": "hacker@example.com", "password": "securepassword123" } ``` | ```json { "message": "Registrasi berhasil.", "user": { "user_id": 5, "username": "hacker123", "email": "hacker@example.com" } } ``` |
| `POST /login` | ```json { "email": "hacker@example.com", "password": "securepassword123" } ``` | ```json { "message": "Login berhasil.", "token": "eyJhbGciOiJIUzI1NiI...", "user": { "user_id": 5, "username": "hacker123", "email": "hacker@example.com" } } ``` |
| `POST /logout` | Tidak ada | ```json { "message": "Logout berhasil." } ``` |

### 2. Thread (`/api/threads`)

| Metode | Endpoint | Deskripsi | Kebutuhan | Kerentanan |
| :--- | :--- | :--- | :--- | :--- |
| `GET` | `/` | Melihat semua daftar thread (Paginasi). | Guest | - |
| `GET` | `/:id` | Melihat detail thread. | Guest | - |
| `GET` | `/search?q=keyword` | Pencarian thread. | Guest | A03: SQL Injection |
| `POST` | `/` | Membuat thread baru. | User | A03: XSS (pada `content`) |
| `PUT` | `/:id` | Mengedit thread. | User | A01: Broken Access Control |
| `DELETE` | `/:id` | Menghapus thread. | User | A01: Broken Access Control |
| `POST` | `/:id/like` | Memberi/Menghapus like pada thread. | User | - |
| `POST` | `/:id/attachments` | Mengunggah attachment untuk thread. (Form Data) | User | A03: RCE/XSS Metadata |
| `GET` | `/:threadId/posts` | Mengambil semua balasan dalam sebuah thread (Paginasi). | Guest | - |
| `POST` | `/:threadId/posts` | Membuat balasan pada thread. | User | A03: XSS (pada `content`) |

#### Detail Endpoint Thread

| Endpoint | Request Body (Contoh) | Response Body (Sukses) |
| :--- | :--- | :--- |
| `GET /?page=1&limit=1` | Query params: `page`, `limit` | ```json { "message": "Daftar thread berhasil diambil.", "data": [ { "thread_id": 1, "title": "Thread Pertama", "content": "Konten thread...", "created_at": "...", "author": { "username": "user1" }, "attachments": [ { "file_path": "uploads/attachments/..." } ], "_count": { "threadLikes": 5, "posts": 12 } } ], "pagination": { "totalItems": 50, "totalPages": 5, "currentPage": 1, "itemsPerPage": 10 } } ``` |
| `POST /:id/attachments` | `multipart/form-data` dengan field `file` | ```json { "message": "Attachment berhasil diunggah ke thread.", "attachment": { "attachment_id": 1, "file_name": "filename.jpg", "file_path": "uploads/attachments/...", "thread_id": 10 } } ``` |

### 3. Post/Balasan & Attachment (`/api/posts`)

| Metode | Endpoint | Deskripsi | Kebutuhan | Kerentanan |
| :--- | :--- | :--- | :--- | :--- |
| `PUT` | `/:postId` | Mengedit balasan/post. | User | A01: Broken Access Control |
| `DELETE` | `/:postId` | Menghapus balasan/post. | User | A01: Broken Access Control |
| `POST` | `/:postId/like` | Memberi/Menghapus like pada post. | User | - |
| **`GET`** | **`/file?filePath=...`** | **Mengambil attachment berdasarkan path.** | **Guest** | **A04: Path Traversal/LFI** |
| **`GET`** | **`/:id`** | **Mengambil attachment berdasarkan ID.** | **Guest** | **A04: Path Traversal/LFI (via DB)** |
| `POST` | `/:postId/attachments` | Mengunggah attachment untuk post. (Form Data) | User | A03: RCE/XSS Metadata |

#### Detail Endpoint Post dan Attachment

| Endpoint | Request Body (Contoh) | Response Body (Sukses) |
| :--- | :--- | :--- |
| `GET /file?filePath=attachments/abc.jpg` | Query params: `filePath` (VULNERABLE LFI) | Mengembalikan file yang diminta. Jika path dimanipulasi (`filePath=../index.js`), server akan mengembalikan file sistem yang sensitif. |
| `POST /:postId/attachments` | `multipart/form-data` dengan field `file` | ```json { "message": "Attachment berhasil diunggah (VULNERABLE RCE/XSS Metadata)", "attachment": { "attachment_id": 2, "file_name": "evil_payload.php.jpg", "file_path": "uploads/attachments/...", "mime_type": "image/jpeg" } } ``` |

### 4. User dan Profil (`/api/users`)

| Metode | Endpoint | Deskripsi | Kebutuhan | Kerentanan |
| :--- | :--- | :--- | :--- | :--- |
| `GET` | `/profile` | Melihat profil pengguna sendiri. | User | - |
| `GET` | `/:username` | Melihat profil publik pengguna lain. | Guest | - |
| `GET` | `/:username/threads` | Melihat daftar thread yang dibuat oleh pengguna. | Guest | - |
| `PUT` | `/profile` | Mengedit profil (mengizinkan perubahan username, email, bio, password, atau profile picture). (Form Data) | User | A03: XSS (pada `bio`) dan A03: RCE (melalui upload gambar) |
| `DELETE` | `/profile` | Menghapus akun. | User | A04: Insecure Design (CSRF) |

#### Detail Endpoint User dan Profil

| Endpoint | Request Body (Contoh) | Response Body (Sukses) |
| :--- | :--- | :--- |
| `PUT /profile` | `multipart/form-data` (contoh update bio) | ```json { "message": "Profil berhasil diperbarui", "user": { "user_id": 5, "username": "hacker123", "email": "hacker@example.com", "bio": "New bio with <script>alert('XSS')</script> (VULNERABLE XSS)", "profile_picture_path": "uploads/profile/new_pic.jpg" } } ``` |
| `DELETE /profile` | Tidak ada | ```json { "message": "Akun berhasil dihapus." } ``` |