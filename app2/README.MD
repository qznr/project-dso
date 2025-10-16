## Apps2 Backend Service - DevSecOps Target

Aplikasi backend ini dikembangkan menggunakan **Node.js (Express.js)** dan **Prisma ORM** dengan database **PostgreSQL**. Tujuan utama proyek ini adalah menyediakan platform forum komunitas yang sengaja **mengandung berbagai kerentanan keamanan** untuk diuji dan didemonstrasikan dalam lingkungan DevSecOps (SAST, DAST).

### Daftar Kerentanan Utama yang Disisipkan

Proyek ini menargetkan kerentanan kritis berdasarkan OWASP Top 10 (2021):

| OWASP ID | Kerentanan | Endpoint Terkait | Mekanisme |
| :--- | :--- | :--- | :--- |
| **A01:2021** | **Broken Access Control (BAC)** | `PUT /api/threads/:id`, `DELETE /api/threads/:id` | User dapat memodifikasi/menghapus thread milik user lain karena tidak ada pengecekan kepemilikan. |
| **A03:2021** | **SQL Injection (SQLi)** | `GET /api/threads/search?q=...` | Input pengguna digabungkan langsung ke query SQL mentah. |
| **A03:2021** | **Cross-Site Scripting (XSS)** | `POST /api/threads`, `POST /api/threads/:id/posts`, `PUT /api/users/profile` | Konten (`title`, `content`, `bio`) disimpan tanpa sanitasi HTML/script yang memadai. |
| **A03:2021** | **Remote Code Execution (RCE)** | `POST /api/users/profile/picture`, `POST /api/posts/:id/attachments` | Validasi tipe file/ekstensi tidak dilakukan secara ketat, memungkinkan upload file berbahaya. |
| **A04:2021** | **Insecure Design (CSRF)** | `DELETE /api/users/profile` | Endpoint DELETE kritis tidak dilindungi oleh token Anti-CSRF. |
| **A04:2021** | **Path Traversal/Overwrite** | `POST /api/posts/:id/attachments` | Kurangnya sanitasi path dan nama file saat penyimpanan file. |


---

## Dokumentasi API Endpoints

Semua endpoint berawalan `/api/`.

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
| `POST` | `/:id/attachments` | Mengunggah attachment untuk thread. (Form Data) | User | - |

#### Detail Endpoint Thread

| Endpoint | Request Body (Contoh) | Response Body (Sukses) |
| :--- | :--- | :--- |
| `GET /?page=1&limit=1` | Query params: `page`, `limit` | ```json { "message": "Daftar thread berhasil diambil.", "data": [ { "thread_id": 1, "title": "Thread Pertama", "content": "Konten thread...", "created_at": "2023-10-27T10:00:00.000Z", "author": { "username": "user1" }, "attachments": [], "_count": { "threadLikes": 5, "posts": 12 } } ], "pagination": { "totalItems": 50, "totalPages": 5, "currentPage": 1, "itemsPerPage": 10 } } ``` |
| `GET /:id` | Path param: `id=1` | ```json { "message": "Detail thread berhasil diambil.", "data": { "thread_id": 1, "title": "Thread Pertama", "content": "Konten thread.", "author": { "username": "user1" }, "attachments": [ { "file_path": "uploads/attachments/..." } ], "_count": { "posts": 12, "threadLikes": 5 } } } ``` |
| `GET /search?q=test' OR 1=1 --` | Query params: `q=keyword` (VULNERABLE SQLi) | ```json { "message": "Hasil pencarian berhasil diambil (VULNERABLE SQLi)", "data": [ { "thread_id": 1, "title": "Test Title", "content": "Test Content", "created_at": "...", "author_username": "user1" } ] } ``` |
| `POST /` | ```json { "title": "Judul Baru", "content": "Ini adalah konten berbahaya: <script>alert('XSS')</script>" } ``` | ```json { "message": "Thread berhasil dibuat (VULNERABLE XSS)", "thread": { "thread_id": 10, "user_id": 5, "title": "Judul Baru", "content": "Ini adalah konten berbahaya: <script>alert('XSS')</script>", "created_at": "..." } } ``` |
| `PUT /:id` | ```json { "content": "Konten diperbarui oleh attacker (VULNERABLE BAC)" } ``` | ```json { "message": "Thread berhasil diperbarui (VULNERABLE BAC)", "thread": { "thread_id": 1, "content": "Konten diperbarui oleh attacker (VULNERABLE BAC)" } } ``` |
| `DELETE /:id` | Path param: `id=1` | ```json { "message": "Thread berhasil dihapus (VULNERABLE BAC)." } ``` |
| `POST /:id/attachments` | `multipart/form-data` dengan field `file` | ```json { "message": "Attachment berhasil diunggah ke thread.", "attachment": { "attachment_id": 1, "file_name": "filename.jpg", "file_path": "uploads/...", "thread_id": 10 } } ``` |

