# Buku Setaman - Educational Storybook Platform

Buku Setaman adalah platform cerita edukatif yang memungkinkan guru untuk mengunggah cerita dengan ilustrasi dan narasi yang dihasilkan AI. Platform ini mendukung multi-bahasa (Bahasa Sunda, Bahasa Indonesia, dan Bahasa Inggris) dan menyediakan pengalaman membaca yang interaktif untuk siswa.

## Fitur Utama

### 📚 Pembaca Buku Interaktif
- Animasi membalik halaman yang halus
- Highlight teks saat dibacakan (read-along)
- Kontrol ukuran teks dan font yang dapat disesuaikan
- Bookmark dan penyimpanan progress
- Dropdown pemilihan bahasa yang persisten

### 👨‍🏫 Dashboard Guru
- Upload dan kelola cerita
- Fitur bulk upload untuk multiple file
- Manajemen konten dengan draft/published
- Integrasi AI untuk ilustrasi dan narasi otomatis

### 🤖 Integrasi AI
- Generasi ilustrasi otomatis menggunakan DALL-E
- Text-to-speech untuk narasi cerita
- Powered by OpenAI API

### 👑 Panel Admin
- Kelola modul pelatihan (PPT, PDF, blog post)
- Manajemen pengguna dan role
- Dashboard statistik

## Teknologi

- **Framework**: Next.js 14 dengan App Router
- **Styling**: Tailwind CSS v4
- **UI Components**: shadcn/ui
- **AI Integration**: OpenAI API (DALL-E, TTS)
- **Authentication**: Role-based (Admin, Teacher, Public)
- **Database**: Mock data (mudah dikonversi ke SQLite)

## Setup dan Instalasi

### 1. Clone Repository
\`\`\`bash
git clone <repository-url>
cd buku-setaman
\`\`\`

### 2. Install Dependencies
\`\`\`bash
npm install
\`\`\`

### 3. Environment Variables
Buat file `.env.local` dan tambahkan:
\`\`\`env
OPENAI_API_KEY=your_openai_api_key_here
\`\`\`

### 4. Jalankan Development Server
\`\`\`bash
npm run dev
\`\`\`

Buka [http://localhost:3000](http://localhost:3000) di browser Anda.

## Deploy ke Vercel

### 1. Push ke GitHub
\`\`\`bash
git add .
git commit -m "Initial commit"
git push origin main
\`\`\`

### 2. Deploy ke Vercel
1. Kunjungi [vercel.com](https://vercel.com)
2. Import repository GitHub Anda
3. Tambahkan environment variable `OPENAI_API_KEY` di Vercel dashboard
4. Deploy!

### 3. Environment Variables di Vercel
Di Vercel dashboard, tambahkan:
- `OPENAI_API_KEY`: API key OpenAI Anda

## Struktur User Roles

### Public
- Membaca cerita yang dipublikasi
- Akses fitur pembaca interaktif

### Teacher (Guru)
- Semua fitur Public
- Upload dan kelola cerita
- Akses modul pelatihan
- Dashboard manajemen konten

### Admin
- Semua fitur Teacher
- Kelola pengguna dan role
- Upload modul pelatihan
- Dashboard admin lengkap

## Akun Default

Untuk testing, gunakan akun berikut:

**Admin:**
- Email: admin@bukusetaman.com
- Password: admin123

**Teacher:**
- Email: guru@bukusetaman.com
- Password: guru123

## Konversi ke Database

Aplikasi ini menggunakan mock data yang mudah dikonversi ke SQLite atau database lainnya. Struktur data sudah disiapkan di `lib/mock-data.ts` dan `lib/types.ts`.

## Kontribusi

1. Fork repository
2. Buat feature branch (`git checkout -b feature/AmazingFeature`)
3. Commit perubahan (`git commit -m 'Add some AmazingFeature'`)
4. Push ke branch (`git push origin feature/AmazingFeature`)
5. Buat Pull Request

## Lisensi

Distributed under the MIT License. See `LICENSE` for more information.

## Kontak

Buku Setaman Team - info@bukusetaman.com

Project Link: [https://github.com/yourusername/buku-setaman](https://github.com/yourusername/buku-setaman)
\`\`\`

```json file="" isHidden
