// --- KONFIGURASI API ---
// GANTI LINK INI SAJA KALAU NGROK MATI:
const API_URL = "https://bonnily-profanatory-jordynn.ngrok-free.dev";

const usernameInput = document.getElementById('username');
const passwordInput = document.getElementById('password');
const usernameError = document.getElementById('usernameError');
const passwordError = document.getElementById('passwordError');
const btn = document.querySelector('button');

// Fungsi Reset Error
function clearErrors() {
    usernameError.innerText = "";
    passwordError.innerText = "";
    usernameInput.classList.remove('input-error');
    passwordInput.classList.remove('input-error');
}

// Fungsi Tampilkan Error
function showError(inputElement, errorElement, message) {
    errorElement.innerText = message;
    inputElement.classList.add('input-error');
}

// Event saat tombol Daftar diklik
document.getElementById('registerForm').addEventListener('submit', async (e) => {
    e.preventDefault();
    clearErrors();

    const username = usernameInput.value.trim();
    const password = passwordInput.value.trim();
    let isValid = true;

    // 1. VALIDASI FRONTEND
    if (!username) {
        showError(usernameInput, usernameError, "Username wajib diisi!");
        isValid = false;
    } else if (username.length < 3) {
        showError(usernameInput, usernameError, "Username minimal 3 karakter!");
        isValid = false;
    }

    if (!password) {
        showError(passwordInput, passwordError, "Password wajib diisi!");
        isValid = false;
    } else if (password.length < 4) {
        showError(passwordInput, passwordError, "Password minimal 4 karakter!");
        isValid = false;
    }

    if (!isValid) return;

    // 2. KIRIM KE BACKEND
    const originalBtnText = btn.innerText;
    btn.innerText = "Mendaftarkan...";
    btn.disabled = true;

    try {
        // Gunakan API_URL yang sudah didefinisikan di atas
        const response = await fetch(`${API_URL}/api/register`, {
            method: 'POST',
            headers: { 
                'Content-Type': 'application/json',
                "ngrok-skip-browser-warning": "true" 
            },
            body: JSON.stringify({ username, password })
        });

        // Cek tipe konten respon
        const contentType = response.headers.get("content-type");
        if (!contentType || !contentType.includes("application/json")) {
            throw new Error("Respon server bukan JSON. Cek URL Backend.");
        }

        const result = await response.json();

        if (response.ok) {
            // SUKSES
            alert("✅ Registrasi Berhasil! Silakan Login.");
            window.location.href = 'index.html';
        } else {
            // GAGAL
            const pesanError = result.message || result.error || "Gagal mendaftar";
            
            if (pesanError.includes("Username")) {
                showError(usernameInput, usernameError, pesanError);
            } else {
                showError(passwordInput, passwordError, pesanError);
            }
        }

    } catch (error) {
        console.error("Error Detail:", error);
        
        // --- VALIDASI POPUP SERVER MATI (Di sini letaknya) ---
        if (error.message.includes("Failed to fetch") || error.message.includes("NetworkError")) {
            alert("⚠️ KONEKSI GAGAL!\n\nServer Backend tidak dapat dijangkau.\n\nPastikan:\n1. Laptop Developer menyala\n2. Terminal 'go run main.go' aktif\n3. Terminal 'ngrok' aktif");
        } else {
            // Error lain tetap teks merah
            showError(passwordInput, passwordError, "Terjadi kesalahan sistem.");
        }

    } finally {
        btn.innerText = originalBtnText;
        btn.disabled = false;
    }
});

// Hapus error saat mengetik
usernameInput.addEventListener('input', () => {
    usernameError.innerText = "";
    usernameInput.classList.remove('input-error');
});
passwordInput.addEventListener('input', () => {
    passwordError.innerText = "";
    passwordInput.classList.remove('input-error');
});