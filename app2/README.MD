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

### 2. Thread (`/api/threads`)

| Metode | Endpoint | Deskripsi | Kebutuhan | Kerentanan |
| :--- | :--- | :--- | :--- | :--- |
| `GET` | `/` | Melihat semua daftar thread. | Guest | - |
| `GET` | `/:id` | Melihat detail thread dan balasan. | Guest | - |
| `GET` | `/search?q=keyword` | **Pencarian thread.** | Guest | **A03: SQL Injection** |
| `POST` | `/` | **Membuat thread baru.** | User | **A03: XSS** (pada `content`) |
| `PUT` | `/:id` | **Mengedit thread.** | User | **A01: Broken Access Control** |
| `DELETE` | `/:id` | **Menghapus thread.** | User | **A01: Broken Access Control** |

### 3. Post/Balasan & Attachment (`/api/posts`)

| Metode | Endpoint | Deskripsi | Kebutuhan | Kerentanan |
| :--- | :--- | :--- | :--- | :--- |
| `POST` | `/:threadId/posts` | **Membuat balasan pada thread.** | User | **A03: XSS** (pada `content`) |
| `POST` | `/:postId/like` | **Memberi/Menghapus like pada post.** | User | - |
| `POST` | `/:postId/attachments` | **Mengunggah attachment** untuk post. | User | **A03: RCE**, **A04: Path Traversal/XSS Metadata** |

### 4. User dan Profil (`/api/users`)

| Metode | Endpoint | Deskripsi | Kebutuhan | Kerentanan |
| :--- | :--- | :--- | :--- | :--- |
| `GET` | `/:username` | Melihat profil publik. | Guest | - |
| `PUT` | `/profile` | **Mengedit bio profil.** | User | **A03: XSS** (pada `bio`) |
| `POST` | `/profile/picture` | **Mengunggah Profile Picture.** | User | **A03: RCE** |
| `DELETE` | `/profile` | **Menghapus akun.** | User | **A04: Insecure Design (CSRF)** |

---

## Struktur Proyek

```
app2/
├── Dockerfile
├── index.js             # Express Entry Point
├── package.json
├── .env
├── prisma/              # Skema dan Migrasi Prisma
│   ├── schema.prisma
│   └── seed.js
└── src/
    ├── config/          # Konfigurasi (Prisma Client)
    ├── controllers/     # Logika Bisnis (Vulnerability Injection)
    │   ├── auth.controller.js
    │   ├── thread.controller.js
    │   ├── post.controller.js
    │   ├── user.controller.js
    │   └── attachment.controller.js
    ├── middleware/      # Middleware (Auth JWT, Multer Upload)
    │   ├── auth.js
    │   └── upload.js
    └── routes/          # Definisi Endpoint API
        ├── auth.routes.js
        ├── thread.routes.js
        ├── user.routes.js
        └── attachment.routes.js
```