### 3. Post/Balasan & Attachment (`/api/posts`)

| Metode | Endpoint | Deskripsi | Kebutuhan | Kerentanan |
| :--- | :--- | :--- | :--- | :--- |
| `GET` | `/:threadId/posts` | Mengambil semua balasan dalam sebuah thread (Paginasi). | Guest | - |
| `POST` | `/:threadId/posts` | Membuat balasan pada thread. | User | A03: XSS (pada `content`) |
| `PUT` | `/:postId` | Mengedit balasan/post. | User | A01: Broken Access Control |
| `DELETE` | `/:postId` | Menghapus balasan/post. | User | A01: Broken Access Control |
| `POST` | `/:postId/like` | Memberi/Menghapus like pada post. | User | - |
| `POST` | `/:postId/attachments` | Mengunggah attachment untuk post. (Form Data) | User | A03: RCE/XSS Metadata |

#### Detail Endpoint Post dan Attachment

| Endpoint | Request Body (Contoh) | Response Body (Sukses) |
| :--- | :--- | :--- |
| `GET /1/posts` | Query params: `page`, `limit` | ```json { "message": "Daftar balasan berhasil diambil.", "data": [ { "post_id": 1, "content": "Ini balasan pertama.", "author": { "username": "user1" }, "attachments": [], "_count": { "postLikes": 3 } } ], "pagination": { "totalItems": 12, "totalPages": 1, "currentPage": 1, "itemsPerPage": 15 } } ``` |
| `POST /1/posts` | ```json { "content": "Balasan dengan script: <img src=x onerror=alert(document.domain)>" } ``` | ```json { "message": "Balasan berhasil dibuat (VULNERABLE XSS)", "post": { "post_id": 20, "user_id": 5, "thread_id": 1, "content": "Balasan dengan script: ...", "created_at": "..." } } ``` |
| `PUT /:postId` | ```json { "content": "Konten diperbarui oleh attacker (VULNERABLE BAC)" } ``` | ```json { "message": "Balasan berhasil diperbarui (VULNERABLE BAC)", "post": { "post_id": 1, "content": "Konten diperbarui oleh attacker (VULNERABLE BAC)" } } ``` |
| `DELETE /:postId` | Path param: `postId=1` | ```json { "message": "Balasan berhasil dihapus (VULNERABLE BAC)." } ``` |
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
| `GET /profile` | Tidak ada | ```json { "data": { "user_id": 5, "username": "hacker123", "email": "hacker@example.com", "bio": "My awesome bio.", "profile_picture_path": "uploads/profile/...", "created_at": "..." } } ``` |
| `GET /:username` | Path param: `username=user1` | ```json { "data": { "username": "user1", "bio": "General bio.", "profile_picture_path": "uploads/profile/default.png", "created_at": "..." } } ``` |
| `GET /:username/threads` | Path param: `username=user1` | ```json { "message": "Daftar thread oleh user1 berhasil diambil.", "data": [ { "thread_id": 1, "title": "Thread Pertama", "created_at": "...", "_count": { "posts": 12 } } ] } ``` |
| `PUT /profile` | `multipart/form-data` (contoh update bio) | ```json { "message": "Profil berhasil diperbarui", "user": { "user_id": 5, "username": "hacker123", "email": "hacker@example.com", "bio": "New bio with <script>alert('XSS')</script> (VULNERABLE XSS)", "profile_picture_path": "uploads/profile/new_pic.jpg" } } ``` |
| `DELETE /profile` | Tidak ada | ```json { "message": "Akun berhasil dihapus." } ``` |