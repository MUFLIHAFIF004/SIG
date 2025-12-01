# 🗺️ Simulasi Sistem Informasi Geografis (SIG) Berbasis Web

Aplikasi web sederhana untuk memetakan lokasi, menyimpan titik koordinat, dan mengelola data spasial menggunakan peta interaktif. Proyek ini dibuat sebagai simulasi Fullstack GIS.

## 🚀 Fitur Utama

* **Autentikasi User:** Registrasi dan Login akun pengguna.
* **Peta Interaktif:** Menggunakan [LeafletJS](https://leafletjs.com/).
* **CRUD Data Lokasi:**
    * **Create:** Klik peta untuk menambah titik lokasi baru.
    * **Read:** Menampilkan semua lokasi yang tersimpan di Database saat web dibuka.
    * **Update:** Edit nama lokasi & **Drag-and-Drop** marker untuk mengubah posisi.
    * **Delete:** Hapus data lokasi.
* **Persistent Storage:** Data tersimpan aman di MongoDB Atlas (Cloud).

## 🛠️ Teknologi yang Digunakan

* **Frontend:** HTML5, CSS3 (Dark Mode), JavaScript (Vanilla), Leaflet.js.
* **Backend:** Golang (Go) dengan Framework [Fiber](https://gofiber.io/).
* **Database:** MongoDB Atlas.
* **Tunneling:** Ngrok (Untuk menghubungkan Backend lokal ke Internet publik).

## ⚠️ Keterbatasan Sistem (Penting Dibaca!)

Aplikasi ini menggunakan arsitektur **Hybrid (Cloud Frontend + Local Backend)** untuk tujuan simulasi/edukasi tanpa biaya server.

Oleh karena itu, aplikasi ini memiliki syarat operasional:

1.  **Laptop Pembuat Server Wajib Nyala:**
    Backend (`main.go`) berjalan di laptop lokal developer. Jika laptop mati, sleep, atau tidak terhubung internet, fitur Login dan Peta **TIDAK AKAN BERFUNGSI** (hanya tampilan HTML saja yang muncul).

2.  **Sesi Ngrok:**
    Aplikasi menggunakan **Ngrok Free Tier** untuk menghubungkan internet publik ke laptop lokal.
    * URL API akan **berubah** setiap kali Ngrok dimatikan.
    * Setiap kali memulai demo, Anda wajib mengupdate variable `API_URL` di file `docs/map.js`, `register.js`, dan `script.js` dengan link Ngrok terbaru.

3.  **Bukan untuk Production:**
    Setup ini ditujukan untuk **Simulasi/Demo Tugas Akhir**. Untuk penggunaan nyata 24 jam, Backend harus di-deploy ke layanan Cloud Server (seperti Render, AWS, atau GCP).